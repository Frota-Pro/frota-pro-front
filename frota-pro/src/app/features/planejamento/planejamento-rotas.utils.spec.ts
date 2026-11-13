import { PlanejamentoCarregamento, PlanejamentoPlanilha, PlanejamentoRota } from '../../core/api/planejamento-api.models';
import {
  FILTROS_VAZIOS,
  PALETA_ROTAS,
  corDaRota,
  ehSolta,
  principalDaNovaRota,
  rotaPlanejada,
  filtrar,
  filtrosAtivos,
  linhasDaPlanilha,
  montarMensagem,
  nomeBonito,
  numerosParaJuntar,
  opcoesDePrincipal,
  opcoesWinThor,
  partesWinThor,
  rotasJuntas,
  rotuloSaida,
  rotuloWinThor,
  textoWinThor,
} from './planejamento.utils';

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
    pesoToneladas: 1,
    valorTotal: 100,
    totalClientes: 1,
    totalPedidos: 1,
    destinos: [],
    totalCidades: 1,
    avisos: [],
    carregamentos: cs,
    ...parcial,
  };
}

function planilha(rotas: PlanejamentoRota[]): PlanejamentoPlanilha {
  return {
    id: 'x', data: '2026-11-13', status: 'ABERTA', podeReabrir: false,
    totalCarregamentos: rotas.reduce((s, r) => s + r.carregamentos.length, 0),
    totalRotas: rotas.length, pesoToneladas: 1, valorTotal: 100, rotas, boxes: [],
  };
}

describe('planejamento: nome e placa do WinThor', () => {
  it('mostra o nome do motorista e a placa, em vez do código', () => {
    const c = carga({ nomeMotoristaWinThor: 'FRANCISCO', placaVeiculoWinThor: 'JNB1373' });
    expect(rotuloWinThor(c)).toBe('FRANCISCO · JNB1373');
  });

  it('se faltar um dos dois, completa com o código; se faltar tudo, só os códigos', () => {
    expect(rotuloWinThor(carga({ nomeMotoristaWinThor: 'FRANCISCO' }))).toBe('FRANCISCO · V79');
    expect(rotuloWinThor(carga({ placaVeiculoWinThor: 'JNB1373' }))).toBe('M14 · JNB1373');
    expect(rotuloWinThor(carga({}))).toBe('M14 · V79');
  });

  it('"cliente vem buscar" aparece escrito, sem repetir se o nome do motorista já diz isso', () => {
    const buscar = carga({ codMotoristaWinThor: 10, codVeiculoWinThor: 2, nomeMotoristaWinThor: 'JOAO', placaVeiculoWinThor: 'ABC1D23' });
    expect(textoWinThor(buscar)).toBe('JOAO · ABC1D23 · Cliente vem buscar');

    const nomeJaDiz = carga({ codMotoristaWinThor: 10, codVeiculoWinThor: 2, nomeMotoristaWinThor: 'CLIENTE VEM BUSCAR', placaVeiculoWinThor: 'ABC1D23' });
    expect(textoWinThor(nomeJaDiz)).toBe('CLIENTE VEM BUSCAR · ABC1D23');

    expect(textoWinThor(carga({ nomeMotoristaWinThor: 'FRANCISCO', placaVeiculoWinThor: 'JNB1373' }))).toBe('FRANCISCO · JNB1373');
  });

  it('em duas linhas: nome em cima, placa embaixo, e o aviso só quando precisa', () => {
    expect(partesWinThor(carga({ nomeMotoristaWinThor: 'FRANCISCO', placaVeiculoWinThor: 'JNB1373' }))).toEqual({ nome: 'FRANCISCO', placa: 'JNB1373', buscar: false });
    expect(partesWinThor(carga({ codMotoristaWinThor: 10, codVeiculoWinThor: 2, nomeMotoristaWinThor: 'JOAO', placaVeiculoWinThor: 'ABC1D23' })).buscar).toBe(true);
    expect(partesWinThor(carga({ codMotoristaWinThor: 10, codVeiculoWinThor: 2, nomeMotoristaWinThor: 'CLIENTE VEM BUSCAR' })).buscar).toBe(false);
    expect(partesWinThor(carga({}))).toEqual({ nome: 'M14', placa: 'V79', buscar: false });
  });

  it('o filtro do WinThor mostra nome e placa quando existem', () => {
    const p = planilha([
      rota([carga({ numero: 1, codMotoristaWinThor: 10, codVeiculoWinThor: 2, nomeMotoristaWinThor: 'CLIENTE VEM BUSCAR', placaVeiculoWinThor: 'ABC1D23' })]),
      rota([carga({ numero: 2, nomeMotoristaWinThor: 'FRANCISCO', placaVeiculoWinThor: 'JNB1373' })]),
    ]);
    const opcoes = opcoesWinThor(linhasDaPlanilha(p));

    expect(opcoes.map((o) => o.rotulo).sort()).toEqual(['CLIENTE VEM BUSCAR · ABC1D23', 'FRANCISCO · JNB1373']);
    expect(opcoes.map((o) => o.chave).sort()).toEqual(['10/2', '14/79']);
  });
});

