/** Planejamento de cargas: a planilha que a logística monta antes do faturamento. */

export type StatusPlanilhaPlanejamento = 'ABERTA' | 'FECHADA';

export interface PlanejamentoResumo {
  id: string;
  data: string; // yyyy-MM-dd
  status: StatusPlanilhaPlanejamento;
  totalCarregamentos: number;
  totalRotas: number;
  pesoToneladas: number;
}

export interface PlanejamentoPessoa {
  id: string;
  codigo: string;
  nome: string;
}

export interface PlanejamentoVeiculo {
  id: string;
  codigo: string;
  placa: string;
  descricao?: string | null;
}

export interface PlanejamentoBox {
  numero: number;
  nome: string;
  /** Número do principal da rota que está usando o box (rota ainda não faturada); vazio = livre. */
  ocupadoPorRota?: number | null;
}

export type DiaSaida = 'HOJE' | 'AMANHA';
export type TurnoSaida = 'MADRUGADA' | 'MANHA' | 'TARDE' | 'NOITE';

/** Motorista, ajudante ou caminhão que aparece em outra rota que pode sair na mesma hora. */
export interface PlanejamentoConflito {
  tipo: 'MOTORISTA' | 'AJUDANTE' | 'CAMINHAO';
  codigo: string;
  /** Nome do motorista/ajudante ou placa do caminhão. */
  nome: string;
  /** As outras rotas em que aparece. */
  rotas: number[];
  /** true: as duas rotas têm o mesmo dia e turno; false: algum dos horários ainda não foi definido. */
  mesmoHorario: boolean;
  texto: string;
}

export interface PlanejamentoCarregamento {
  numero: number;
  principal: boolean;
  destino?: string | null;
  pesoToneladas: number;
  valorTotal: number;
  totalClientes: number;
  /** Códigos dos clientes: servem para somar clientes distintos numa seleção. */
  codigosClientes: number[];
  totalPedidos: number;
  dataMontagem?: string | null; // yyyy-MM-dd
  /** Motorista e veículo que o WinThor gravou no carregamento (10 e 2 = cliente vem buscar). */
  codMotoristaWinThor?: number | null;
  codVeiculoWinThor?: number | null;
  /** Nome do motorista e placa do veículo que o WinThor gravou no carregamento. */
  nomeMotoristaWinThor?: string | null;
  placaVeiculoWinThor?: string | null;
  /** Já tem nota no WinThor: não muda mais de rota nem de motorista (só dá para tirar). */
  faturada: boolean;
  /** Status da carga no FrotaPRO (SINCRONIZADA, EM_ROTA, FINALIZADA...), quando ela já existe. */
  statusCarga?: string | null;
  motoristaCarga?: string | null;
  caminhaoCarga?: string | null;
}

export interface PlanejamentoRota {
  numeroPrincipal: number;
  motorista?: PlanejamentoPessoa | null;
  /** Pode ter vários ajudantes. */
  ajudantes: PlanejamentoPessoa[];
  /** O box é da rota inteira (principal e complementos). */
  box?: PlanejamentoBox | null;
  diaSaida?: DiaSaida | null;
  turnoSaida?: TurnoSaida | null;
  caminhao?: PlanejamentoVeiculo | null;
  /** Cor da rota (índice da paleta da tela): só existe quando a rota tem complementos. */
  cor?: number | null;
  pesoToneladas: number;
  valorTotal: number;
  /** Clientes distintos entre o principal e os complementos. */
  totalClientes: number;
  totalPedidos: number;
  /** Destinos distintos da rota. */
  destinos: string[];
  totalCidades: number;
  avisos: string[];
  /** Inconsistências desta rota (o que se repete em outra rota na mesma hora). */
  conflitos?: PlanejamentoConflito[];
  /** O principal primeiro, depois os complementos. */
  carregamentos: PlanejamentoCarregamento[];
}

export interface PlanejamentoPlanilha {
  id: string;
  data: string; // yyyy-MM-dd
  status: StatusPlanilhaPlanejamento;
  criadaPor?: string | null;
  criadaEm?: string | null;
  fechadaPor?: string | null;
  fechadaEm?: string | null;
  podeReabrir: boolean;
  totalCarregamentos: number;
  totalRotas: number;
  pesoToneladas: number;
  valorTotal: number;
  rotas: PlanejamentoRota[];
  /** Os boxes e quem está ocupando cada um. */
  boxes: PlanejamentoBox[];
}
