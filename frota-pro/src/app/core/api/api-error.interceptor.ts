import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, mergeMap, throwError } from 'rxjs';
import { ToastService } from '../../shared/ui/toast/toast.service';

type ValidationErrorPayload = {
  timestamp?: string;
  status?: number;
  error?: string;
  path?: string;
  message?: string;
  details?: string;
  detalhe?: string;
  detalheErro?: string;
  detail?: string;
  title?: string;
  errors?: Array<{ field?: string; message?: string }>;
  fieldErrors?: Array<{ field?: string; message?: string }>;
  violations?: Array<{ field?: string; message?: string }>;
};

function firstUsefulMessage(body: unknown): string | null {
  if (!body) return null;

  // string body
  if (typeof body === 'string' && body.trim()) return body.trim();

  if (typeof body !== 'object') return null;

  const payload = body as ValidationErrorPayload;

  // mensagens diretas comuns em payloads de erro
  const direct =
    payload.message?.trim() ||
    payload.error?.trim() ||
    payload.detail?.trim() ||
    payload.details?.trim() ||
    payload.detalhe?.trim() ||
    payload.detalheErro?.trim() ||
    payload.title?.trim();

  if (direct) {
    return direct;
  }

  // ValidationError { errors / fieldErrors / violations: [{field,message}] }
  const nestedErrors =
    (Array.isArray(payload.errors) ? payload.errors : []).concat(
      Array.isArray(payload.fieldErrors) ? payload.fieldErrors : [],
      Array.isArray(payload.violations) ? payload.violations : []
    );

  if (nestedErrors.length) {
    const msgs = nestedErrors
      .map(e => {
        const f = e?.field?.trim();
        const m = e?.message?.trim();
        if (!m) return null;
        return f ? `${f}: ${m}` : m;
      })
      .filter(Boolean) as string[];

    if (msgs.length === 1) return msgs[0];
    if (msgs.length > 1) return msgs.slice(0, 4).join('\n• ');
  }

  return null;
}

function fallbackByStatus(status: number): string {
  if (status === 0) return 'Sem conexão com a API (verifique o servidor e sua internet).';
  if (status === 400) return 'Requisição inválida. Verifique os campos informados.';
  if (status === 401) return 'Sessão expirada. Faça login novamente.';
  if (status === 403) return 'Acesso negado.';
  if (status === 404) return 'Recurso não encontrado.';
  if (status === 409) return 'Conflito ao salvar. Verifique dados duplicados.';
  if (status >= 500) return 'Erro interno no servidor.';
  return 'Erro inesperado.';
}

async function parseBlobJson(blob: Blob): Promise<unknown> {
  try {
    const text = (await blob.text())?.trim();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}

async function resolveErrorMessage(error: HttpErrorResponse): Promise<string> {
  const direct = firstUsefulMessage(error.error);
  if (direct) return direct;

  if (error.error instanceof Blob) {
    const parsed = await parseBlobJson(error.error);
    const fromBlob = firstUsefulMessage(parsed);
    if (fromBlob) return fromBlob;
  }

  return fallbackByStatus(error.status);
}

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 é tratado no authErrorInterceptor (logout + redirect)
      if (error.status !== 401) {
        return from(resolveErrorMessage(error)).pipe(
          mergeMap((msg) => {
            toast.error(msg, 'Não foi possível concluir');
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
