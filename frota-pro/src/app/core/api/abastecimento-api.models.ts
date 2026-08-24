export interface AbastecimentoResponse {
  id: string;
  codigo: string;

  caminhaoCodigo: string;
  caminhaoPlaca: string;

  motoristaCodigo?: string | null;

  dtAbastecimento: string;
  kmOdometro?: number | null;

  qtLitros?: number | null;
  valorLitro?: number | null;
  valorTotal?: number | null;
  mediaKmLitro?: number | null;

  tipoCombustivel?: string | null;
  formaPagamento?: string | null;

  posto?: string | null;
  postoAbastecimentoCodigo?: string | null;
  postoAbastecimentoNome?: string | null;
  cidade?: string | null;
  uf?: string | null;

  numNotaOuCupom?: string | null;
}

/** Totais agregados no back — ver AbastecimentoApiService.resumoFiltrado. */
export interface AbastecimentoResumoFiltroResponse {
  totalLitros: number;
  totalValor: number;
  precoMedioLitro: number;
  consumoMedioPonderado: number;
  totalRegistros: number;
}

export interface AbastecimentoRequest {
  caminhao: string;              // codigo ou codigoExterno ou placa
  motorista?: string | null;     // codigo ou codigoExterno (opcional)
  dtAbastecimento: string;       // ISO (yyyy-MM-dd'T'HH:mm:ss)
  kmOdometro?: number | null;
  qtLitros?: number | null;
  valorLitro?: number | null;
  valorTotal?: number | null;    // se não enviar, o back calcula
  mediaKmLitro?: number | null;
  tipoCombustivel: string;
  formaPagamento: string;
  posto?: string | null;               // texto livre — alternativa a postoAbastecimento (informe um ou outro)
  postoAbastecimento?: string | null;  // código do posto cadastrado — alternativa a posto
  cidade?: string | null;
  uf?: string | null;
  numNotaOuCupom?: string | null;
}
