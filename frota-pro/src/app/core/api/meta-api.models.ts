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
}
