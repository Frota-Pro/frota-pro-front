import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { adminGuard } from './admin.guard';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthUserService } from './auth-user.service';

const rota = {} as ActivatedRouteSnapshot;
const estado = {} as RouterStateSnapshot;

describe('authGuard', () => {
  let router: jasmine.SpyObj<Router>;
  let logado: boolean;

  beforeEach(() => {
    logado = true;
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { isLoggedIn: () => logado } },
      ],
    });
  });

  it('deixa passar quem está logado', () => {
    const r = TestBed.runInInjectionContext(() => authGuard(rota, estado));

    expect(r).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('manda para o login quem não está logado', () => {
    logado = false;

    const r = TestBed.runInInjectionContext(() => authGuard(rota, estado));

    expect(r).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});

describe('adminGuard', () => {
  let router: jasmine.SpyObj<Router>;
  let authUser: { snapshot: any; loadMe: jasmine.Spy };

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authUser = { snapshot: null, loadMe: jasmine.createSpy('loadMe') };
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthUserService, useValue: authUser },
      ],
    });
  });

  const executar = () => TestBed.runInInjectionContext(() => adminGuard(rota, estado));

  describe('com o usuário já carregado', () => {
    it('deixa o admin passar', () => {
      authUser.snapshot = { authorities: ['ROLE_ADMIN'] };

      expect(executar()).toBeTrue();
      expect(authUser.loadMe).not.toHaveBeenCalled();
    });

    it('manda quem não é admin para o início do painel', () => {
      authUser.snapshot = { authorities: ['ROLE_OPERADOR'] };

      expect(executar()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/dashboard-home']);
    });

    it('usuário sem perfil nenhum não é admin', () => {
      authUser.snapshot = { authorities: undefined };

      expect(executar()).toBeFalse();
    });
  });

  describe('sem o usuário carregado', () => {
    it('busca o usuário e deixa o admin passar', async () => {
      authUser.loadMe.and.returnValue(of({ authorities: ['ROLE_ADMIN', 'ROLE_CONSULTA'] }));

      const r = await firstValueFrom(executar() as Observable<boolean>);

      expect(r).toBeTrue();
    });

    it('busca o usuário e barra quem não é admin', async () => {
      authUser.loadMe.and.returnValue(of({ authorities: ['ROLE_GESTOR'] }));

      const r = await firstValueFrom(executar() as Observable<boolean>);

      expect(r).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/dashboard-home']);
    });

    it('se não conseguir buscar o usuário manda para o login', async () => {
      authUser.loadMe.and.returnValue(throwError(() => new Error('401')));

      const r = await firstValueFrom(executar() as Observable<boolean>);

      expect(r).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
