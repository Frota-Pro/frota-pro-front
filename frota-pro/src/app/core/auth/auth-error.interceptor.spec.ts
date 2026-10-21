import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AuthService } from './auth.service';
import { authErrorInterceptor } from './auth-error.interceptor';

describe('authErrorInterceptor', () => {
  let http: HttpClient;
  let mock: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;
  let toast: jasmine.SpyObj<ToastService>;
  let router: { navigate: jasmine.Spy; url: string };

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthRequest', 'refreshSession', 'forceLogout']);
    auth.isAuthRequest.and.callFake(
      (url: string) => url.endsWith('/login') || url.endsWith('/login/refresh') || url.endsWith('/login/logout')
    );
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['warn']);
    router = { navigate: jasmine.createSpy('navigate'), url: '/dashboard' };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    mock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => mock.verify());

  const naoAutorizado = { status: 401, statusText: 'Unauthorized' };

  describe('401 em rota protegida', () => {
    it('renova a sessão e repete a requisição com o token novo', () => {
      auth.refreshSession.and.returnValue(of({ accessToken: 'novo', refreshToken: 'r' } as any));
      let resposta: unknown;

      http.get('/api/carga').subscribe((r) => (resposta = r));
      mock.expectOne('/api/carga').flush({}, naoAutorizado);

      const repetida = mock.expectOne('/api/carga');
      expect(repetida.request.headers.get('Authorization')).toBe('Bearer novo');
      repetida.flush({ ok: true });

      expect(resposta).toEqual({ ok: true });
      expect(auth.forceLogout).not.toHaveBeenCalled();
    });

    it('se a renovação é recusada derruba a sessão, avisa e vai para o login', () => {
      auth.refreshSession.and.returnValue(
        throwError(() => ({ status: 401 }))
      );
      let erro: any;

      http.get('/api/carga').subscribe({ error: (e) => (erro = e) });
      mock.expectOne('/api/carga').flush({}, naoAutorizado);

      expect(auth.forceLogout).toHaveBeenCalled();
      expect(toast.warn).toHaveBeenCalledWith('Sua sessão expirou. Faça login novamente.');
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(erro.status).toBe(401);
    });

    it('falha de rede na renovação não derruba a sessão', () => {
      auth.refreshSession.and.returnValue(throwError(() => ({ status: 0 })));
      let erro: any;

      http.get('/api/carga').subscribe({ error: (e) => (erro = e) });
      mock.expectOne('/api/carga').flush({}, naoAutorizado);

      expect(auth.forceLogout).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(erro.status).toBe(401);
    });

    it('se a repetição também dá 401 a sessão é derrubada uma vez só', () => {
      auth.refreshSession.and.returnValue(of({ accessToken: 'novo', refreshToken: 'r' } as any));

      http.get('/api/carga').subscribe({ error: () => {} });
      mock.expectOne('/api/carga').flush({}, naoAutorizado);
      mock.expectOne('/api/carga').flush({}, naoAutorizado);

      expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('outros erros', () => {
    it('401 no login passa direto, sem tentar renovar', () => {
      let erro: any;

      http.post('/api/login', {}).subscribe({ error: (e) => (erro = e) });
      mock.expectOne('/api/login').flush({}, naoAutorizado);

      expect(auth.refreshSession).not.toHaveBeenCalled();
      expect(auth.forceLogout).not.toHaveBeenCalled();
      expect(erro.status).toBe(401);
    });

    it('erros que não são 401 passam direto', () => {
      let erro: any;

      http.get('/api/carga').subscribe({ error: (e) => (erro = e) });
      mock.expectOne('/api/carga').flush({}, { status: 500, statusText: 'Server Error' });

      expect(auth.refreshSession).not.toHaveBeenCalled();
      expect(erro.status).toBe(500);
    });

    it('403 com aviso de senha provisória leva para a troca de senha', () => {
      http.get('/api/carga').subscribe({ error: () => {} });
      mock.expectOne('/api/carga').flush({}, {
        status: 403,
        statusText: 'Forbidden',
        headers: { 'X-Must-Change-Password': 'true' },
      });

      expect(router.navigate).toHaveBeenCalledWith(['/trocar-senha']);
    });

    it('não navega de novo se já está na tela de troca de senha', () => {
      router.url = '/trocar-senha';

      http.get('/api/carga').subscribe({ error: () => {} });
      mock.expectOne('/api/carga').flush({}, {
        status: 403,
        statusText: 'Forbidden',
        headers: { 'X-Must-Change-Password': 'true' },
      });

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('403 comum não leva para a troca de senha', () => {
      http.get('/api/carga').subscribe({ error: () => {} });
      mock.expectOne('/api/carga').flush({}, { status: 403, statusText: 'Forbidden' });

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
