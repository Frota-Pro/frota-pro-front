import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PlanejamentoPlanilhaComponent, agruparInconsistencias } from './planejamento-planilha.component';
import { PlanejamentoApiService } from '../../core/api/planejamento-api.service';
import { MotoristaApiService } from '../../core/api/motorista-api.service';
import { CaminhaoApiService } from '../../core/api/caminhao-api.service';
import { AjudanteApiService } from '../../core/api/ajudante-api.service';
import { AuthUserService } from '../../core/auth/auth-user.service';
import { PlanejamentoCarregamento, PlanejamentoPlanilha, PlanejamentoRota } from '../../core/api/planejamento-api.models';

function carga(parcial: Partial<PlanejamentoCarregamento>): PlanejamentoCarregamento {
  return {
    numero: 1,
    principal: true,
    destino: 'X',
    pesoToneladas: 1,
    valorTotal: 100,
    totalClientes: 1,
    codigosClientes: [1],
    totalPedidos: 1,
    faturada: false,
    codMotoristaWinThor: 14,
    codVeiculoWinThor: 79,
    ...parcial,
  };
}

function rota(cs: PlanejamentoCarregamento[], parcial: Partial<PlanejamentoRota> = {}): PlanejamentoRota {
  return {
    numeroPrincipal: cs[0].numero,
    ajudantes: [],
    pesoToneladas: cs.reduce((s, c) => s + c.pesoToneladas, 0),
    valorTotal: cs.reduce((s, c) => s + c.valorTotal, 0),
    totalClientes: new Set(cs.flatMap((c) => c.codigosClientes)).size,
    totalPedidos: cs.reduce((s, c) => s + c.totalPedidos, 0),
    destinos: [...new Set(cs.map((c) => c.destino ?? ''))],
    totalCidades: new Set(cs.map((c) => c.destino)).size,
    avisos: [],
    carregamentos: cs,
    ...parcial,
  };
}

/**
 * Cinco linhas: a rota 423360 (com o complemento 423356, tudo preenchido), a faturada 423358 (travada), a carga
 * 423361 sozinha e as duas "cliente vem buscar" (423337 e 423338).
 */
function planilha(parcial: Partial<PlanejamentoPlanilha> = {}): PlanejamentoPlanilha {
  const rotas = [
    rota(
      [
        carga({ numero: 423360, destino: 'PICUI', pesoToneladas: 6.297, valorTotal: 30000, totalPedidos: 28, codigosClientes: [1, 2, 3] }),
        carga({ numero: 423356, principal: false, destino: 'POCO DANTAS', pesoToneladas: 2.161, valorTotal: 9000, totalPedidos: 11, codigosClientes: [3, 4] }),
      ],
      {
        cor: 0,
        motorista: { id: 'm1', codigo: 'MOT-000001', nome: 'Francisco' },
        ajudantes: [
          { id: 'a1', codigo: 'AJU-000001', nome: 'João' },
          { id: 'a2', codigo: 'AJU-000002', nome: 'Pedro' },
        ],
        caminhao: { id: 'c1', codigo: 'CAM-000017', placa: 'JNB1373' },
        box: { numero: 2, nome: 'Box 2' },
        diaSaida: 'AMANHA',
        turnoSaida: 'MANHA',
      },
    ),
    rota([carga({ numero: 423358, destino: 'POCO JOSE DE MOURA', faturada: true, statusCarga: 'EM_ROTA', motoristaCarga: 'Venilson', caminhaoCarga: 'OFX3415' })], {
      motorista: { id: 'm2', codigo: 'MOT-000002', nome: 'Venilson' },
      box: { numero: 4, nome: 'Box 4' },
    }),
    rota([carga({ numero: 423361, destino: 'CACHOEIRA', pesoToneladas: 2.161, valorTotal: 18420, totalPedidos: 27, codigosClientes: [7, 8], nomeMotoristaWinThor: 'FRANCISCO', placaVeiculoWinThor: 'JNB1373' })]),
    rota([carga({ numero: 423337, destino: 'SOUSA', codMotoristaWinThor: 10, codVeiculoWinThor: 2, pesoToneladas: 0.5, valorTotal: 500, codigosClientes: [9] })]),
    rota([carga({ numero: 423338, destino: 'SAO JOAO', codMotoristaWinThor: 10, codVeiculoWinThor: 2, pesoToneladas: 0.3, valorTotal: 300, codigosClientes: [10] })]),
  ];
  return {
    id: 'p1',
    data: '2026-11-13',
    status: 'ABERTA',
    podeReabrir: false,
    totalCarregamentos: 6,
    totalRotas: 5,
    pesoToneladas: 12.4,
    valorTotal: 60000,
    rotas,
    boxes: [
      { numero: 1, nome: 'Box 1' },
      { numero: 2, nome: 'Box 2', ocupadoPorRota: 423360 },
      { numero: 3, nome: 'Box 3' },
      { numero: 4, nome: 'Box 4' },
    ],
    ...parcial,
  };
}

