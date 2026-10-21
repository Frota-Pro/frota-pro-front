import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let mock: HttpTestingController;
  let token: string | null;

  beforeEach(() => {
    token = 'meu-token';
    const authFake = {
      getAccessToken: () => token,
      isAuthRequest: (url: string) => url.endsWith('/login') || url.endsWith('/login/refresh') || url.endsWith('/login/logout'),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authFake },
      ],
    });
    http = TestBed.inject(HttpClient);
    mock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => mock.verify());

  it('manda o token no cabeçalho Authorization', () => {
    http.get('/api/carga').subscribe();

    const req = mock.expectOne('/api/carga');
    expect(req.request.headers.get('Authorization')).toBe('Bearer meu-token');
    req.flush({});
  });

  it('não manda cabeçalho nenhum quando não há token', () => {
    token = null;

    http.get('/api/carga').subscribe();

    const req = mock.expectOne('/api/carga');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('não coloca o token nas rotas de login, renovação e logout', () => {
    http.post('/api/login', {}).subscribe();
    http.post('/api/login/refresh', {}).subscribe();
    http.post('/api/login/logout', {}).subscribe();

    for (const url of ['/api/login', '/api/login/refresh', '/api/login/logout']) {
      const req = mock.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    }
  });
});
