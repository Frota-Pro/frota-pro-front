import { StatusDesempenhoMetaMotorista } from './meta-api.models';

export type StatusMotorista = 'DISPONIVEL' | 'EM_ROTA' | 'INATIVO' | 'FERIAS' | 'AFASTADO' | string;

export interface MotoristaResponse {
  id: string; // UUID
  codigo: string;
  codigoExterno?: string | null;

  nome: string;
  email: string;

  dataNascimento?: string | null; // dd/MM/yyyy
  cnh: string;
  validadeCnh?: string | null; // dd/MM/yyyy

  status?: StatusMotorista | null;
  ativo: boolean;
}

export interface MotoristaRequest {
  codigoExterno?: string | null;

  nome: string;
  email: string;

  dataNascimento: string | null; // dd/MM/yyyy
  cnh: string;
  validadeCnh: string | null; // dd/MM/yyyy
}

export type TipoPlataformaDispositivo = 'ANDROID' | 'IOS' | 'OUTRO' | string;

export interface MotoristaDispositivoAppResponse {
  codigoMotorista: string;
  nomeMotorista: string;

  dispositivoAppVersao?: string | null;
  dispositivoAppPlataforma?: TipoPlataformaDispositivo | null;
  dispositivoAppReportadoEm?: string | null; // yyyy-MM-ddTHH:mm:ss

  versaoMaisRecenteDisponivel?: string | null;
  desatualizado: boolean;
}

/**
 * PROPRIA (padrão) = motorista é titular do caminhão e foi ele quem dirigiu — conta tudo.
 * CAMINHAO_DE_OUTRO_TITULAR = ele dirigiu, mas o caminhão tem outro titular — conta só tonelada.
 * CAMINHAO_SEM_TITULAR = ele dirigiu um caminhão sem titular cadastrado — conta só tonelada.
 * MOTORISTA_TERCEIRO_NO_MEU_CAMINHAO = outro motorista dirigiu o caminhão dele — conta só km/km-por-litro.
 */
export type TipoLinhaRelatorioMotorista =
  | 'PROPRIA'
  | 'CAMINHAO_DE_OUTRO_TITULAR'
  | 'CAMINHAO_SEM_TITULAR'
  | 'MOTORISTA_TERCEIRO_NO_MEU_CAMINHAO';

export interface RelatorioMetaMensalMotoristaLinha {
  data?: string | null;
  lote?: string | null;
  cidade?: string | null;
  valorCarga?: number | null;
  tonelagem?: number | null;

  kmInicial?: number | null;
  kmFinal?: number | null;
  kmRodado?: number | null;

  litros?: number | null;
  valorAbastecimento?: number | null;

  mediaKmLitro?: number | null;

  tipoLinha?: TipoLinhaRelatorioMotorista | null;
  /** Só preenchido quando tipoLinha = MOTORISTA_TERCEIRO_NO_MEU_CAMINHAO. */
  motoristaQueDirigiu?: string | null;
}

export interface RelatorioMetaMensalMotoristaResponse {
  nomeMotorista?: string | null;
  codigoMotorista?: string | null;
  placaCaminhao?: string | null;
  codigoCaminhao?: string | null;

  periodoInicio?: string | null; // yyyy-MM-dd
  periodoFim?: string | null; // yyyy-MM-dd

  objetivoMesTonelada?: number | null;
  metaConsumoKmPorLitro?: number | null;

  linhas?: RelatorioMetaMensalMotoristaLinha[] | null;

  totalTonelada?: number | null;
  totalKmRodado?: number | null;
  totalLitros?: number | null;
  totalValorAbastecimento?: number | null;
  mediaGeralKmPorLitro?: number | null;

  realizadoToneladaPercentual?: number | null;
  status?: StatusDesempenhoMetaMotorista | null;
}
