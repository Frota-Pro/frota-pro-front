import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

const ACCESS = 'FP_ACCESS_TOKEN';
const REFRESH = 'FP_REFRESH_TOKEN';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('login', () => {
    it('grava os dois tokens e passa a estar logado', () => {
      expect(service.isLoggedIn()).toBeFalse();

      service.login({ login: 'admin', senha: 'x' } as any).subscribe();
      const req = http.expectOne(`${base}/login`);
      expect(req.request.method).toBe('POST');
      req.flush({ accessToken: 'acesso', refreshToken: 'refresh' });

      expect(localStorage.getItem(ACCESS)).toBe('acesso');
      expect(localStorage.getItem(REFRESH)).toBe('refresh');
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.getAccessToken()).toBe('acesso');
      expect(service.getRefreshToken()).toBe('refresh');
    });

    it('login recusado não grava nada', () => {
      service.login({ login: 'admin', senha: 'errada' } as any).subscribe({ error: () => {} });
      http.expectOne(`${base}/login`).flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(service.isLoggedIn()).toBeFalse();
    });
  });

  describe('refreshSession', () => {
    it('sem refresh token falha sem chamar o servidor', (done) => {
      service.refreshSession().subscribe({
        error: (e) => {
          expect(e.message).toContain('Refresh token ausente');
          done();
        },
      });
    });

    it('envia o refresh token e troca os dois tokens', () => {
      localStorage.setItem(REFRESH, 'refresh-velho');

      service.refreshSession().subscribe();
      const req = http.expectOne(`${base}/login/refresh`);
      expect(req.request.body).toEqual({ refreshToken: 'refresh-velho' });
      req.flush({ accessToken: 'acesso-novo', refreshToken: 'refresh-novo' });

      expect(service.getAccessToken()).toBe('acesso-novo');
      expect(service.getRefreshToken()).toBe('refresh-novo');
    });

    it('várias renovações ao mesmo tempo viram uma só chamada', () => {
      localStorage.setItem(REFRESH, 'r');

      service.refreshSession().subscribe();
      service.refreshSession().subscribe();
      service.refreshSession().subscribe();

      const reqs = http.match(`${base}/login/refresh`);
      expect(reqs.length).toBe(1);
      reqs[0].flush({ accessToken: 'a', refreshToken: 'r2' });
    });

    it('depois de terminar, uma nova renovação faz outra chamada', () => {
      localStorage.setItem(REFRESH, 'r');

      service.refreshSession().subscribe();
      http.expectOne(`${base}/login/refresh`).flush({ accessToken: 'a1', refreshToken: 'r1' });

      service.refreshSession().subscribe();
      http.expectOne(`${base}/login/refresh`).flush({ accessToken: 'a2', refreshToken: 'r2' });

      expect(service.getAccessToken()).toBe('a2');
    });
  });

  describe('logout', () => {
    it('sem refresh token só limpa a sessão local', (done) => {
      localStorage.setItem(ACCESS, 'a');

      service.logout().subscribe(() => {
        expect(service.isLoggedIn()).toBeFalse();
        done();
      });
    });

    it('com refresh token avisa o servidor e limpa a sessão', () => {
      localStorage.setItem(ACCESS, 'a');
      localStorage.setItem(REFRESH, 'r');

      service.logout().subscribe();
      const req = http.expectOne(`${base}/login/logout`);
      expect(req.request.body).toEqual({ refreshToken: 'r' });
      req.flush(null);

      expect(localStorage.getItem(ACCESS)).toBeNull();
      expect(localStorage.getItem(REFRESH)).toBeNull();
    });

    it('limpa a sessão mesmo se o servidor falhar', () => {
      localStorage.setItem(ACCESS, 'a');
      localStorage.setItem(REFRESH, 'r');

      service.logout().subscribe({ error: () => {} });
      http.expectOne(`${base}/login/logout`).flush({}, { status: 500, statusText: 'Server Error' });

      expect(service.isLoggedIn()).toBeFalse();
    });

    it('forceLogout limpa tokens do localStorage e do sessionStorage', () => {
      localStorage.setItem(ACCESS, 'a');
      localStorage.setItem(REFRESH, 'r');
      sessionStorage.setItem(ACCESS, 'a');
      sessionStorage.setItem(REFRESH, 'r');

      service.forceLogout();

      expect(localStorage.getItem(ACCESS)).toBeNull();
      expect(localStorage.getItem(REFRESH)).toBeNull();
      expect(sessionStorage.getItem(ACCESS)).toBeNull();
      expect(sessionStorage.getItem(REFRESH)).toBeNull();
    });
  });

  describe('isAuthRequest', () => {
    it('reconhece as três rotas de autenticação', () => {
      expect(service.isAuthRequest(`${base}/login`)).toBeTrue();
      expect(service.isAuthRequest(`${base}/login/refresh`)).toBeTrue();
      expect(service.isAuthRequest(`${base}/login/logout`)).toBeTrue();
    });

    it('não confunde com outras rotas', () => {
      expect(service.isAuthRequest(`${base}/carga`)).toBeFalse();
      expect(service.isAuthRequest(`${base}/login/outra`)).toBeFalse();
      expect(service.isAuthRequest(`${base}/loginx`)).toBeFalse();
    });
  });
});