describe('planejamento: juntar escolhendo o principal entre os marcados', () => {
  const a = carga({ numero: 10 });
  const b = carga({ numero: 11 });
  const c = carga({ numero: 12 });
  const faturado = carga({ numero: 13, faturada: true });
  const rotas = [rota([a]), rota([b]), rota([c]), rota([faturado])];
  const linhas = linhasDaPlanilha(planilha(rotas));

  it('os marcados são as opções de principal, e o primeiro vem sugerido', () => {
    const o = opcoesDePrincipal(rotas, new Set([10, 11]));

    expect(o.dosSelecionados.map((r) => r.numeroPrincipal)).toEqual([10, 11]);
    expect(o.outrasRotas.map((r) => r.numeroPrincipal)).toEqual([12]); // faturada não é opção
    expect(o.sugerido).toBe(10);
  });

  it('se um dos marcados já é principal de uma rota com complementos, ele é o sugerido', () => {
    const p = carga({ numero: 20 });
    const comp = carga({ numero: 21, principal: false });
    const rs = [rota([a]), rota([p, comp])];

    expect(opcoesDePrincipal(rs, new Set([10, 20])).sugerido).toBe(20);
  });

  it('com um só marcado não sugere nada (ele pode ser encaixado em outra rota)', () => {
    const o = opcoesDePrincipal(rotas, new Set([10]));

    expect(o.sugerido).toBeNull();
    expect(o.outrasRotas.map((r) => r.numeroPrincipal)).toEqual([11, 12]);
  });

  it('complemento marcado não vira opção de principal', () => {
    const principal = carga({ numero: 30 });
    const comp = carga({ numero: 31, principal: false });
    const rs = [rota([principal, comp]), rota([a])];

    const o = opcoesDePrincipal(rs, new Set([31, 10]));

    expect(o.dosSelecionados.map((r) => r.numeroPrincipal)).toEqual([10]);
  });

  it('manda para a API só quem precisa ser ligado (sem o principal e sem quem já é complemento dele)', () => {
    expect(numerosParaJuntar(linhas, new Set([10, 11, 12]), 10)).toEqual([11, 12]);

    const principal = carga({ numero: 30 });
    const jaDele = carga({ numero: 31, principal: false });
    const solto = carga({ numero: 32 });
    const ls = linhasDaPlanilha(planilha([rota([principal, jaDele]), rota([solto])]));
    expect(numerosParaJuntar(ls, new Set([30, 31, 32]), 30)).toEqual([32]);
  });
});

