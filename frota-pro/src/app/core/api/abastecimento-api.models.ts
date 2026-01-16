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
