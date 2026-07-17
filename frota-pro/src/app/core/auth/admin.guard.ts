import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthMeResponse } from './auth-user.model';
import { AuthUserService } from './auth-user.service';

function isAdmin(u: AuthMeResponse): boolean {
  return !!u.authorities?.includes('ROLE_ADMIN');
}

export const adminGuard: CanActivateFn = () => {
  const authUser = inject(AuthUserService);
  const router = inject(Router);

  const redirectNaoAdmin = () => {
    router.navigate(['/dashboard/dashboard-home']);
    return false;
  };

  if (authUser.snapshot) {
    return isAdmin(authUser.snapshot) || redirectNaoAdmin();
  }

  return authUser.loadMe().pipe(
    map((u) => isAdmin(u) || redirectNaoAdmin()),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
