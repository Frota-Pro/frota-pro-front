export interface MetaResponse {
  id: string;
  dataIncio: string;
  dataFim: string;
  tipoMeta: string;

  valorMeta: number;
  valorRealizado: number;

  unidade: string;
  statusMeta: string;
  descricao: string;

  caminhaoCodigo?: string | null;
  caminhaoDescricao?: string | null;

  categoriaCodigo?: string | null;
  categoriaDescricao?: string | null;

  motoristaCodigo?: string | null;
  motoristaDescricao?: string | null;

  renovarAutomaticamente?: boolean;
}

export interface MetaRequest {
  dataIncio: string;
  dataFim: string;
  tipoMeta: string;
  valorMeta: number;
  valorRealizado?: number;
  unidade?: string | null;
  statusMeta?: string | null;
  descricao?: string | null;

  caminhao?: string | null;
  categoria?: string | null;
  motorista?: string | null;

  renovarAutomaticamente?: boolean | null;
}
