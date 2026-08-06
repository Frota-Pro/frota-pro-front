export type GravidadeMulta = 'LEVE' | 'MEDIA' | 'GRAVE' | 'GRAVISSIMA';
export type StatusPagamentoMulta = 'PENDENTE' | 'PAGO' | 'RECURSO_PROTOCOLADO' | 'CANCELADA';
export type ResponsavelPagamentoMulta = 'EMPRESA' | 'MOTORISTA';
export type TipoAnexoMulta = 'NOTIFICACAO' | 'COMPROVANTE_PAGAMENTO' | 'RECURSO';

export interface MultaResponse {
  id: string;

  codigoCaminhao: string;
  caminhao?: string | null;

  codigoMotorista?: string | null;
  motorista?: string | null;

  dataInfracao: string;
  orgaoAutuador?: string | null;
  numeroAit?: string | null;
  descricaoInfracao?: string | null;
  gravidade?: GravidadeMulta | null;
  pontos?: number | null;
  valor: number;

  dataVencimentoPagamento?: string | null;
  dataLimiteRecurso?: string | null;

  statusPagamento: StatusPagamentoMulta;
  responsavelPagamento: ResponsavelPagamentoMulta;

  observacao?: string | null;
}

export interface MultaRequest {
  caminhao: string;
  motorista?: string | null;
  dataInfracao: string;
  orgaoAutuador?: string | null;
  numeroAit?: string | null;
  descricaoInfracao?: string | null;
  gravidade?: GravidadeMulta | null;
  pontos?: number | null;
  valor: number;
  dataVencimentoPagamento?: string | null;
  dataLimiteRecurso?: string | null;
  responsavelPagamento: ResponsavelPagamentoMulta;
  observacao?: string | null;
}

export interface ArquivoResponse {
  id: string;
  nomeOriginal: string;
  urlPreview: string;
  urlDownload: string;
  contentType?: string | null;
  tamanhoBytes?: number | null;
}

export interface MultaAnexoResponse {
  id: string;
  tipoAnexo: string;
  arquivo: ArquivoResponse;
}
