export interface ClienteCargaResponse {
  cliente: string;
  cidade?: string | null;
  notas: string[];
}

export type StatusTransferenciaCarga = 'SEM_TRANSFERENCIA' | 'PENDENTE_SYNC' | 'CONCLUIDA';

export interface CargaMinResponse {
  numeroCarga: string;
  numeroCargaExterno?: string | null;
  /** Número a ser exibido ao usuário: externo se a integração estiver ativa, senão interno. */
  numeroCargaExibicao: string;
  dtSaida?: string | null;
  pesoCarga?: number | null;
  valorTotal?: number | null;
  statusCarga: string;
  transferenciaPendente?: boolean;
  statusTransferencia?: StatusTransferenciaCarga | null;
  nomeMotorista?: string | null;
  placaCaminhao?: string | null;

  /** Códigos de devolução (CODDEVOL) encontrados no último sync com o WinThor pra esta carga. */
  codigosDevolucaoEncontrados?: string[];

  /** true se o último sync encontrou transferência de pedido desta carga pra outro carregamento no WinThor. */
  teveTransferencia?: boolean;

  /** true se uma diminuição de peso/valor vinda do WinThor foi ignorada por falta de motivo reconhecido. */
  diminuicaoPesoValorBloqueada?: boolean;
}

export interface CargaResponse {
  id: string;
  numeroCarga: string;
  numeroCargaExterno?: string | null;
  /** Número a ser exibido ao usuário: externo se a integração estiver ativa, senão interno. */
  numeroCargaExibicao: string;

  dtSaida?: string | null;
  dtPrevista?: string | null;
  dtChegada?: string | null;

  pesoCarga?: number | null;
  valorTotal?: number | null;

  kmInicial?: number | null;
  kmFinal?: number | null;
  kmTotal?: number | null;

  diasAtraso?: number | null;

  clientes?: ClienteCargaResponse[];

  statusCarga: string;
  transferenciaPendente?: boolean;
  statusTransferencia?: StatusTransferenciaCarga | null;

  codigoMotorista?: string | null;
  nomeMotorista?: string | null;

  codigoCaminhao?: string | null;
  placaCaminhao?: string | null;

  codigoRota?: string | null;

  codigosAjudantes?: string[];

  ordemEntregaClientes?: string[];

  /** Clientes desta carga sem posição parametrizada na roteirização da cidade deles. */
  clientesNaoRoteirizados?: string[];

  observacaoMotorista?: string | null;

  /** true quando o motorista desta carga foi corrigido manualmente e o sync do WinThor não sobrescreve mais. */
  motoristaDefinidoManualmente?: boolean;

  /** Códigos de devolução (CODDEVOL) encontrados no último sync com o WinThor pra esta carga. */
  codigosDevolucaoEncontrados?: string[];

  /** true se o último sync encontrou transferência de pedido desta carga pra outro carregamento no WinThor. */
  teveTransferencia?: boolean;

  /** true se uma diminuição de peso/valor vinda do WinThor foi ignorada por falta de motivo reconhecido. */
  diminuicaoPesoValorBloqueada?: boolean;
}

export interface CargaRequest {
  dtSaida?: string | null;
  dtPrevista?: string | null;
  dtChegada?: string | null;

  pesoCarga?: number | null;
  valorTotal?: number | null;

  kmInicial?: number | null;
  kmFinal?: number | null;

  statusCarga?: string | null; // ex: EM_ROTA, FINALIZADA, CANCELADA (ajuste conforme seu enum)

  codigoMotorista: string;
  codigoCaminhao: string;
  codigoRota: string;

  codigosAjudantes?: string[] | null;
}

export interface TransferirMotoristaCargaRequest {
  codigoMotorista: string;
}

/** Tipo mínimo que qualquer carga com número de exibição precisa ter. */
export interface CargaComNumeroExibicao {
  numeroCarga: string;
  numeroCargaExterno?: string | null;
  numeroCargaExibicao: string;
}

/**
 * O número que NÃO foi escolhido como destaque (interno ou externo, o que
 * sobrar), pra mostrar como referência secundária na tela. Null se não
 * houver um segundo número diferente pra mostrar.
 */
export function numeroCargaSecundario(carga: CargaComNumeroExibicao): string | null {
  const outro = carga.numeroCargaExibicao === carga.numeroCarga
    ? carga.numeroCargaExterno
    : carga.numeroCarga;
  return outro && outro !== carga.numeroCargaExibicao ? outro : null;
}

/** Rótulo pro número secundário: diz de onde ele vem, já que qual deles é o "principal" varia. */
export function numeroCargaSecundarioLabel(carga: CargaComNumeroExibicao): string {
  return carga.numeroCargaExibicao === carga.numeroCarga ? 'Externo' : 'Sistema';
}