describe('PlanejamentoPlanilhaComponent (uma linha por rota)', () => {
  let fixture: ComponentFixture<PlanejamentoPlanilhaComponent>;
  let comp: PlanejamentoPlanilhaComponent;
  let api: jasmine.SpyObj<PlanejamentoApiService>;
  let ajudanteApi: { listar: jasmine.Spy; criar: jasmine.Spy };

  function montar(authorities: string[], p: PlanejamentoPlanilha = planilha()) {
    api = jasmine.createSpyObj('PlanejamentoApiService', ['obter', 'atualizar', 'fechar', 'reabrir', 'tirar', 'juntar', 'separar', 'definirRota', 'definirSaida']);
    api.obter.and.returnValue(of(p));
    api.tirar.and.returnValue(of(p));
    api.juntar.and.returnValue(of(p));
    api.separar.and.returnValue(of(p));
    api.definirRota.and.returnValue(of(p));
    api.definirSaida.and.returnValue(of(p));
    ajudanteApi = {
      listar: jasmine.createSpy('listar').and.returnValue(
        of({ content: [{ codigo: 'AJU-000001', nome: 'João' }, { codigo: 'AJU-000002', nome: 'Pedro' }, { codigo: 'AJU-000003', nome: 'Lucas' }] }),
      ),
      criar: jasmine.createSpy('criar').and.returnValue(of({ codigo: 'AJU-000009', nome: 'Rafael' })),
    };

    TestBed.configureTestingModule({
      imports: [PlanejamentoPlanilhaComponent],
      providers: [
        provideRouter([]),
        { provide: PlanejamentoApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'p1' } } } },
        { provide: AuthUserService, useValue: { snapshot: { authorities } } },
        { provide: MotoristaApiService, useValue: { listar: () => of({ content: [{ codigo: 'MOT-000001', nome: 'Francisco' }, { codigo: 'MOT-000002', nome: 'Venilson' }] }) } },
        { provide: CaminhaoApiService, useValue: { listar: () => of({ content: [{ codigo: 'CAM-000017', placa: 'JNB1373', descricao: 'D20' }] }) } },
        { provide: AjudanteApiService, useValue: ajudanteApi },
      ],
    });
    fixture = TestBed.createComponent(PlanejamentoPlanilhaComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function botoes(el: HTMLElement): string[] {
    return Array.from(el.querySelectorAll('button')).map((b) => (b.textContent ?? '').trim());
  }

  function botao(el: HTMLElement | Element, texto: string): HTMLButtonElement {
    return Array.from(el.querySelectorAll('button')).find((b) => (b.textContent ?? '').trim().startsWith(texto)) as HTMLButtonElement;
  }

  function linhas(el: HTMLElement): HTMLElement[] {
    return Array.from(el.querySelectorAll('table.planilha-tabela tbody tr')) as HTMLElement[];
  }

  function linha(el: HTMLElement, numero: number): HTMLElement {
    return linhas(el).find((tr) => tr.querySelector('.col-fixa-2')?.textContent?.trim() === String(numero)) as HTMLElement;
  }

  function marcar(el: HTMLElement, numero: number) {
    (el.querySelector(`input[aria-label="Marcar a linha ${numero}"]`) as HTMLInputElement).dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function trocar(sel: HTMLSelectElement, valor: string) {
    sel.value = valor;
    sel.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  /** A janela de confirmação mora no <body>: procura lá. */
  function janela(): HTMLElement | null {
    return document.querySelector('app-confirmacao .caixa');
  }

  function clicarNaJanela(classe: 'btn-confirmar' | 'btn-cancelar') {
    (document.querySelector('app-confirmacao .' + classe) as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  async function assentar() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  describe('a linha da rota', () => {
    it('é uma linha por rota: os complementos ficam dentro da linha do principal', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      expect(linhas(el).length).toBe(5);
      const l = linha(el, 423360);
      expect(l.querySelector('.celula-complementos')!.textContent).toContain('423356');
      expect(l.querySelector('.destino-celula')!.textContent).toContain('PICUI / POCO DANTAS');
      expect(linha(el, 423356)).toBeUndefined();
    });

    it('mostra o peso, os pedidos e as entregas da rota inteira', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);
      const celula = (linha(el, 423360).querySelector('.celula-peso')!.textContent ?? '').replace(/\s+/g, ' ').trim();

      expect(celula).toContain('8,458 t');
      expect(celula).toContain('39 ped · 4 entrg');
    });

    it('tem tudo preenchível na mesma linha: motorista, ajudantes, caminhão, box, dia e turno', async () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);
      await assentar();
      const l = linha(el, 423360);

      expect((l.querySelector('input[aria-label="Motorista da rota"]') as HTMLInputElement).value).toBe('Francisco');
      expect((l.querySelector('input[aria-label="Caminhão da rota"]') as HTMLInputElement).value).toBe('JNB1373');
      expect(l.querySelector('.celula-ajudantes')!.textContent).toContain('João');
      expect(l.querySelector('.celula-ajudantes')!.textContent).toContain('Pedro');
      expect((l.querySelector('select[aria-label="Box da rota"]') as HTMLSelectElement).value).toBe('2');
      expect((l.querySelector('select[aria-label="Dia da saída"]') as HTMLSelectElement).value).toBe('AMANHA');
      expect((l.querySelector('select[aria-label="Turno da saída"]') as HTMLSelectElement).value).toBe('MANHA');
    });

    it('mostra o nome do motorista e a placa do WinThor, e "cliente vem buscar"', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      expect(linha(el, 423361).textContent).toContain('FRANCISCO');
      expect(linha(el, 423361).textContent).toContain('JNB1373');
      expect(linha(el, 423337).textContent).toContain('V2 · Cliente vem buscar');
    });

    it('a rota juntada ganha cor', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      expect(linha(el, 423360).style.getPropertyValue('--rota-borda')).toBe('#2563eb');
      expect(linha(el, 423361).classList).not.toContain('colorida');
    });

    it('a linha já faturada fica travada: só mostra o que foi definido', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);
      const l = linha(el, 423358);

      expect(l.querySelectorAll('app-autocomplete').length).toBe(0);
      expect(l.querySelectorAll('select').length).toBe(0);
      expect(l.textContent).toContain('Venilson');
      expect(l.textContent).toContain('Box 4');
      expect(l.textContent).toContain('Em rota');
    });
  });

  describe('filtros', () => {
    it('"cliente vem buscar" deixa só as linhas deles', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      comp.filtros.winthor = '10/2';
      comp.recalcular();
      fixture.detectChanges();

      expect(linhas(el).map((tr) => tr.querySelector('.col-fixa-2')!.textContent!.trim())).toEqual(['423337', '423338']);
      expect(el.textContent).toContain('2 linha(s)');
    });

    it('"só não faturadas" esconde a linha que já foi faturada', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      comp.filtros.situacao = 'naoFaturadas';
      comp.recalcular();
      fixture.detectChanges();

      expect(linha(el, 423358)).toBeUndefined();
      expect(linhas(el).length).toBe(4);
    });

    it('filtrar por cidade acha a rota também pelo complemento', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      comp.filtros.destino = 'POCO DANTAS';
      comp.recalcular();
      fixture.detectChanges();

      expect(linhas(el).length).toBe(1);
      expect(linha(el, 423360)).toBeDefined();
    });
  });

  describe('marcar linhas: tirar, juntar, mensagem', () => {
    it('marcar todas do filtro e tirar manda todas as cargas das linhas (com os complementos)', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      marcar(el, 423360);
      marcar(el, 423337);
      botao(el, 'Tirar marcadas').click();
      fixture.detectChanges();

      // primeiro a pergunta (com a lista do que sai), e só depois de confirmar vai para a API
      expect(api.tirar).not.toHaveBeenCalled();
      expect(janela()!.textContent).toContain('Tirar 3 carregamentos da planilha?');
      expect(janela()!.textContent).toContain('423360 · PICUI');
      expect(janela()!.textContent).toContain('423356 · POCO DANTAS (complemento)');
      expect(janela()!.textContent).toContain('423337 · SOUSA');
      clicarNaJanela('btn-confirmar');

      expect(api.tirar).toHaveBeenCalledWith('p1', [423360, 423356, 423337]);
      expect(janela()).toBeNull();
    });

    it('marcar todas do filtro marca só as linhas que o filtro mostra', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);

      comp.filtros.winthor = '10/2';
      comp.recalcular();
      comp.alternarTodas();

      expect([...comp.selecionadas]).toEqual([423337, 423338]);
    });

    it('o total das marcadas soma na hora (peso, valor, clientes sem repetir, pedidos)', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      marcar(el, 423360);
      marcar(el, 423361);

      expect(el.textContent).toContain('Marcadas (2 linha(s) · 3 carregamento(s))');
      expect(comp.totaisSelecao.pesoToneladas).toBe(10.619);
      expect(comp.totaisSelecao.valor).toBe(57420);
      expect(comp.totaisSelecao.clientes).toBe(6); // {1,2,3,4} + {7,8}
      expect(comp.totaisSelecao.pedidos).toBe(66);
    });

    it('juntar marcadas: a de menor número vira o principal', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      marcar(el, 423361);
      marcar(el, 423337);
      botao(el, 'Juntar marcadas').click();

      expect(api.juntar).toHaveBeenCalledWith('p1', 423337, [423361]);
    });

    it('juntar marcadas: se uma já tem complementos, ela é o principal', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      marcar(el, 423361);
      marcar(el, 423360);
      botao(el, 'Juntar marcadas').click();

      expect(api.juntar).toHaveBeenCalledWith('p1', 423360, [423361]);
    });

    it('não junta duas rotas que já têm complementos', () => {
      const outra = planilha();
      outra.rotas.push(rota([carga({ numero: 500 }), carga({ numero: 501, principal: false })]));
      const el = montar(['ROLE_OPERADOR_LOGISTICA'], outra);

      marcar(el, 423360);
      marcar(el, 500);
      botao(el, 'Juntar marcadas').click();
      fixture.detectChanges();

      expect(api.juntar).not.toHaveBeenCalled();
      expect(el.textContent).toContain('Só uma das linhas marcadas pode já ter complementos');
    });

    it('com faturada entre as marcadas, juntar fica desligado (só dá para tirar)', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      marcar(el, 423358);
      marcar(el, 423361);

      expect(botao(el, 'Juntar marcadas').disabled).toBe(true);
      expect(el.textContent).toContain('Faturado só pode ser tirado');
    });
  });

  describe('complementos (coluna S. carga)', () => {
    it('só carga sozinha, sem nada preenchido e não faturada pode virar complemento', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);

      expect(comp.opcoesComplemento(comp.planilha!.rotas[0]).map((o) => o.codigo)).toEqual(['423361', '423337', '423338']);
    });

    it('a própria linha não aparece como opção para ela mesma', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);
      const solta = comp.planilha!.rotas[2];

      expect(comp.opcoesComplemento(solta).map((o) => o.codigo)).toEqual(['423337', '423338']);
    });

    it('adicionar o complemento manda juntar com o principal da linha', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);

      comp.adicionarComplemento(comp.planilha!.rotas[0], '423361');

      expect(api.juntar).toHaveBeenCalledWith('p1', 423360, [423361]);
    });

    it('o "×" do complemento devolve a linha própria dele', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      (linha(el, 423360).querySelector('button[aria-label="Tirar a carga 423356 da rota"]') as HTMLButtonElement).click();

      expect(api.separar).toHaveBeenCalledWith('p1', [423356]);
    });
  });

  describe('box e saída', () => {
    it('escolher outro box manda o box junto com o dia e o turno que a rota já tem', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      trocar(linha(el, 423360).querySelector('select[aria-label="Box da rota"]') as HTMLSelectElement, '3');

      expect(api.definirSaida).toHaveBeenCalledWith('p1', 423360, 3, 'AMANHA', 'MANHA');
    });

    it('o box de outra rota ainda não faturada aparece desligado', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);
      const opcoes = Array.from((linha(el, 423361).querySelector('select[aria-label="Box da rota"]') as HTMLSelectElement).options);

      const box2 = opcoes.find((o) => o.value === '2')!;
      expect(box2.disabled).toBe(true);
      expect(box2.textContent).toContain('rota 423360');
      expect(opcoes.find((o) => o.value === '3')!.disabled).toBe(false);
    });

    it('o box da própria rota continua liberado', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);
      const opcoes = Array.from((linha(el, 423360).querySelector('select[aria-label="Box da rota"]') as HTMLSelectElement).options);

      expect(opcoes.find((o) => o.value === '2')!.disabled).toBe(false);
    });

    it('escolher o dia e o turno de uma rota sem saída definida', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      trocar(linha(el, 423361).querySelector('select[aria-label="Dia da saída"]') as HTMLSelectElement, 'HOJE');
      expect(api.definirSaida).toHaveBeenCalledWith('p1', 423361, null, 'HOJE', null);

      trocar(linha(el, 423361).querySelector('select[aria-label="Turno da saída"]') as HTMLSelectElement, 'NOITE');
      expect(api.definirSaida).toHaveBeenCalledWith('p1', 423361, null, null, 'NOITE');
    });

    it('voltar para "—" limpa o campo', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      trocar(linha(el, 423360).querySelector('select[aria-label="Turno da saída"]') as HTMLSelectElement, '');

      expect(api.definirSaida).toHaveBeenCalledWith('p1', 423360, 2, 'AMANHA', null);
    });
  });

  describe('motorista, caminhão e ajudantes', () => {
    it('escolher o motorista manda também o caminhão e os ajudantes que a rota já tem', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);

      comp.escolherMotorista(comp.planilha!.rotas[0], 'MOT-000002');

      expect(api.definirRota).toHaveBeenCalledWith('p1', 423360, 'MOT-000002', ['AJU-000001', 'AJU-000002'], 'CAM-000017');
    });

    it('limpar o caminhão tira só o caminhão', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);

      comp.limparCaminhao(comp.planilha!.rotas[0]);

      expect(api.definirRota).toHaveBeenCalledWith('p1', 423360, 'MOT-000001', ['AJU-000001', 'AJU-000002'], null);
    });

    it('adicionar um ajudante soma aos que já estão na rota', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);

      comp.adicionarAjudante(comp.planilha!.rotas[0], 'AJU-000003');

      expect(api.definirRota).toHaveBeenCalledWith('p1', 423360, 'MOT-000001', ['AJU-000001', 'AJU-000002', 'AJU-000003'], 'CAM-000017');
    });

    it('a lista de ajudantes de cada linha não repete quem já está nela', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);

      expect(comp.opcoesAjudante(comp.planilha!.rotas[0]).map((o) => o.codigo)).toEqual(['AJU-000003']);
      expect(comp.opcoesAjudante(comp.planilha!.rotas[2]).length).toBe(3);
    });

    it('tirar um ajudante manda a lista sem ele', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      (linha(el, 423360).querySelector('button[aria-label="Tirar João"]') as HTMLButtonElement).click();

      expect(api.definirRota).toHaveBeenCalledWith('p1', 423360, 'MOT-000001', ['AJU-000002'], 'CAM-000017');
    });

    it('ajudante que não existe é cadastrado ali mesmo e já entra na rota', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);

      comp.cadastrarAjudante(comp.planilha!.rotas[0], 'Rafael');

      expect(ajudanteApi.criar).toHaveBeenCalledWith({ nome: 'Rafael' });
      expect(api.definirRota).toHaveBeenCalledWith('p1', 423360, 'MOT-000001', ['AJU-000001', 'AJU-000002', 'AJU-000009'], 'CAM-000017');
      expect(comp.ajudantes.map((a) => a.rotulo)).toContain('Rafael');
    });
  });

  describe('mensagem para o grupo', () => {
    it('o botão aparece depois de marcar linhas e gera só das marcadas', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);
      expect(botoes(el)).not.toContain('Gerar mensagem');

      marcar(el, 423360);
      botao(el, 'Gerar mensagem').click();
      fixture.detectChanges();

      const texto = comp.mensagemTexto;
      expect(texto).toContain('SAÍDAS DE AMANHÃ');
      expect(texto).toContain('sábado, 14/11/2026');
      expect(texto).toContain('*MANHÃ*');
      expect(texto).not.toContain('Venilson');
      expect(el.querySelector('textarea[aria-label="Texto da mensagem"]')).not.toBeNull();
    });

    it('a mensagem traz só a cidade da carga principal, não a dos complementos', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      marcar(el, 423360);
      botao(el, 'Gerar mensagem').click();

      expect(comp.mensagemTexto).toContain('👤 *Francisco*');
      expect(comp.mensagemTexto).toContain('👷 João, Pedro');
      expect(comp.mensagemTexto).toContain('📍 Picui');
      expect(comp.mensagemTexto).toContain('📦 Box 2');
      expect(comp.mensagemTexto).not.toContain('Poco Dantas');
    });

    it('o botão de WhatsApp leva o texto que está na caixa (já editado)', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);
      const abrir = spyOn(window, 'open');

      comp.mensagemTexto = 'Olá grupo';
      comp.abrirWhatsApp();

      expect(abrir).toHaveBeenCalledWith('https://wa.me/?text=' + encodeURIComponent('Olá grupo'), '_blank', 'noopener');
    });

    it('a caixa da mensagem cresce para mostrar o texto inteiro', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      marcar(el, 423360);
      comp.abrirMensagem();
      fixture.detectChanges();

      const caixa = el.querySelector('textarea[aria-label="Texto da mensagem"]') as HTMLTextAreaElement;
      expect(caixa.rows).toBe(comp.linhasDaMensagem);
      expect(comp.linhasDaMensagem).toBeGreaterThanOrEqual(comp.mensagemTexto.split('\n').length);
    });

    it('fechar esconde o painel', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      marcar(el, 423360);
      comp.abrirMensagem();
      fixture.detectChanges();
      expect(el.querySelector('.mensagem-painel')).not.toBeNull();

      comp.fecharMensagem();
      fixture.detectChanges();
      expect(el.querySelector('.mensagem-painel')).toBeNull();
    });
  });

  describe('atalhos coloridos das rotas juntas', () => {
    it('aparece um atalho colorido por rota que tem complementos', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);
      const atalhos = el.querySelectorAll('button.chip-rota');

      expect(atalhos.length).toBe(1);
      expect(atalhos[0].textContent).toContain('423360 +1');
      expect((atalhos[0] as HTMLElement).style.getPropertyValue('--rota-borda')).toBe('#2563eb');
    });

    it('clicar no atalho mostra só aquela rota; clicar de novo solta o filtro', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);
      const atalho = el.querySelector('button.chip-rota') as HTMLButtonElement;

      atalho.click();
      fixture.detectChanges();
      expect(linhas(el).length).toBe(1);
      expect(linha(el, 423360)).toBeDefined();
      expect(atalho.getAttribute('aria-pressed')).toBe('true');

      atalho.click();
      fixture.detectChanges();
      expect(linhas(el).length).toBe(5);
    });

    it('o atalho continua aparecendo mesmo quando outro filtro esconde a rota', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      comp.filtros.winthor = '10/2';
      comp.recalcular();
      fixture.detectChanges();

      expect(el.querySelectorAll('button.chip-rota').length).toBe(1);
    });

    it('sem nenhuma rota juntada, não há atalhos', () => {
      const semJuntas = planilha();
      semJuntas.rotas = semJuntas.rotas.slice(1);
      const el = montar(['ROLE_OPERADOR_LOGISTICA'], semJuntas);

      expect(el.querySelectorAll('button.chip-rota').length).toBe(0);
      expect(el.textContent).not.toContain('Rotas juntas');
    });

    it('o filtro de rota solta sozinho quando a rota deixa de ter complementos', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);
      (el.querySelector('button.chip-rota') as HTMLButtonElement).click();
      expect(comp.filtros.rota).toBe(423360);

      const desfeita = planilha();
      desfeita.rotas[0].carregamentos = desfeita.rotas[0].carregamentos.slice(0, 1);
      comp['receber'](desfeita);
      fixture.detectChanges();

      expect(comp.filtros.rota).toBeNull();
      expect(linhas(el).length).toBe(5);
    });
  });

  describe('complementos empilhados', () => {
    it('os complementos ficam um embaixo do outro, com o campo de adicionar por último', () => {
      const dois = planilha();
      dois.rotas[0].carregamentos.push(carga({ numero: 423399, principal: false, destino: 'CATOLE' }));
      const el = montar(['ROLE_OPERADOR_LOGISTICA'], dois);
      const celula = linha(el, 423360).querySelector('.celula-complementos')!;

      expect(celula.querySelector('.complementos-pilha')).not.toBeNull();
      expect(Array.from(celula.querySelectorAll('.chip-carga')).map((c) => (c.textContent ?? '').replace(/[×\s]+/g, ''))).toEqual(['423356', '423399']);
      const chips = celula.querySelectorAll('.chip-carga');
      expect(chips[1].getBoundingClientRect().top).toBeGreaterThan(chips[0].getBoundingClientRect().top + 5);
      expect(celula.querySelectorAll('app-autocomplete').length).toBe(1);
    });
  });

  describe('inconsistências', () => {
    const joao = { id: 'a1', codigo: 'AJU-000001', nome: 'João' };

    /** O João está nas rotas 423360 e 423361, sem horário definido: a API avisa as duas. */
    function planilhaComJoaoRepetido(): PlanejamentoPlanilha {
      const p = planilha();
      const conflito = (outra: number) => ({
        tipo: 'AJUDANTE' as const,
        codigo: 'AJU-000001',
        nome: 'João',
        rotas: [outra],
        mesmoHorario: false,
        texto: 'O ajudante João também está na rota ' + outra,
      });
      p.rotas[0].conflitos = [conflito(423361)];
      p.rotas[2].ajudantes = [joao];
      p.rotas[2].conflitos = [conflito(423360)];
      return p;
    }

    it('sem repetição, não aparece aviso nenhum', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      expect(el.querySelector('.inconsistencias')).toBeNull();
      expect(el.querySelectorAll('.icone-problema').length).toBe(0);
    });

    it('o aviso aparece em cima da tabela, uma vez só (e não uma por rota)', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA'], planilhaComJoaoRepetido());
      const painel = el.querySelector('.inconsistencias') as HTMLElement;

      expect(painel).not.toBeNull();
      expect(painel.textContent).toContain('1 inconsistência(s) para resolver');
      expect(painel.querySelectorAll('li').length).toBe(1);
      expect(painel.textContent).toContain('O ajudante João está nas rotas 423360 e 423361');
      expect(painel.textContent).toContain('escolha o dia e o turno');
      // o painel vem antes da tabela
      expect(painel.compareDocumentPosition(el.querySelector('table.planilha-tabela')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('as duas linhas ficam marcadas, e só o ajudante repetido fica em vermelho', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA'], planilhaComJoaoRepetido());

      for (const n of [423360, 423361]) {
        const l = linha(el, n);
        expect(l.classList).toContain('com-problema');
        expect(l.querySelector('.icone-problema')).not.toBeNull();
        const vermelhos = Array.from(l.querySelectorAll('.chip-ajudante.conflito')).map((c) => (c.textContent ?? '').trim().replace(/[×\s]+$/, ''));
        expect(vermelhos).toEqual(['João']);
      }
      expect(linha(el, 423337).classList).not.toContain('com-problema');
      expect(linha(el, 423360).querySelectorAll('.chip-ajudante').length).toBe(2); // João e Pedro; só o João está em vermelho
    });

    it('motorista e caminhão repetidos pintam a célula de vermelho', () => {
      const p = planilha();
      p.rotas[2].motorista = { id: 'm1', codigo: 'MOT-000001', nome: 'Francisco' };
      p.rotas[2].caminhao = { id: 'c1', codigo: 'CAM-000017', placa: 'JNB1373' };
      p.rotas[0].conflitos = [
        { tipo: 'MOTORISTA', codigo: 'MOT-000001', nome: 'Francisco', rotas: [423361], mesmoHorario: true, texto: 'x' },
        { tipo: 'CAMINHAO', codigo: 'CAM-000017', nome: 'JNB1373', rotas: [423361], mesmoHorario: true, texto: 'y' },
      ];
      const el = montar(['ROLE_OPERADOR_LOGISTICA'], p);

      const celulas = linha(el, 423360).querySelectorAll('td.celula-conflito');
      expect(celulas.length).toBe(2);
      expect(celulas[0].querySelector('input[aria-label="Motorista da rota"]')).not.toBeNull();
      expect(celulas[1].querySelector('input[aria-label="Caminhão da rota"]')).not.toBeNull();
    });

    it('"Ver rota" tira o filtro que escondia a linha e leva até ela', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA'], planilhaComJoaoRepetido());
      comp.filtros.winthor = '10/2';
      comp.recalcular();
      fixture.detectChanges();
      expect(linha(el, 423360)).toBeUndefined();

      botao(el.querySelector('.inconsistencias') as HTMLElement, 'Ver rota 423360').click();
      fixture.detectChanges();

      expect(comp.filtros.winthor).toBe('');
      expect(linha(el, 423360)).toBeDefined();
    });

    it('antes de fechar a planilha, avisa quantas inconsistências existem', () => {
      montar(['ROLE_OPERADOR_LOGISTICA'], planilhaComJoaoRepetido());

      comp.fechar();
      fixture.detectChanges();

      expect(janela()!.textContent).toContain('Fechar com 1 inconsistência?');
      expect(janela()!.textContent).toContain('O ajudante João está nas rotas 423360 e 423361');
      expect(janela()!.textContent).toContain('Fechar mesmo assim');
      expect(janela()!.textContent).toContain('Voltar e corrigir');

      clicarNaJanela('btn-cancelar');
      expect(api.fechar).not.toHaveBeenCalled();
      expect(janela()).toBeNull();
    });

    it('sem inconsistência, a pergunta de fechar é a de sempre', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);

      comp.fechar();
      fixture.detectChanges();

      expect(janela()!.textContent).toContain('Fechar a planilha de 13/11/2026?');
      expect(janela()!.textContent).not.toContain('inconsistência');
      expect(janela()!.textContent).toContain('Depois de fechada ela não muda mais');
      expect(api.fechar).not.toHaveBeenCalled();

      api.fechar.and.returnValue(of(planilha({ status: 'FECHADA' })));
      clicarNaJanela('btn-confirmar');

      expect(api.fechar).toHaveBeenCalledWith('p1');
      expect(janela()).toBeNull();
    });

    it('nas listas de escolha, quem já está em outra rota aparece com "já na rota X"', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);
      const rotas = comp.planilha!.rotas;

      const pedroNaOutra = comp.opcoesAjudante(rotas[2]).find((o) => o.codigo === 'AJU-000002')!;
      expect(pedroNaOutra.detalhe).toContain('já na rota 423360');

      const francisco = comp.opcoesMotorista(rotas[2]).find((o) => o.codigo === 'MOT-000001')!;
      expect(francisco.detalhe).toBe('MOT-000001 · já na rota 423360');

      const caminhao = comp.opcoesCaminhao(rotas[2]).find((o) => o.codigo === 'CAM-000017')!;
      expect(caminhao.detalhe).toContain('já na rota 423360');
    });

    it('na própria rota a dica não aparece (ele já está nela)', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);

      const francisco = comp.opcoesMotorista(comp.planilha!.rotas[0]).find((o) => o.codigo === 'MOT-000001')!;

      expect(francisco.detalhe).toBe('MOT-000001');
    });

    it('rota já faturada não entra na dica de "já na rota"', () => {
      montar(['ROLE_OPERADOR_LOGISTICA']);

      // o Venilson está na rota faturada 423358: não conta como ocupado
      const venilson = comp.opcoesMotorista(comp.planilha!.rotas[2]).find((o) => o.codigo === 'MOT-000002')!;

      expect(venilson.detalhe).toBe('MOT-000002');
    });
  });

  describe('agruparInconsistencias', () => {
    const conflito = (outras: number[], mesmoHorario: boolean) => ({ tipo: 'AJUDANTE' as const, codigo: 'A', nome: 'João', rotas: outras, mesmoHorario, texto: '' });

    it('junta o aviso das duas pontas em um só', () => {
      const lista = agruparInconsistencias([
        rota([carga({ numero: 1 })], { conflitos: [conflito([2], true)] }),
        rota([carga({ numero: 2 })], { conflitos: [conflito([1], true)] }),
      ]);

      expect(lista.length).toBe(1);
      expect(lista[0].rotas).toEqual([1, 2]);
      expect(lista[0].texto).toBe('O ajudante João está nas rotas 1 e 2, no mesmo dia e turno.');
    });

    it('com três rotas, lista todas; e pede os horários se algum ainda não foi definido', () => {
      const lista = agruparInconsistencias([
        rota([carga({ numero: 1 })], { conflitos: [conflito([2, 3], false)] }),
        rota([carga({ numero: 2 })], { conflitos: [conflito([1, 3], true)] }),
        rota([carga({ numero: 3 })], { conflitos: [conflito([1, 2], true)] }),
      ]);

      expect(lista.length).toBe(1);
      expect(lista[0].texto).toContain('nas rotas 1, 2, 3');
      expect(lista[0].texto).toContain('escolha o dia e o turno');
    });

    it('pessoas diferentes viram avisos diferentes', () => {
      const lista = agruparInconsistencias([
        rota([carga({ numero: 1 })], { conflitos: [conflito([2], true), { ...conflito([2], true), codigo: 'B', nome: 'Pedro' }] }),
      ]);

      expect(lista.map((i) => i.nome).sort()).toEqual(['Pedro', 'João'].sort());
    });
  });

  describe('janelas de confirmação', () => {
    it('tirar uma carga só usa o texto no singular', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      marcar(el, 423337);
      botao(el, 'Tirar marcadas').click();
      fixture.detectChanges();

      expect(janela()!.textContent).toContain('Tirar este carregamento da planilha?');
      expect(janela()!.textContent).toContain('Tirar carregamento');
    });

    it('com muitas cargas, mostra as primeiras e diz quantas faltam', () => {
      const grande = planilha();
      for (let n = 600; n < 612; n++) grande.rotas.push(rota([carga({ numero: n, destino: 'X' })]));
      const el = montar(['ROLE_OPERADOR_LOGISTICA'], grande);

      comp.alternarTodas();
      fixture.detectChanges();
      botao(el, 'Tirar marcadas').click();
      fixture.detectChanges();

      const itens = Array.from(document.querySelectorAll('app-confirmacao .itens li')).map((li) => li.textContent);
      expect(itens.length).toBe(9);
      expect(itens[8]).toMatch(/^… e mais \d+$/);
    });

    it('voltar não tira nada', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      marcar(el, 423337);
      botao(el, 'Tirar marcadas').click();
      fixture.detectChanges();
      clicarNaJanela('btn-cancelar');

      expect(api.tirar).not.toHaveBeenCalled();
      expect(janela()).toBeNull();
      expect(comp.selecionadas.has(423337)).toBe(true); // a marcação continua
    });

    it('não usa mais o quadro cinza do navegador', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);
      const nativo = spyOn(window, 'confirm');

      marcar(el, 423337);
      botao(el, 'Tirar marcadas').click();
      comp.fechar();

      expect(nativo).not.toHaveBeenCalled();
    });
  });

  describe('imprimir', () => {
    it('sem nada marcado e sem filtro, imprime a planilha inteira', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      expect(botoes(el)).toContain('Imprimir');
      expect(comp.rotasParaImprimir().length).toBe(5);
    });

    it('com linhas marcadas, o botão diz quantas e imprime só elas', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      marcar(el, 423360);
      marcar(el, 423337);

      expect(botoes(el)).toContain('Imprimir marcadas (2)');
      expect(comp.rotasParaImprimir().map((r) => r.numeroPrincipal)).toEqual([423360, 423337]);
    });

    it('com filtro e nada marcado, imprime o que o filtro mostra', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);

      comp.filtros.winthor = '10/2';
      comp.recalcular();
      fixture.detectChanges();

      expect(botoes(el)).toContain('Imprimir filtro (2)');
      expect(comp.rotasParaImprimir().map((r) => r.numeroPrincipal)).toEqual([423337, 423338]);
    });

    it('as marcadas têm prioridade sobre o filtro', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);
      comp.filtros.winthor = '10/2';
      comp.recalcular();
      fixture.detectChanges();

      marcar(el, 423337);

      expect(comp.rotasParaImprimir().map((r) => r.numeroPrincipal)).toEqual([423337]);
    });
  });

  describe('a linha não aperta quando tem vários ajudantes', () => {
    it('os ajudantes ficam empilhados dentro da própria célula, com o campo de adicionar embaixo', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);
      const celula = linha(el, 423360).querySelector('.celula-ajudantes')!;

      expect(celula.querySelector('.ajudantes-pilha')).not.toBeNull();
      expect(celula.querySelectorAll('.chip-ajudante').length).toBe(2);
      expect(celula.querySelectorAll('app-autocomplete').length).toBe(1);
    });

    it('a tabela não tem rolagem vertical própria (quem rola é a página)', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA']);
      const estilo = getComputedStyle(el.querySelector('.planilha-wrap') as HTMLElement);

      expect(estilo.maxHeight).toBe('none');
    });
  });

  describe('quem pode o quê', () => {
    it('gerente só consulta: vê tudo escrito e gera a mensagem, mas não edita nada', () => {
      const el = montar(['ROLE_GERENTE_LOGISTICA', 'ROLE_CONSULTA']);
      const l = linha(el, 423360);

      expect(botoes(el)).toContain('Imprimir');
      expect(botoes(el)).not.toContain('Fechar planilha');
      expect(botoes(el)).not.toContain('Buscar novos do WinThor');
      expect(l.querySelectorAll('app-autocomplete').length).toBe(0);
      expect(l.querySelectorAll('select').length).toBe(0);
      expect(l.textContent).toContain('Francisco');
      expect(l.textContent).toContain('João, Pedro');
      expect(l.textContent).toContain('Box 2');
      expect(l.textContent).toContain('Amanhã');
      expect(l.textContent).toContain('Manhã');

      marcar(el, 423360);
      expect(botoes(el)).toContain('Gerar mensagem');
      expect(botoes(el)).not.toContain('Tirar marcadas');
      expect(botoes(el)).not.toContain('Juntar marcadas');
    });

    it('planilha fechada de dia passado: sem edição e sem reabrir', () => {
      const el = montar(['ROLE_ADMIN'], planilha({ status: 'FECHADA', podeReabrir: false }));

      expect(botoes(el)).not.toContain('Reabrir');
      expect(botoes(el)).not.toContain('Fechar planilha');
      expect(el.querySelectorAll('select[aria-label="Box da rota"]').length).toBe(0);
      expect(el.textContent).toContain('só consulta e impressão');
    });

    it('planilha fechada no mesmo dia mostra Reabrir', () => {
      const el = montar(['ROLE_OPERADOR_LOGISTICA'], planilha({ status: 'FECHADA', podeReabrir: true }));

      expect(botoes(el)).toContain('Reabrir');
    });
  });
});
