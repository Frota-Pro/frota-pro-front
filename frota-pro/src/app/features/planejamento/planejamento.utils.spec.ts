import { PlanejamentoCarregamento, PlanejamentoPlanilha, PlanejamentoRota } from '../../core/api/planejamento-api.models';
import {
  FILTROS_VAZIOS,
  diaDaSemana,
  ehClienteVemBuscar,
  filtrar,
  formatarData,
  formatarMoeda,
  formatarToneladas,
  linhasDaPlanilha,
  montarHtmlImpressao,
  opcoesDestino,
  opcoesWinThor,
  podeEditarPlanejamento,
  principaisParaJuntar,
  rotuloWinThor,
  selecaoTemComplemento,
  selecaoTemFaturado,
  selosDoCarregamento,
  totaisDe,
} from './planejamento.utils';

function carregamento(parcial: Partial<PlanejamentoCarregamento> = {}): PlanejamentoCarregamento {
  return {
    numero: 423360,
    principal: true,
    destino: 'PICUI',
    pesoToneladas: 6.297,
    valorTotal: 1000,
    totalClientes: 2,
    codigosClientes: [1, 2],
    totalPedidos: 28,
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
    pesoToneladas: 8.458,
    valorTotal: 1500,
    totalClientes: 3,
    totalPedidos: 39,
    destinos: [...new Set(cs.map((c) => c.destino ?? ''))],
    totalCidades: new Set(cs.map((c) => c.destino)).size,
    avisos: [],
    carregamentos: cs,
    ...parcial,
  };
}

function planilha(rotas: PlanejamentoRota[], parcial: Partial<PlanejamentoPlanilha> = {}): PlanejamentoPlanilha {
  return {
    id: 'x',
    data: '2026-11-13',
    status: 'ABERTA',
    podeReabrir: false,
    totalCarregamentos: rotas.reduce((s, r) => s + r.carregamentos.length, 0),
    totalRotas: rotas.length,
    pesoToneladas: 8.458,
    valorTotal: 1500,
    rotas,
    boxes: [],
    ...parcial,
  };
}

