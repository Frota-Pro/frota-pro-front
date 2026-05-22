export type RegraAtingimentoMeta = 'MENOR_OU_IGUAL' | 'MAIOR_OU_IGUAL' | string;

export interface TipoMetaResponse {
  codigo?: string | null;
  tipoMeta?: string | null;
  label?: string | null;
  descricao?: string | null;
  unidade?: string | null;
  regraAtingimento?: RegraAtingimentoMeta | null;
  regraAtingimentoTexto?: string | null;
}

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
  regraAtingimento?: RegraAtingimentoMeta | null;
  percentual?: number | null;
  metaAtingida?: boolean | null;

  caminhaoCodigo?: string | null;
  caminhaoDescricao?: string | null;

  categoriaCodigo?: string | null;
  categoriaDescricao?: string | null;

  motoristaCodigo?: string | null;
  motoristaDescricao?: string | null;

  renovarAutomaticamente?: boolean;
  recalcularProgresso?: boolean;
}

export interface DesempenhoCategoriaMetaLinha {
  metaId: string;
  tipoMeta: string;
  regraAtingimento: RegraAtingimentoMeta;
  valorMeta: number;
  unidade: string;
  caminhaoCodigo: string;
  caminhaoDescricao: string;
  valorRealizado: number;
  percentual: number;
  metaAtingida: boolean;
}

export interface DesempenhoCategoriaMetaResponse {
  categoriaCodigo: string;
  categoriaDescricao: string;
  dataReferencia: string;
  inicio?: string | null;
  fim?: string | null;
  linhas: DesempenhoCategoriaMetaLinha[];
}

export type DesempenhoMetasAlvoTipo = 'CAMINHAO' | 'MOTORISTA' | string;
export type DesempenhoMetasOrigemMeta = 'CAMINHAO' | 'MOTORISTA' | 'CATEGORIA' | string;

export interface DesempenhoMetasLinha {
  alvoTipo: DesempenhoMetasAlvoTipo;
  origemMeta: DesempenhoMetasOrigemMeta;
  origemMetaDescricao?: string | null;
  caminhaoCodigo?: string | null;
  caminhaoDescricao?: string | null;
  motoristaCodigo?: string | null;
  motoristaDescricao?: string | null;
  categoriaCodigo?: string | null;
  categoriaDescricao?: string | null;
  tipoMeta: string;
  regraAtingimentoTexto?: string | null;
  valorMeta: number;
  valorRealizado: number;
  percentual: number;
  metaAtingida: boolean;
  status: string;
  periodoCalculoInicio?: string | null;
  periodoCalculoFim?: string | null;
}

export interface DesempenhoMetasResponse {
  inicio?: string | null;
  fim?: string | null;
  linhas: DesempenhoMetasLinha[];
}

export interface DesempenhoMetasParams {
  inicio: string;
  fim: string;
  tipoMeta?: string | null;
  caminhao?: string | null;
  motorista?: string | null;
  categoria?: string | null;
}

export interface MetaRequest {
  dataIncio: string;
  dataFim: string;
  tipoMeta: string;
  valorMeta: number;
  valorRealizado?: number | null;
  unidade?: string | null;
  statusMeta?: string | null;
  descricao?: string | null;

  caminhao?: string | null;
  categoria?: string | null;
  motorista?: string | null;

  renovarAutomaticamente?: boolean | null;
  recalcularProgresso?: boolean | null;
}