describe('planejamento: cor das rotas', () => {
  it('só rota com complementos tem cor, e vem da paleta', () => {
    const colorida = rota([carga({ numero: 1 }), carga({ numero: 2, principal: false })], { cor: 2 });
    const sozinha = rota([carga({ numero: 3 })]);

    expect(corDaRota(colorida)).toEqual(PALETA_ROTAS[2]);
    expect(corDaRota(sozinha)).toBeNull();
    expect(corDaRota(null)).toBeNull();
  });

  it('cada cor da paleta tem borda e fundo, e todas são diferentes', () => {
    expect(PALETA_ROTAS.length).toBe(10);
    expect(new Set(PALETA_ROTAS.map((c) => c.borda)).size).toBe(10);
    PALETA_ROTAS.forEach((c) => {
      expect(c.borda).toMatch(/^#[0-9a-f]{6}$/);
      expect(c.fundo).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it('as rotas juntas são só as que têm mais de um carregamento', () => {
    const p = planilha([
      rota([carga({ numero: 1 }), carga({ numero: 2, principal: false })], { cor: 0 }),
      rota([carga({ numero: 3 })]),
    ]);

    expect(rotasJuntas(p).map((r) => r.numeroPrincipal)).toEqual([1]);
    expect(rotasJuntas(null)).toEqual([]);
  });

  it('filtrar por rota mostra só o principal e os complementos dela', () => {
    const p = planilha([
      rota([carga({ numero: 1 }), carga({ numero: 2, principal: false })], { cor: 0 }),
      rota([carga({ numero: 3 })]),
    ]);
    const linhas = linhasDaPlanilha(p);

    expect(filtrar(linhas, { ...FILTROS_VAZIOS, rota: 1 }).map((l) => l.carregamento.numero)).toEqual([1, 2]);
    expect(filtrosAtivos({ ...FILTROS_VAZIOS, rota: 1 })).toBe(true);
    expect(filtrosAtivos(FILTROS_VAZIOS)).toBe(false);
  });
});

describe('planejamento: saída e mensagem para o grupo', () => {
  const francisco = { id: '1', codigo: 'MOT-1', nome: 'FRANCISCO LAMARK FORMIGA PIRES' };
  const venilson = { id: '2', codigo: 'MOT-2', nome: 'VENILSON' };
  const joao = { id: '3', codigo: 'AJU-1', nome: 'JOÃO DA SILVA' };
  const pedro = { id: '4', codigo: 'AJU-2', nome: 'Pedro' };

  function rotaDe(motorista: typeof francisco | null, parcial: Partial<PlanejamentoRota>): PlanejamentoRota {
    const destinos = parcial.destinos ?? [];
    return rota([carga({ numero: parcial.numeroPrincipal ?? 1, destino: destinos[0] })], { motorista, ...parcial });
  }

  it('o rótulo da saída junta o dia e o turno que foram escolhidos', () => {
    expect(rotuloSaida(rotaDe(null, { diaSaida: 'AMANHA', turnoSaida: 'MANHA' }))).toBe('Amanhã · Manhã');
    expect(rotuloSaida(rotaDe(null, { diaSaida: 'HOJE' }))).toBe('Hoje');
    expect(rotuloSaida(rotaDe(null, { turnoSaida: 'NOITE' }))).toBe('Noite');
    expect(rotuloSaida(rotaDe(null, {}))).toBe('');
  });

  it('escreve os nomes com iniciais maiúsculas, sem gritar, e deixa "de/da/do" em minúsculo', () => {
    expect(nomeBonito('JOSE BERNARDO DE SOUSA JUNIOR')).toBe('Jose Bernardo de Sousa Junior');
    expect(nomeBonito('  poco   dantas ')).toBe('Poco Dantas');
    expect(nomeBonito(null)).toBe('');
  });

  it('a mensagem das saídas de amanhã fica pronta para o grupo: título, data, turno, cada rota e o total', () => {
    const rotas = [
      rotaDe(francisco, {
        numeroPrincipal: 1, diaSaida: 'AMANHA', turnoSaida: 'MANHA', ajudantes: [joao, pedro], destinos: ['CAJAZEIRAS', 'SOUSA'],
        box: { numero: 3, nome: 'Box 3' }, caminhao: { id: 'c', codigo: 'CAM-1', placa: 'JNB1373' },
      }),
      rotaDe(venilson, { numeroPrincipal: 2, diaSaida: 'AMANHA', turnoSaida: 'MANHA', ajudantes: [], destinos: ['CATOLE'] }),
    ];

    expect(montarMensagem(rotas, '2026-11-13')).toBe(
      [
        '🚚 *SAÍDAS DE AMANHÃ*',
        '📅 sábado, 14/11/2026',
        '━━━━━━━━━━━━━━━━',
        '',
        '🌅 *MANHÃ*',
        '',
        '👤 *Francisco Lamark Formiga Pires*',
        '👷 João da Silva, Pedro',
        '📍 Cajazeiras',
        '🚛 JNB1373',
        '📦 Box 3',
        '',
        '👤 *Venilson*',
        '📍 Catole',
        '',
        '━━━━━━━━━━━━━━━━',
        '✅ *2 saídas*',
      ].join('\n'),
    );
  });

  it('de uma rota com complementos entra só a cidade da carga principal', () => {
    const principal = carga({ numero: 1, destino: 'POCO DANTAS' });
    const complemento = carga({ numero: 2, principal: false, destino: 'SAO JOAO' });
    const rotaJunta = rota([principal, complemento], {
      motorista: francisco,
      diaSaida: 'AMANHA',
      turnoSaida: 'MANHA',
      destinos: ['POCO DANTAS', 'SAO JOAO'],
    });

    const texto = montarMensagem([rotaJunta], '2026-11-13');

    expect(texto).toContain('📍 Poco Dantas');
    expect(texto).not.toContain('Sao Joao');
    expect(texto).toContain('✅ *1 saída*');
  });

  it('agrupa por turno na ordem do dia (cada um com o seu ícone), e quem não tem turno vai por último', () => {
    const rotas = [
      rotaDe(venilson, { numeroPrincipal: 2, diaSaida: 'HOJE', turnoSaida: 'NOITE', destinos: ['PATOS'] }),
      rotaDe(francisco, { numeroPrincipal: 1, diaSaida: 'HOJE', turnoSaida: 'MADRUGADA', destinos: ['SOUSA'] }),
      rotaDe(null, { numeroPrincipal: 3, diaSaida: 'HOJE', destinos: ['BREJO'] }),
    ];

    const texto = montarMensagem(rotas, '2026-11-13');
    const linhas = texto.split('\n');

    expect(linhas[0]).toBe('🚚 *SAÍDAS DE HOJE*');
    expect(linhas[1]).toBe('📅 sexta-feira, 13/11/2026');
    expect(linhas.filter((l) => /^(🌙|🌅|☀️|🌃|🕐) \*/.test(l))).toEqual(['🌙 *MADRUGADA*', '🌃 *NOITE*', '🕐 *SEM TURNO DEFINIDO*']);
    expect(texto).toContain('👤 *Motorista a definir*');
  });

  it('sem nenhum turno escolhido não cria cabeçalhos de turno', () => {
    const rotas = [rotaDe(francisco, { numeroPrincipal: 1, diaSaida: 'AMANHA', destinos: ['SOUSA'] })];

    const texto = montarMensagem(rotas, '2026-11-13');

    expect(texto).not.toContain('SEM TURNO');
    expect(texto).not.toContain('🕐');
  });

  it('quando as rotas saem em dias diferentes o título não promete data', () => {
    const rotas = [
      rotaDe(francisco, { numeroPrincipal: 1, diaSaida: 'HOJE', turnoSaida: 'TARDE', destinos: ['SOUSA'] }),
      rotaDe(venilson, { numeroPrincipal: 2, diaSaida: 'AMANHA', turnoSaida: 'MANHA', destinos: ['CATOLE'] }),
    ];

    const linhas = montarMensagem(rotas, '2026-11-13').split('\n');

    expect(linhas[0]).toBe('🚚 *SAÍDAS*');
    expect(linhas[1]).toBe('━━━━━━━━━━━━━━━━');
  });

  it('sem nenhuma rota escolhida não gera texto', () => {
    expect(montarMensagem([], '2026-11-13')).toBe('');
  });

  it('a virada do mês é calculada certo (amanhã de 30/11 é 01/12)', () => {
    const rotas = [rotaDe(francisco, { numeroPrincipal: 1, diaSaida: 'AMANHA', destinos: ['SOUSA'] })];

    expect(montarMensagem(rotas, '2026-11-30')).toContain('📅 terça-feira, 01/12/2026');
  });
});

describe('planejamento: carga solta ou rota', () => {
  const sozinha = () => rota([carga({ numero: 1 })]);

  it('uma carga sem nada escolhido é solta', () => {
    expect(rotaPlanejada(sozinha())).toBe(false);
    expect(ehSolta(sozinha(), new Set())).toBe(true);
  });

  it('com mais de uma carga ou qualquer escolha, já é rota', () => {
    expect(rotaPlanejada(rota([carga({ numero: 1 }), carga({ numero: 2, principal: false })]))).toBe(true);
    expect(rotaPlanejada({ ...sozinha(), motorista: { id: '1', codigo: 'M', nome: 'X' } })).toBe(true);
    expect(rotaPlanejada({ ...sozinha(), caminhao: { id: '1', codigo: 'C', placa: 'AAA0000' } })).toBe(true);
    expect(rotaPlanejada({ ...sozinha(), ajudantes: [{ id: '1', codigo: 'A', nome: 'X' }] })).toBe(true);
    expect(rotaPlanejada({ ...sozinha(), box: { numero: 1, nome: 'Box 1' } })).toBe(true);
    expect(rotaPlanejada({ ...sozinha(), diaSaida: 'HOJE' })).toBe(true);
    expect(rotaPlanejada({ ...sozinha(), turnoSaida: 'TARDE' })).toBe(true);
  });

  it('a carga em que se mandou "criar rota" deixa de ser solta mesmo vazia', () => {
    expect(ehSolta(sozinha(), new Set([1]))).toBe(false);
  });

  it('o principal da rota nova é a de menor número', () => {
    expect(principalDaNovaRota([423361, 423337, 423350], new Set())).toBe(423337);
  });

  it('faturada não pode ser o principal; se só tem faturada, não há principal', () => {
    expect(principalDaNovaRota([1, 2, 3], new Set([1]))).toBe(2);
    expect(principalDaNovaRota([1], new Set([1]))).toBeNull();
  });
});
