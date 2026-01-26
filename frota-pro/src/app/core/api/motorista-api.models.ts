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
}
