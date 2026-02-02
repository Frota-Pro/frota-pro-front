export type TipoItemManutencao = 'PECA' | 'SERVICO' | string;

export interface ManutencaoItemResponse {
  id?: string;
  tipo: TipoItemManutencao;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface ParadaResumoResponse {
  id: string;
  numeroCarga?: string | null;
  tipoParada?: string | null;
  dtInicio?: string | null;
  dtFim?: string | null;
  cidade?: string | null;
  local?: string | null;
  kmOdometro?: number | null;
}

export interface ManutencaoResponse {
  id: string;
  codigo: string;
  descricao: string;

  dataInicioManutencao?: string | null;
  dataFimManutencao?: string | null;

  tipoManutencao: string;
  valor?: number | null;
  statusManutencao: string;

  itensTrocados?: string[] | null;
  itens?: ManutencaoItemResponse[] | null;

  observacoes?: string | null;

  codigoCaminhao: string;
  caminhao?: string | null;

  codigoOficina?: string | null;
  oficina?: string | null;

  parada?: ParadaResumoResponse | null;
}

/** REQUESTS */

export interface ManutencaoItemRequest {
  tipo: TipoItemManutencao;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface TrocaPneuManutencaoRequest {
  pneu: string;
  eixoNumero: number;
  lado: string;
  posicao: string;
  kmOdometro: number;
  tipoTroca: string;
}

export interface ManutencaoRequest {
  descricao: string;
  dataInicioManutencao: string;
  dataFimManutencao?: string | null;

  tipoManutencao: string;
  statusManutencao: string;

  caminhao: string; // codigo ou codigo externo (back aceita)
  oficina?: string | null; // codigo
  paradaId?: string | null; // UUID

  observacoes?: string | null;

  // compatibilidade antiga
  itensTrocados?: string[] | null;

  // novo: itens detalhados
  itens?: ManutencaoItemRequest[] | null;

  // mantém se você usa isso no back
  trocasPneu?: TrocaPneuManutencaoRequest[] | null;

  // fallback (se não tiver itens, pode salvar valor direto)
  valor?: number | null;
}
