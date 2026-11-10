/** Um tipo da tela de Conferência (uma lista de itens para a pessoa conferir). */
export interface ConferenciaTipo {
  /** Ex.: REENTREGA_MOTORISTA_CAMINHAO */
  codigo: string;
  titulo: string;
  descricao: string;
}

/** O que o MDF-e (usado pela sincronização) diz. */
export interface ConferenciaManifesto {
  numMdfe?: number | null;
  situacao?: string | null;
  dataGeracao?: string | null;
  codigoMotorista?: string | null;
  nomeMotorista?: string | null;
  codigoVeiculo?: string | null;
  placa?: string | null;
}

/** Motorista e veículo de um dos lados da comparação. */
export interface ConferenciaPessoa {
  codigoMotorista?: string | null;
  nomeMotorista?: string | null;
  codigoVeiculo?: string | null;
  placa?: string | null;
}

export interface ConferenciaTransferencia {
  numNota: number;
  numCarAnterior?: number | null;
  numCarAtual?: number | null;
  dataTransferencia?: string | null;
  motivo?: string | null;
}

export interface ConferenciaMotoristaCaminhaoLinha {
  numeroCarga: string;
  numeroCargaExterno: string;
  statusCarga: string;
  iniciada: boolean;
  dtSaida?: string | null;
  kmInicial?: number | null;
  pesoCarga?: number | null;
  valorTotal?: number | null;

  manifesto: ConferenciaManifesto;
  carregamento: ConferenciaPessoa;
  atualNoFrota: ConferenciaPessoa;
  motoristaDefinidoManualmente: boolean;
  caminhaoDefinidoManualmente: boolean;

  trocarMotorista: boolean;
  codigoMotoristaNovo?: string | null;
  nomeMotoristaNovo?: string | null;
  trocarCaminhao: boolean;
  codigoCaminhaoNovo?: string | null;
  placaCaminhaoNovo?: string | null;

  podeConfirmar: boolean;
  aviso?: string | null;

  transferencias: ConferenciaTransferencia[];
}

export interface ConferenciaMotoristaCaminhaoResponse {
  inicio: string;
  fim: string;
  total: number;
  linhas: ConferenciaMotoristaCaminhaoLinha[];
}

export interface ConferenciaConfirmadaResponse {
  numeroCarga: string;
  numeroCargaExterno: string;
  motoristaAntes: string;
  motoristaDepois: string;
  caminhaoAntes: string;
  caminhaoDepois: string;
}
