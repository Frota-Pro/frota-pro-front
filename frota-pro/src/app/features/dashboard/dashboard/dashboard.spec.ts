import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mostra no menu Cargas quantas precisam de lancamento manual de km e abastecimento', () => {
    const http = TestBed.inject(HttpTestingController);
    http.match((r) => r.url.includes('/cargas/lancamento-manual/quantidade')).forEach((r) => r.flush({ quantidade: 4 }));
    fixture.detectChanges();

    const contador = fixture.nativeElement.querySelector('.menu-contador');
    expect(contador?.textContent).toContain('4');
  });

  it('sem pendencia ou sem permissao o contador nao aparece', () => {
    const http = TestBed.inject(HttpTestingController);
    http.match((r) => r.url.includes('/cargas/lancamento-manual/quantidade'))
      .forEach((r) => r.flush({ message: 'negado' }, { status: 403, statusText: 'Forbidden' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.menu-contador')).toBeNull();
  });
});
