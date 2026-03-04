import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AuthService } from './auth.service';

const HAS_RETRIED = new HttpContextToken<boolean>(() => false);

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  const isAuthRequest = auth.isAuthRequest(req.url);
  const hasRetried = req.context.get(HAS_RETRIED);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthRequest) {
        return throwError(() => error);
      }

      if (hasRetried) {
        auth.forceLogout();
        toast.warn('Sua sessão expirou. Faça login novamente.');
        router.navigate(['/login']);
        return throwError(() => error);
      }

      return auth.refreshSession().pipe(
        switchMap((session) => {
          const retryReq = req.clone({
            context: req.context.set(HAS_RETRIED, true),
            setHeaders: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });

          return next(retryReq);
        }),
        catchError((refreshError: HttpErrorResponse) => {
          if (refreshError.status === 401 || refreshError.status === 403) {
            auth.forceLogout();
            toast.warn('Sua sessão expirou. Faça login novamente.');
            router.navigate(['/login']);
          }

          return throwError(() => error);
        })
      );
    })
  );
};
