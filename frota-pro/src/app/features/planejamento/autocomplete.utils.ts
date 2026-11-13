/** Uma opção do campo de busca: o texto que aparece, um detalhe menor e o código que sai quando escolhida. */
export interface OpcaoAuto {
  codigo: string;
  rotulo: string;
  detalhe?: string | null;
}

/** Minúsculo, sem acento e sem espaço sobrando: para comparar o que a pessoa digitou. */
export function normalizarBusca(texto: string | null | undefined): string {
  return (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Filtra pelo que foi digitado (em qualquer parte do nome ou do detalhe, sem se importar com acento e maiúscula).
 * Quem começa com o texto vem primeiro; sem texto, devolve as primeiras opções.
 */
export function filtrarOpcoes(opcoes: OpcaoAuto[], busca: string, limite = 8): OpcaoAuto[] {
  const q = normalizarBusca(busca);
  if (!q) return opcoes.slice(0, limite);

  const comecam: OpcaoAuto[] = [];
  const contem: OpcaoAuto[] = [];
  for (const o of opcoes) {
    const rotulo = normalizarBusca(o.rotulo);
    const detalhe = normalizarBusca(o.detalhe);
    if (rotulo.startsWith(q) || detalhe.startsWith(q)) comecam.push(o);
    else if (rotulo.includes(q) || detalhe.includes(q)) contem.push(o);
  }
  return [...comecam, ...contem].slice(0, limite);
}

/** Dá para oferecer "cadastrar" quando o texto tem tamanho de nome e não existe igual na lista. */
export function podeCadastrar(opcoes: OpcaoAuto[], texto: string): boolean {
  const q = normalizarBusca(texto);
  return q.length >= 3 && !opcoes.some((o) => normalizarBusca(o.rotulo) === q);
}
