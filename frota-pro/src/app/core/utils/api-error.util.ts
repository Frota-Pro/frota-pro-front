import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrai uma mensagem amigável de um erro de requisição HTTP. Ordem de prioridade:
 * 1) mensagem de validação/negócio que o backend já manda pronta (`errors[].message`, `error`, `message`);
 * 2) mensagem amigável baseada no status HTTP (0 = sem conexão, 401/403/404/409/5xx etc.)
 *    quando o backend não deu detalhe nenhum;
 * 3) mensagem genérica como último recurso — nunca mostra texto técnico cru
 *    (ex: "Http failure response for ...") pro usuário.
 */
export function extrairMensagemErro(err: unknown, fallback?: string): string {
  const e = err as HttpErrorResponse;
  const body: any = e?.error;

  if (body && typeof body === 'object') {
    if (Array.isArray(body.errors) && body.errors.length) {
      const msgs = body.errors
        .map((x: any) => (typeof x === 'string' ? x : x?.message))
        .filter((m: unknown): m is string => typeof m === 'string' && m.trim().length > 0);
      if (msgs.length) return msgs.join(' • ');
    }

    if (typeof body.error === 'string' && body.error.trim()) return body.error;
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
  }

  return mensagemAmigavelPorStatus(e?.status) ?? fallback ?? 'Ocorreu um erro ao processar a solicitação.';
}

function mensagemAmigavelPorStatus(status: number | undefined): string | null {
  switch (status) {
    case 0:
      return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
    case 401:
      return 'Sua sessão expirou. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para fazer isso.';
    case 404:
      return 'Não encontramos o que você procurou.';
    case 409:
      return 'Essa informação já foi alterada. Atualize a página e tente novamente.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'O servidor teve um problema. Tente novamente em alguns instantes.';
    default:
      return null;
  }
}
