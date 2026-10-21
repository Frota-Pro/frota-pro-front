import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { AuthMeResponse } from './auth-user.model';
import { AuthUserService } from './auth-user.service';

function usuario(authorities?: string[]): AuthMeResponse {
  return { authorities } as AuthMeResponse;
}

describe('AuthUserService', () => {
  let service: AuthUserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthUserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('começa sem usuário', () => {
    expect(service.snapshot).toBeNull();
  });

  it('loadMe busca /auth/me e guarda o usuário', (done) => {
    service.loadMe().subscribe((u) => {
      expect(u.authorities).toEqual(['ROLE_ADMIN']);
      expect(service.snapshot).toBe(u);
      done();
    });

    const req = http.expectOne(`${environment.apiUrl}/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(usuario(['ROLE_ADMIN']));
  });

  it('user$ avisa quem está ouvindo quando o usuário chega e quando sai', () => {
    const recebidos: (AuthMeResponse | null)[] = [];
    service.user$.subscribe((u) => recebidos.push(u));

    service.loadMe().subscribe();
    http.expectOne(`${environment.apiUrl}/auth/me`).flush(usuario(['ROLE_CONSULTA']));
    service.clear();

    expect(recebidos.length).toBe(3);
    expect(recebidos[0]).toBeNull();
    expect(recebidos[1]?.authorities).toEqual(['ROLE_CONSULTA']);
    expect(recebidos[2]).toBeNull();
  });

  it('clear esquece o usuário', () => {
    service.loadMe().subscribe();
    http.expectOne(`${environment.apiUrl}/auth/me`).flush(usuario(['ROLE_ADMIN']));

    service.clear();

    expect(service.snapshot).toBeNull();
  });

  describe('getRoleLabel', () => {
    it('sem usuário ou sem perfis mostra SEM PERFIL', () => {
      expect(service.getRoleLabel(null)).toBe('SEM PERFIL');
      expect(service.getRoleLabel(usuario(undefined))).toBe('SEM PERFIL');
      expect(service.getRoleLabel(usuario([]))).toBe('SEM PERFIL');
    });

    it('escolhe o perfil mais alto', () => {
      expect(service.getRoleLabel(usuario(['ROLE_CONSULTA', 'ROLE_ADMIN']))).toBe('ADMIN');
      expect(service.getRoleLabel(usuario(['ROLE_OPERADOR', 'ROLE_GESTOR']))).toBe('GESTOR');
      expect(service.getRoleLabel(usuario(['ROLE_CONSULTA', 'ROLE_OPERADOR']))).toBe('OPERADOR');
      expect(service.getRoleLabel(usuario(['ROLE_CONSULTA']))).toBe('CONSULTA');
    });

    it('perfil fora da lista mostra o nome sem o prefixo ROLE_', () => {
      expect(service.getRoleLabel(usuario(['ROLE_MOTORISTA']))).toBe('MOTORISTA');
    });
  });
});
