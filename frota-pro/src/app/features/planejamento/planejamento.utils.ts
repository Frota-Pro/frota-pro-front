import { PlanejamentoCarregamento, PlanejamentoPlanilha, PlanejamentoRota } from '../../core/api/planejamento-api.models';

/** yyyy-MM-dd → dd/MM/yyyy (sem passar por Date, para não mudar o dia por causa do fuso). */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.substring(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/** Dia da semana por extenso ("segunda-feira") de uma data yyyy-MM-dd. */
export function diaDaSemana(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.substring(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long' });
}

/** Peso em toneladas, no padrão do sistema (2 a 3 casas). */
export function formatarToneladas(valor: number | null | undefined): string {
  return Number(valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

export function formatarMoeda(valor: number | null | undefined): string {
  return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Quem pode montar a planilha: Operador de logística e Admin. Os outros só consultam e imprimem. */
export function podeEditarPlanejamento(authorities: string[] | null | undefined): boolean {
  const a = authorities ?? [];
  return a.includes('ROLE_ADMIN') || a.includes('ROLE_OPERADOR_LOGISTICA');
}

// ---------------------------------------------------------------------------------------------------------
// Selos e rótulos
// ---------------------------------------------------------------------------------------------------------

export interface Selo {
  texto: string;
  tipo: 'aviso' | 'ok' | 'info' | 'neutro';
}

const STATUS_CARGA: Record<string, Selo> = {
  SINCRONIZADA: { texto: 'Sincronizada', tipo: 'neutro' },
  EM_ROTA: { texto: 'Em rota', tipo: 'info' },
  FINALIZADA: { texto: 'Finalizada', tipo: 'ok' },
};

/** Os selos de um carregamento: faturamento no WinThor e, depois de faturado, o andamento no app do motorista. */
export function selosDoCarregamento(c: PlanejamentoCarregamento): Selo[] {
  if (!c.faturada) return [{ texto: 'Não faturada', tipo: 'aviso' }];
  const selos: Selo[] = [{ texto: 'Faturada', tipo: 'ok' }];
  const carga = c.statusCarga ? STATUS_CARGA[c.statusCarga] ?? { texto: c.statusCarga, tipo: 'neutro' as const } : null;
  selos.push(carga ?? { texto: 'Aguardando sincronizar', tipo: 'neutro' });
  return selos;
}

/** Motorista 10 e veículo 2 no WinThor: o cliente vem buscar (não sai em rota). */
export function ehClienteVemBuscar(c: PlanejamentoCarregamento): boolean {
  return c.codMotoristaWinThor === 10 && c.codVeiculoWinThor === 2;
}

/**
 * O que o WinThor gravou no carregamento, para gente ler: "FRANCISCO · JNB1373". Se o WinThor não souber o nome ou a
 * placa, cai nos códigos ("M14 · V79").
 */
export function rotuloWinThor(c: PlanejamentoCarregamento): string {
  const nome = c.nomeMotoristaWinThor?.trim();
  const placa = c.placaVeiculoWinThor?.trim();
  const m = nome || `M${c.codMotoristaWinThor ?? '-'}`;
  const v = placa || `V${c.codVeiculoWinThor ?? '-'}`;
  return `${m} · ${v}`;
}

/** O que a tela mostra em duas linhas: o nome do motorista e, embaixo, a placa (e "Cliente vem buscar", se for o caso). */
export function partesWinThor(c: PlanejamentoCarregamento): { nome: string; placa: string; buscar: boolean } {
  const nome = c.nomeMotoristaWinThor?.trim() || `M${c.codMotoristaWinThor ?? '-'}`;
  const placa = c.placaVeiculoWinThor?.trim() || `V${c.codVeiculoWinThor ?? '-'}`;
  return { nome, placa, buscar: ehClienteVemBuscar(c) && !/BUSCAR/i.test(nome) };
}

/** O rótulo + "Cliente vem buscar" quando for o caso (sem repetir se o nome do motorista já diz isso). */
export function textoWinThor(c: PlanejamentoCarregamento): string {
  const base = rotuloWinThor(c);
  if (!ehClienteVemBuscar(c) || /BUSCAR/i.test(c.nomeMotoristaWinThor ?? '')) return base;
  return `${base} · Cliente vem buscar`;
}

// ---------------------------------------------------------------------------------------------------------
// Tabela única: linhas, filtros e totais
// ---------------------------------------------------------------------------------------------------------

/** Uma linha da tabela: o carregamento e a rota a que ele pertence. */
export interface LinhaPlanilha {
  carregamento: PlanejamentoCarregamento;
  rota: PlanejamentoRota;
}

/** Todas as linhas, rota por rota (o principal e logo depois os complementos dele). */
export function linhasDaPlanilha(p: PlanejamentoPlanilha | null): LinhaPlanilha[] {
  if (!p) return [];
  return p.rotas.flatMap((rota) => rota.carregamentos.map((carregamento) => ({ carregamento, rota })));
}

export interface Filtros {
  situacao: 'todas' | 'faturadas' | 'naoFaturadas';
  /** Destino normalizado (ver chaveDestino); vazio = todos. */
  destino: string;
  /** "10/2" (motorista/veículo do WinThor); vazio = todos. */
  winthor: string;
  busca: string;
  /** Número do principal de uma rota juntada: mostra só ela. */
  rota: number | null;
}

export const FILTROS_VAZIOS: Filtros = { situacao: 'todas', destino: '', winthor: '', busca: '', rota: null };

export function filtrosAtivos(f: Filtros): boolean {
  return f.situacao !== 'todas' || !!f.destino || !!f.winthor || !!f.busca.trim() || f.rota !== null;
}

export function chaveDestino(destino: string | null | undefined): string {
  return (destino ?? '').trim().toUpperCase();
}

export function chaveWinThor(c: PlanejamentoCarregamento): string {
  return `${c.codMotoristaWinThor ?? '-'}/${c.codVeiculoWinThor ?? '-'}`;
}

export function filtrar(linhas: LinhaPlanilha[], f: Filtros): LinhaPlanilha[] {
  const busca = f.busca.trim();
  return linhas.filter(({ carregamento: c, rota }) => {
    if (f.rota !== null && rota.numeroPrincipal !== f.rota) return false;
    if (f.situacao === 'faturadas' && !c.faturada) return false;
    if (f.situacao === 'naoFaturadas' && c.faturada) return false;
    if (f.destino && chaveDestino(c.destino) !== f.destino) return false;
    if (f.winthor && chaveWinThor(c) !== f.winthor) return false;
    if (busca && !String(c.numero).includes(busca)) return false;
    return true;
  });
}

/** Destinos que aparecem na planilha (para o filtro de cidade), em ordem alfabética. */
export function opcoesDestino(linhas: LinhaPlanilha[]): { chave: string; rotulo: string; qtd: number }[] {
  const mapa = new Map<string, { chave: string; rotulo: string; qtd: number }>();
  for (const { carregamento: c } of linhas) {
    const chave = chaveDestino(c.destino);
    if (!chave) continue;
    const atual = mapa.get(chave);
    if (atual) atual.qtd++;
    else mapa.set(chave, { chave, rotulo: (c.destino ?? '').trim(), qtd: 1 });
  }
  return [...mapa.values()].sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
}

/** Combinações motorista/veículo do WinThor que aparecem (para o filtro). */
export function opcoesWinThor(linhas: LinhaPlanilha[]): { chave: string; rotulo: string; qtd: number }[] {
  const mapa = new Map<string, { chave: string; rotulo: string; qtd: number }>();
  for (const { carregamento: c } of linhas) {
    const chave = chaveWinThor(c);
    const atual = mapa.get(chave);
    if (atual) atual.qtd++;
    else {
      const temNome = !!(c.nomeMotoristaWinThor?.trim() || c.placaVeiculoWinThor?.trim());
      const rotulo = temNome ? textoWinThor(c) : ehClienteVemBuscar(c)
        ? `${chave.replace('/', ' / ')} · Cliente vem buscar`
        : chave.replace('/', ' / ');
      mapa.set(chave, { chave, rotulo, qtd: 1 });
    }
  }
  // "cliente vem buscar" primeiro: é o filtro que mais se usa para limpar a planilha
  return [...mapa.values()].sort((a, b) => b.qtd - a.qtd || a.chave.localeCompare(b.chave));
}

export interface Totais {
  carregamentos: number;
  pesoToneladas: number;
  valor: number;
  pedidos: number;
  /** Clientes distintos entre os carregamentos escolhidos. */
  clientes: number;
}

export const TOTAIS_ZERADOS: Totais = { carregamentos: 0, pesoToneladas: 0, valor: 0, pedidos: 0, clientes: 0 };

/** Soma de qualquer conjunto de linhas (filtro ou seleção). */
export function totaisDe(linhas: LinhaPlanilha[]): Totais {
  const clientes = new Set<number>();
  let peso = 0;
  let valor = 0;
  let pedidos = 0;
  for (const { carregamento: c } of linhas) {
    peso += Number(c.pesoToneladas ?? 0);
    valor += Number(c.valorTotal ?? 0);
    pedidos += c.totalPedidos ?? 0;
    (c.codigosClientes ?? []).forEach((cod) => clientes.add(cod));
  }
  return {
    carregamentos: linhas.length,
    pesoToneladas: Math.round(peso * 1000) / 1000,
    valor: Math.round(valor * 100) / 100,
    pedidos,
    clientes: clientes.size,
  };
}

// ---------------------------------------------------------------------------------------------------------
// Carga solta x rota
// ---------------------------------------------------------------------------------------------------------

/**
 * Uma rota já está "planejada" quando tem mais de uma carga ou alguma escolha feita (motorista, caminhão,
 * ajudante, box ou saída). Antes disso a carga é só uma carga solta, esperando alguém planejar.
 */
export function rotaPlanejada(r: PlanejamentoRota): boolean {
  return (
    r.carregamentos.length > 1 ||
    !!r.motorista ||
    !!r.caminhao ||
    (r.ajudantes?.length ?? 0) > 0 ||
    !!r.box ||
    !!r.diaSaida ||
    !!r.turnoSaida
  );
}

/** Solta = ainda não planejada e a pessoa também não mandou "criar rota" para ela. */
export function ehSolta(r: PlanejamentoRota, iniciadas: Set<number>): boolean {
  return !rotaPlanejada(r) && !iniciadas.has(r.numeroPrincipal);
}

/** O principal de uma rota nova feita com várias cargas: a de menor número entre as que ainda não faturaram. */
export function principalDaNovaRota(numeros: number[], faturadas: Set<number>): number | null {
  const livres = numeros.filter((n) => !faturadas.has(n)).sort((a, b) => a - b);
  return livres.length > 0 ? livres[0] : null;
}

// ---------------------------------------------------------------------------------------------------------
// Ações em lote: o que dá para fazer com a seleção
// ---------------------------------------------------------------------------------------------------------

/** Principais em que dá para juntar a seleção: não faturados e que não estão na própria seleção. */
export function principaisParaJuntar(rotas: PlanejamentoRota[], selecionados: Set<number>): PlanejamentoRota[] {
  return rotas.filter((r) => !r.carregamentos[0]?.faturada && !selecionados.has(r.numeroPrincipal));
}

export interface OpcoesDePrincipal {
  /** Principais que já estão entre os marcados (qualquer um deles pode virar o principal da rota). */
  dosSelecionados: PlanejamentoRota[];
  /** Outras rotas da planilha, para encaixar a seleção numa que já existe. */
  outrasRotas: PlanejamentoRota[];
  /** Sugestão: a rota que já tem complementos entre os marcados; senão o primeiro marcado. */
  sugerido: number | null;
}

/**
 * Para juntar basta marcar as cargas que vão juntas e dizer qual é o principal: ele pode ser um dos próprios marcados.
 * (Complemento marcado não vira principal; faturado também não.)
 */
export function opcoesDePrincipal(rotas: PlanejamentoRota[], selecionados: Set<number>): OpcoesDePrincipal {
  const dosSelecionados = rotas.filter((r) => selecionados.has(r.numeroPrincipal) && !r.carregamentos[0]?.faturada);
  const outrasRotas = principaisParaJuntar(rotas, selecionados);
  const jaTemRota = dosSelecionados.find((r) => r.carregamentos.length > 1);
  const sugerido = selecionados.size >= 2 ? (jaTemRota ?? dosSelecionados[0])?.numeroPrincipal ?? null : null;
  return { dosSelecionados, outrasRotas, sugerido };
}

/** Quem da seleção precisa ser ligado ao principal (o próprio principal e quem já é complemento dele ficam de fora). */
export function numerosParaJuntar(linhas: LinhaPlanilha[], selecionados: Set<number>, principal: number): number[] {
  return linhas
    .filter((l) => selecionados.has(l.carregamento.numero))
    .filter((l) => l.carregamento.numero !== principal && !(l.carregamento.principal === false && l.rota.numeroPrincipal === principal))
    .map((l) => l.carregamento.numero);
}

// ---------------------------------------------------------------------------------------------------------
// Cor das rotas juntadas
// ---------------------------------------------------------------------------------------------------------

export interface CorDaRota {
  borda: string;
  fundo: string;
}

/** Mesma quantidade de cores que a API sorteia (PlanejamentoCargasService.TAMANHO_PALETA). */
export const PALETA_ROTAS: CorDaRota[] = [
  { borda: '#2563eb', fundo: '#dbeafe' }, // azul
  { borda: '#16a34a', fundo: '#dcfce7' }, // verde
  { borda: '#d97706', fundo: '#fef3c7' }, // âmbar
  { borda: '#9333ea', fundo: '#f3e8ff' }, // roxo
  { borda: '#db2777', fundo: '#fce7f3' }, // rosa
  { borda: '#0891b2', fundo: '#cffafe' }, // ciano
  { borda: '#dc2626', fundo: '#fee2e2' }, // vermelho
  { borda: '#65a30d', fundo: '#ecfccb' }, // limão
  { borda: '#ea580c', fundo: '#ffedd5' }, // laranja
  { borda: '#475569', fundo: '#e2e8f0' }, // cinza azulado
];

/** A cor da rota (só rota com complementos tem). */
export function corDaRota(rota: PlanejamentoRota | null | undefined): CorDaRota | null {
  if (!rota || rota.cor === null || rota.cor === undefined) return null;
  return PALETA_ROTAS[rota.cor % PALETA_ROTAS.length] ?? null;
}

/** Rotas que têm complementos (as que ganham cor e aparecem como atalho de filtro). */
export function rotasJuntas(p: PlanejamentoPlanilha | null): PlanejamentoRota[] {
  return (p?.rotas ?? []).filter((r) => r.carregamentos.length > 1);
}

/** Juntar/separar só valem para o que ainda não foi faturado. */
export function selecaoTemFaturado(linhas: LinhaPlanilha[], selecionados: Set<number>): boolean {
  return linhas.some((l) => selecionados.has(l.carregamento.numero) && l.carregamento.faturada);
}

/** Quem da seleção é complemento (só esses podem ser separados). */
export function selecaoTemComplemento(linhas: LinhaPlanilha[], selecionados: Set<number>): boolean {
  return linhas.some((l) => selecionados.has(l.carregamento.numero) && !l.carregamento.principal);
}

// ---------------------------------------------------------------------------------------------------------
// Saída (dia + turno) e mensagem para o grupo
// ---------------------------------------------------------------------------------------------------------

export const DIAS_SAIDA: { valor: string; rotulo: string }[] = [
  { valor: 'HOJE', rotulo: 'Hoje' },
  { valor: 'AMANHA', rotulo: 'Amanhã' },
];

export const TURNOS_SAIDA: { valor: string; rotulo: string }[] = [
  { valor: 'MADRUGADA', rotulo: 'Madrugada' },
  { valor: 'MANHA', rotulo: 'Manhã' },
  { valor: 'TARDE', rotulo: 'Tarde' },
  { valor: 'NOITE', rotulo: 'Noite' },
];

export function rotuloDia(valor: string | null | undefined): string {
  return DIAS_SAIDA.find((d) => d.valor === valor)?.rotulo ?? '';
}

export function rotuloTurno(valor: string | null | undefined): string {
  return TURNOS_SAIDA.find((t) => t.valor === valor)?.rotulo ?? '';
}

/** "Amanhã · Manhã" (ou só o que foi escolhido; vazio se nada). */
export function rotuloSaida(r: PlanejamentoRota): string {
  return [rotuloDia(r.diaSaida), rotuloTurno(r.turnoSaida)].filter(Boolean).join(' · ');
}

function somarDias(iso: string, dias: number): string {
  const [y, m, d] = iso.substring(0, 10).split('-').map(Number);
  const nova = new Date(y, m - 1, d + dias);
  return `${nova.getFullYear()}-${String(nova.getMonth() + 1).padStart(2, '0')}-${String(nova.getDate()).padStart(2, '0')}`;
}

/** "sábado, 14/11/2026" */
function dataCurta(iso: string): string {
  return `${diaDaSemana(iso)}, ${formatarData(iso)}`;
}

const ICONE_TURNO: Record<string, string> = { MADRUGADA: '🌙', MANHA: '🌅', TARDE: '☀️', NOITE: '🌃', '': '🕐' };
const SEPARADOR = '━━━━━━━━━━━━━━━━';
const PALAVRAS_DE_LIGACAO = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

/** "JOSE BERNARDO DE SOUSA" → "Jose Bernardo de Sousa" (o cadastro vem em letra maiúscula). */
export function nomeBonito(texto: string | null | undefined): string {
  return (texto ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((p, i) => (i > 0 && PALAVRAS_DE_LIGACAO.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
}

/** A cidade da rota na mensagem é a da carga PRINCIPAL; os complementos não aparecem. */
function destinoDaMensagem(r: PlanejamentoRota): string {
  return (r.carregamentos?.[0]?.destino ?? r.destinos?.[0] ?? '').trim();
}

/** O bloco de uma rota: quem leva, quem ajuda, para onde vai e de onde sai. */
function blocoDaRota(r: PlanejamentoRota): string[] {
  const linhas = [`👤 *${r.motorista ? nomeBonito(r.motorista.nome) : 'Motorista a definir'}*`];
  if (r.ajudantes?.length) linhas.push(`👷 ${r.ajudantes.map((a) => nomeBonito(a.nome)).join(', ')}`);
  const destino = destinoDaMensagem(r);
  if (destino) linhas.push(`📍 ${nomeBonito(destino)}`);
  if (r.caminhao?.placa) linhas.push(`🚛 ${r.caminhao.placa}`);
  if (r.box) linhas.push(`📦 ${r.box.nome}`);
  return linhas;
}

/**
 * Mensagem para o grupo do WhatsApp, só das rotas que a pessoa escolheu: título com o dia e a data, as rotas
 * agrupadas por turno e, em cada uma, motorista, ajudantes, a cidade da carga principal, o caminhão e o box.
 * (Os asteriscos são o negrito do WhatsApp.) É um ponto de partida: a tela deixa editar antes de copiar.
 */
export function montarMensagem(rotas: PlanejamentoRota[], dataPlanilhaIso: string): string {
  if (rotas.length === 0) return '';

  const dias = new Set(rotas.map((r) => r.diaSaida ?? ''));
  let titulo = 'SAÍDAS';
  let data = '';
  if (dias.size === 1 && dias.has('AMANHA')) {
    titulo = 'SAÍDAS DE AMANHÃ';
    data = dataCurta(somarDias(dataPlanilhaIso, 1));
  } else if (dias.size === 1 && dias.has('HOJE')) {
    titulo = 'SAÍDAS DE HOJE';
    data = dataCurta(dataPlanilhaIso);
  }

  const ordem = ['MADRUGADA', 'MANHA', 'TARDE', 'NOITE', ''];
  const grupos = ordem
    .map((turno) => ({ turno, rotas: rotas.filter((r) => (r.turnoSaida ?? '') === turno) }))
    .filter((g) => g.rotas.length > 0);
  const algumTurno = grupos.some((g) => g.turno !== '');

  const linhas: string[] = [`🚚 *${titulo}*`];
  if (data) linhas.push(`📅 ${data}`);
  linhas.push(SEPARADOR);

  for (const g of grupos) {
    linhas.push('');
    if (algumTurno) {
      const nome = g.turno ? rotuloTurno(g.turno).toUpperCase() : 'SEM TURNO DEFINIDO';
      linhas.push(`${ICONE_TURNO[g.turno]} *${nome}*`);
      linhas.push('');
    }
    g.rotas.forEach((r, i) => {
      if (i > 0) linhas.push('');
      linhas.push(...blocoDaRota(r));
    });
  }

  linhas.push('', SEPARADOR, `✅ *${rotas.length} saída${rotas.length > 1 ? 's' : ''}*`);
  return linhas.join('\n');
}

// ---------------------------------------------------------------------------------------------------------
// Impressão no formato da folha de papel "Controle de saída de cargas"
// ---------------------------------------------------------------------------------------------------------

function escapar(texto: unknown): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Linhas em branco para a folha ter o aspecto do papel (e sobrar espaço para escrever à mão). */
const LINHAS_MINIMAS = 18;

/**
 * A folha igual à de papel: uma linha por rota, com Motorista, Ajudantes, Box, Nº Cargas (o principal), S. Carga (os
 * complementos), Peso, Nº Pedidos, Nº Entrg (clientes), Rota (destinos) e Qt Cidades Atend.
 */
/**
 * @param rotas as rotas que vão para o papel (por padrão, todas da planilha). Os totais do rodapé somam só estas.
 */
export function montarHtmlImpressao(p: PlanejamentoPlanilha, rotas: PlanejamentoRota[] = p.rotas): string {
  const linhas = rotas
    .map((r) => {
      const complementos = r.carregamentos.filter((c) => !c.principal).map((c) => c.numero).join(', ');
      return `<tr>
        <td>${escapar(r.motorista?.nome)}</td>
        <td>${escapar((r.ajudantes ?? []).map((a) => a.nome).join(', '))}</td>
        <td class="c">${escapar(r.box?.nome)}</td>
        <td class="c">${escapar(r.numeroPrincipal)}</td>
        <td class="c">${escapar(complementos)}</td>
        <td class="n">${formatarToneladas(r.pesoToneladas)}</td>
        <td class="n">${r.totalPedidos}</td>
        <td class="n">${r.totalClientes}</td>
        <td>${escapar(r.destinos.join(' / '))}</td>
        <td class="c">${r.totalCidades}</td>
        <td class="c">${escapar(rotuloSaida(r))}</td>
      </tr>`;
    })
    .join('');

  const vazias = Math.max(0, LINHAS_MINIMAS - rotas.length);
  const brancas = Array.from({ length: vazias }, () => `<tr class="branca">${'<td></td>'.repeat(11)}</tr>`).join('');

  const totalPedidos = rotas.reduce((s, r) => s + r.totalPedidos, 0);
  const totalClientes = rotas.reduce((s, r) => s + r.totalClientes, 0);
  const totalPeso = Math.round(rotas.reduce((s, r) => s + Number(r.pesoToneladas ?? 0), 0) * 1000) / 1000;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Controle de saída de cargas ${formatarData(p.data)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111827; margin: 0; }
    .topo { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
    h1 { font-size: 16px; margin: 0; }
    .data { font-size: 13px; }
    .data b { margin-left: 6px; margin-right: 18px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #374151; padding: 4px 6px; text-align: left; }
    th { text-align: center; font-size: 10px; text-transform: uppercase; background: #f3f4f6; }
    td.n { text-align: right; }
    td.c { text-align: center; }
    tr.branca td { height: 21px; }
    tfoot td { font-weight: bold; background: #f9fafb; }
  </style></head><body>
  <div class="topo">
    <h1>Controle de saída de cargas</h1>
    <div class="data">DATA:<b>${formatarData(p.data)}</b> DIA:<b>${escapar(diaDaSemana(p.data))}</b></div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:15%">Motorista</th>
        <th style="width:12%">Ajudantes</th>
        <th style="width:6%">Box</th>
        <th style="width:8%">Nº cargas</th>
        <th style="width:11%">S. carga</th>
        <th style="width:7%">Peso (t)</th>
        <th style="width:7%">Nº pedidos</th>
        <th style="width:7%">Nº entrg</th>
        <th>Rota</th>
        <th style="width:7%">Qt cidades atend</th>
        <th style="width:9%">Saída</th>
      </tr>
    </thead>
    <tbody>${linhas}${brancas}</tbody>
    <tfoot>
      <tr>
        <td colspan="5">Total</td>
        <td class="n">${formatarToneladas(totalPeso)}</td>
        <td class="n">${totalPedidos}</td>
        <td class="n">${totalClientes}</td>
        <td colspan="3"></td>
      </tr>
    </tfoot>
  </table>
  </body></html>`;
}
