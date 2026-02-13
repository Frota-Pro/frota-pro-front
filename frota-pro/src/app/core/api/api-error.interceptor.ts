import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/ui/toast/toast.service';

type ValidationErrorPayload = {
  timestamp?: string;
  status?: number;
  error?: string;
  path?: string;
  message?: string;
  errors?: Array<{ field?: string; message?: string }>;
};

function firstUsefulMessage(body: any): string | null {
  if (!body) return null;

  // string body
  if (typeof body === 'string' && body.trim()) return body.trim();

  // CustomException { message }
  if (typeof body === 'object' && typeof body.message === 'string' && body.message.trim()) {
    return body.message.trim();
  }

  // ValidationError { errors: [{field,message}] }
  const v = body as ValidationErrorPayload;
  if (v && Array.isArray(v.errors) && v.errors.length) {
    const msgs = v.errors
      .map(e => {
        const f = e?.field?.trim();
        const m = e?.message?.trim();
        if (!m) return null;
        return f ? `${f}: ${m}` : m;
      })
      .filter(Boolean) as string[];

    if (msgs.length === 1) return msgs[0];
    if (msgs.length > 1) return msgs.slice(0, 3).join(' • ');
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

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 é tratado no authErrorInterceptor (logout + redirect)
      if (error.status !== 401) {
        const msg = firstUsefulMessage(error.error) ?? fallbackByStatus(error.status);
        toast.error(msg);
      }
      return throwError(() => error);
    })
  );
};