describe('planejamento.utils', () => {
  it('formata a data sem mudar o dia e dá o dia da semana', () => {
    expect(formatarData('2026-11-13')).toBe('13/11/2026');
    expect(formatarData(null)).toBe('');
    expect(diaDaSemana('2026-11-13')).toBe('sexta-feira');
  });

  it('formata toneladas e dinheiro em pt-BR', () => {
    expect(formatarToneladas(8.458)).toBe('8,458');
    expect(formatarToneladas(2)).toBe('2,00');
    expect(formatarToneladas(null)).toBe('0,00');
    expect(formatarMoeda(18420.5).replace(/\s/g, ' ')).toBe('R$ 18.420,50');
  });

  it('só Operador de logística e Admin editam; Gerente e Consulta só olham', () => {
    expect(podeEditarPlanejamento(['ROLE_ADMIN'])).toBe(true);
    expect(podeEditarPlanejamento(['ROLE_OPERADOR_LOGISTICA'])).toBe(true);
    expect(podeEditarPlanejamento(['ROLE_GERENTE_LOGISTICA', 'ROLE_CONSULTA'])).toBe(false);
    expect(podeEditarPlanejamento(undefined)).toBe(false);
  });

  it('não faturada mostra só "Não faturada"; faturada mostra o andamento da carga', () => {
    expect(selosDoCarregamento(carregamento()).map((s) => s.texto)).toEqual(['Não faturada']);
    expect(selosDoCarregamento(carregamento({ faturada: true })).map((s) => s.texto)).toEqual(['Faturada', 'Aguardando sincronizar']);
    expect(selosDoCarregamento(carregamento({ faturada: true, statusCarga: 'EM_ROTA' })).map((s) => s.texto)).toEqual(['Faturada', 'Em rota']);
    expect(selosDoCarregamento(carregamento({ faturada: true, statusCarga: 'FINALIZADA' })).map((s) => s.texto)).toEqual(['Faturada', 'Finalizada']);
  });

  describe('motorista/veículo do WinThor', () => {
    it('10 e 2 é "cliente vem buscar"', () => {
      expect(ehClienteVemBuscar(carregamento({ codMotoristaWinThor: 10, codVeiculoWinThor: 2 }))).toBe(true);
      expect(ehClienteVemBuscar(carregamento({ codMotoristaWinThor: 10, codVeiculoWinThor: 5 }))).toBe(false);
      expect(ehClienteVemBuscar(carregamento())).toBe(false);
    });

    it('mostra o que o WinThor gravou', () => {
      expect(rotuloWinThor(carregamento())).toBe('M14 · V79');
      expect(rotuloWinThor(carregamento({ codMotoristaWinThor: null, codVeiculoWinThor: undefined }))).toBe('M- · V-');
    });
  });

  describe('filtros', () => {
    const buscar = carregamento({ numero: 1, destino: 'SOUSA', codMotoristaWinThor: 10, codVeiculoWinThor: 2, faturada: true });
    const buscar2 = carregamento({ numero: 2, destino: 'BOA COMPRA', codMotoristaWinThor: 10, codVeiculoWinThor: 2 });
    const cachoeira = carregamento({ numero: 423361, destino: 'CACHOEIRA' });
    const compl = carregamento({ numero: 423364, destino: 'cachoeira ', principal: false });
    const p = planilha([rota([buscar]), rota([buscar2]), rota([cachoeira, compl])]);
    const linhas = linhasDaPlanilha(p);

    it('lista as linhas rota por rota, principal antes dos complementos', () => {
      expect(linhas.map((l) => l.carregamento.numero)).toEqual([1, 2, 423361, 423364]);
    });

    it('filtra por situação', () => {
      expect(filtrar(linhas, { ...FILTROS_VAZIOS, situacao: 'faturadas' }).map((l) => l.carregamento.numero)).toEqual([1]);
      expect(filtrar(linhas, { ...FILTROS_VAZIOS, situacao: 'naoFaturadas' }).length).toBe(3);
    });

    it('filtra pelo motorista/veículo do WinThor (só os "cliente vem buscar")', () => {
      expect(filtrar(linhas, { ...FILTROS_VAZIOS, winthor: '10/2' }).map((l) => l.carregamento.numero)).toEqual([1, 2]);
    });

    it('filtra por cidade sem se importar com maiúscula nem espaço sobrando', () => {
      expect(filtrar(linhas, { ...FILTROS_VAZIOS, destino: 'CACHOEIRA' }).map((l) => l.carregamento.numero)).toEqual([423361, 423364]);
    });

    it('busca pelo número e junta os filtros', () => {
      expect(filtrar(linhas, { ...FILTROS_VAZIOS, busca: '4233' }).length).toBe(2);
      expect(filtrar(linhas, { ...FILTROS_VAZIOS, winthor: '10/2', situacao: 'naoFaturadas' }).map((l) => l.carregamento.numero)).toEqual([2]);
    });

    it('as opções do filtro vêm do que existe na planilha, com a quantidade', () => {
      const destinos = opcoesDestino(linhas);
      expect(destinos.find((d) => d.chave === 'CACHOEIRA')?.qtd).toBe(2);
      expect(destinos.map((d) => d.chave)).toEqual(['BOA COMPRA', 'CACHOEIRA', 'SOUSA']);

      const winthor = opcoesWinThor(linhas);
      expect(winthor[0]).toEqual({ chave: '10/2', rotulo: '10 / 2 · Cliente vem buscar', qtd: 2 });
      expect(winthor[1].chave).toBe('14/79');
    });
  });

  describe('totais', () => {
    it('soma peso, valor e pedidos e conta clientes distintos (sem repetir)', () => {
      const a = carregamento({ numero: 1, pesoToneladas: 2.16, valorTotal: 18420.5, totalPedidos: 27, codigosClientes: [1, 2, 3] });
      const b = carregamento({ numero: 2, pesoToneladas: 3.2, valorTotal: 9870.25, totalPedidos: 14, codigosClientes: [3, 4] });
      const t = totaisDe(linhasDaPlanilha(planilha([rota([a, b])])));

      expect(t).toEqual({ carregamentos: 2, pesoToneladas: 5.36, valor: 28290.75, pedidos: 41, clientes: 4 });
    });

    it('sem nada marcado, tudo zero', () => {
      expect(totaisDe([])).toEqual({ carregamentos: 0, pesoToneladas: 0, valor: 0, pedidos: 0, clientes: 0 });
    });
  });

  describe('ações em lote', () => {
    const principal = carregamento({ numero: 10 });
    const faturado = carregamento({ numero: 11, faturada: true });
    const comp = carregamento({ numero: 12, principal: false });
    const rotas = [rota([principal, comp]), rota([faturado]), rota([carregamento({ numero: 13 })])];
    const linhas = linhasDaPlanilha(planilha(rotas));

    it('só oferece como destino do "juntar" quem não faturou e não está na seleção', () => {
      expect(principaisParaJuntar(rotas, new Set([13])).map((r) => r.numeroPrincipal)).toEqual([10]);
      expect(principaisParaJuntar(rotas, new Set()).map((r) => r.numeroPrincipal)).toEqual([10, 13]);
    });

    it('avisa quando a seleção tem faturado (só dá para tirar) ou complemento (dá para separar)', () => {
      expect(selecaoTemFaturado(linhas, new Set([10, 11]))).toBe(true);
      expect(selecaoTemFaturado(linhas, new Set([10]))).toBe(false);
      expect(selecaoTemComplemento(linhas, new Set([12]))).toBe(true);
      expect(selecaoTemComplemento(linhas, new Set([10]))).toBe(false);
    });
  });

  describe('impressão no formato da folha de papel', () => {
    const p = planilha(
      [
        rota([carregamento({ destino: 'CACHOEIRA' }), carregamento({ numero: 423364, principal: false, destino: 'SANTA CRUZ' }), carregamento({ numero: 423366, principal: false, destino: 'CACHOEIRA' })], {
          numeroPrincipal: 423360,
          motorista: { id: '1', codigo: 'MOT-1', nome: 'Francisco' },
          ajudantes: [{ id: '3', codigo: 'AJU-1', nome: 'João' }, { id: '4', codigo: 'AJU-2', nome: 'Pedro' }],
          box: { numero: 3, nome: 'Box 3' },
          diaSaida: 'AMANHA',
          turnoSaida: 'MANHA',
          caminhao: { id: '2', codigo: 'CAM-1', placa: 'JNB1373' },
          destinos: ['CACHOEIRA', 'SANTA CRUZ'],
          totalCidades: 2,
          totalClientes: 32,
          totalPedidos: 39,
        }),
      ],
      { status: 'FECHADA', pesoToneladas: 8.458 },
    );
    const html = montarHtmlImpressao(p);

    it('tem o cabeçalho, a data e o dia da semana', () => {
      expect(html).toContain('Controle de saída de cargas');
      expect(html).toContain('13/11/2026');
      expect(html).toContain('sexta-feira');
    });

    it('tem as colunas do papel e não tem as que foram tiradas', () => {
      for (const coluna of ['Motorista', 'Ajudantes', 'Box', 'Saída', 'Nº cargas', 'S. carga', 'Peso (t)', 'Nº pedidos', 'Nº entrg', 'Rota', 'Qt cidades atend']) {
        expect(html).toContain(coluna);
      }
      expect(html).not.toContain('Notas fiscais');
      expect(html).not.toContain('Data saída');
    });

    it('uma linha por rota: principal em "Nº cargas", complementos em "S. carga", destinos e cidades', () => {
      expect(html).toContain('<td>Francisco</td>');
      expect(html).toContain('<td>João, Pedro</td>');
      expect(html).toContain('<td class="c">Box 3</td>');
      expect(html).toContain('<td class="c">Amanhã · Manhã</td>');
      expect(html).toContain('<td class="c">423360</td>');
      expect(html).toContain('<td class="c">423364, 423366</td>');
      expect(html).toContain('CACHOEIRA / SANTA CRUZ');
      expect(html).toContain('<td class="c">2</td>');
      expect(html).toContain('8,458');
    });

    it('imprime só as rotas pedidas, com os totais só delas', () => {
      const outra = rota([carregamento({ numero: 999, destino: 'SOUSA', pesoToneladas: 1.5 })], {
        pesoToneladas: 1.5,
        totalPedidos: 5,
        totalClientes: 2,
        destinos: ['SOUSA'],
        motorista: { id: '9', codigo: 'MOT-9', nome: 'Venilson' },
      });
      const duas: PlanejamentoPlanilha = { ...p, rotas: [...p.rotas, outra] };

      const soAOutra = montarHtmlImpressao(duas, [outra]);

      expect(soAOutra).toContain('Venilson');
      expect(soAOutra).toContain('999');
      expect(soAOutra).not.toContain('Francisco');
      expect(soAOutra).not.toContain('423360');
      expect(soAOutra).toContain('<td class="n">1,50</td>');
      expect(soAOutra).toContain('<td class="n">5</td>');

      const todas = montarHtmlImpressao(duas);
      expect(todas).toContain('Francisco');
      expect(todas).toContain('Venilson');
    });

    it('completa a folha com linhas em branco, como o papel', () => {
      expect((html.match(/class="branca"/g) ?? []).length).toBe(17);
    });

    it('escapa o texto', () => {
      const perigosa = planilha([rota([carregamento()], { destinos: ['A <b>&</b> B'] })]);
      const h = montarHtmlImpressao(perigosa);
      expect(h).toContain('A &lt;b&gt;&amp;&lt;/b&gt; B');
      expect(h).not.toContain('<b>&</b>');
    });
  });
});
