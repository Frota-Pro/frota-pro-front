export interface ManutencaoResponse {
  id: string;
  codigo: string;
  descricao: string;

  dataInicioManutencao?: string | null;
  dataFimManutencao?: string | null;

  tipoManutencao: string;
  valor?: number | null;
  statusManutencao: string;

  codigoCaminhao: string;
  caminhao?: string | null;

  codigoOficina?: string | null;
  oficina?: string | null;
}
