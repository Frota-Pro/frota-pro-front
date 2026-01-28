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
  cidade?: string | null;
  uf?: string | null;

  numNotaOuCupom?: string | null;
}

export interface AbastecimentoRequest {
  caminhao: string;              // codigo ou codigoExterno ou placa
  motorista?: string | null;     // codigo ou codigoExterno (opcional)
  dtAbastecimento: string;       // ISO (yyyy-MM-dd'T'HH:mm:ss)
  kmOdometro?: number | null;
  qtLitros?: number | null;
  valorLitro?: number | null;
  valorTotal?: number | null;    // se não enviar, o back calcula
  tipoCombustivel: string;
  formaPagamento: string;
  posto?: string | null;
  cidade?: string | null;
  uf?: string | null;
  numNotaOuCupom?: string | null;
}
