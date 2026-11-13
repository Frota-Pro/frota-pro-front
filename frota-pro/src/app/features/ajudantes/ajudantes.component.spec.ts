import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AjudantesComponent, filtrarAjudantes, podeEditarAjudantes } from './ajudantes.component';
import { AjudanteApiService, AjudanteResponse } from '../../core/api/ajudante-api.service';
import { AuthUserService } from '../../core/auth/auth-user.service';

function ajudante(codigo: string, nome: string): AjudanteResponse {
  return { id: codigo, codigo, nome, ativo: true };
}

describe('ajudantes', () => {
  it('quem pode cadastrar: Admin, Gerente e Operador de logística; Consulta só olha', () => {
    expect(podeEditarAjudantes(['ROLE_ADMIN'])).toBe(true);
    expect(podeEditarAjudantes(['ROLE_GERENTE_LOGISTICA'])).toBe(true);
    expect(podeEditarAjudantes(['ROLE_OPERADOR_LOGISTICA'])).toBe(true);
    expect(podeEditarAjudantes(['ROLE_CONSULTA'])).toBe(false);
    expect(podeEditarAjudantes(null)).toBe(false);
  });

  it('busca pelo nome sem diferenciar maiúscula nem acento', () => {
    const lista = [ajudante('AJU-000001', 'João da Silva'), ajudante('AJU-000002', 'Maria')];
    expect(filtrarAjudantes(lista, 'joao').map((a) => a.codigo)).toEqual(['AJU-000001']);
    expect(filtrarAjudantes(lista, 'MARIA').length).toBe(1);
    expect(filtrarAjudantes(lista, '000002').length).toBe(1);
    expect(filtrarAjudantes(lista, '').length).toBe(2);
  });

  describe('tela', () => {
    let api: jasmine.SpyObj<AjudanteApiService>;

    function montar(authorities: string[]) {
      api = jasmine.createSpyObj('AjudanteApiService', ['listar', 'criar', 'atualizar', 'desativar']);
      api.listar.and.returnValue(of({ content: [ajudante('AJU-000001', 'João da Silva')] } as any));
      api.criar.and.returnValue(of(ajudante('AJU-000002', 'Maria')));
      TestBed.configureTestingModule({
        imports: [AjudantesComponent],
        providers: [
          { provide: AjudanteApiService, useValue: api },
          { provide: AuthUserService, useValue: { snapshot: { authorities } } },
        ],
      });
      const fixture = TestBed.createComponent(AjudantesComponent);
      fixture.detectChanges();
      return { fixture, comp: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
    }

    it('lista os ajudantes e deixa cadastrar um novo', () => {
      const { comp, el } = montar(['ROLE_OPERADOR_LOGISTICA']);

      expect(el.textContent).toContain('João da Silva');
      comp.nomeNovo = '  Maria  ';
      comp.adicionar();

      expect(api.criar).toHaveBeenCalledWith({ nome: 'Maria' });
      expect(comp.nomeNovo).toBe('');
    });

    it('não cadastra nome curto demais', () => {
      const { comp } = montar(['ROLE_OPERADOR_LOGISTICA']);

      comp.nomeNovo = 'Jo';
      comp.adicionar();

      expect(api.criar).not.toHaveBeenCalled();
      expect(comp.mensagem?.tipo).toBe('error');
    });

    it('quem só consulta vê a lista, sem cadastrar nem editar', () => {
      const { el } = montar(['ROLE_CONSULTA']);

      expect(el.textContent).toContain('João da Silva');
      expect(el.querySelectorAll('button').length).toBe(0);
      expect(el.querySelectorAll('input[aria-label="Nome do novo ajudante"]').length).toBe(0);
    });

    it('desativar pergunta antes, numa janela do sistema, e só depois manda desativar', () => {
      const { fixture, comp } = montar(['ROLE_ADMIN']);
      api.desativar.and.returnValue(of(undefined as any));

      comp.desativar(comp.ajudantes[0]);
      fixture.detectChanges();

      const janela = document.querySelector('app-confirmacao .caixa') as HTMLElement;
      expect(janela.textContent).toContain('Desativar João da Silva?');
      expect(janela.textContent).toContain('O histórico dele continua guardado');
      expect(api.desativar).not.toHaveBeenCalled();

      (document.querySelector('app-confirmacao .btn-confirmar') as HTMLButtonElement).click();
      expect(api.desativar).toHaveBeenCalledWith('AJU-000001');
    });

    it('editar o nome chama a atualização com o código do ajudante', () => {
      const { comp } = montar(['ROLE_ADMIN']);
      api.atualizar.and.returnValue(of(ajudante('AJU-000001', 'João Silva')));

      comp.editar(comp.ajudantes[0]);
      comp.nomeEditado = 'João Silva';
      comp.salvarEdicao(comp.ajudantes[0]);

      expect(api.atualizar).toHaveBeenCalledWith('AJU-000001', { nome: 'João Silva' });
    });
  });
});
