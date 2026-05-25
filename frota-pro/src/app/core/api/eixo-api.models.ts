export interface EixoCaminhaoResponse {
  id?: string | number | null;
  numero?: number | null;
  numeroEixo?: number | null;
  eixoNumero?: number | null;
  descricao?: string | null;
}

export interface EixoRequest {
  numero: number;
  codigoCaminhao: string;
}
