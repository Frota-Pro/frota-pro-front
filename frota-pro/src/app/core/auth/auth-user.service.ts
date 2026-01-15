import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthMeResponse } from './auth-user.model';

@Injectable({ providedIn: 'root' })
export class AuthUserService {
  private readonly _user$ = new BehaviorSubject<AuthMeResponse | null>(null);

  constructor(private http: HttpClient) {}

  get user$(): Observable<AuthMeResponse | null> {
    return this._user$.asObservable();
  }

  get snapshot(): AuthMeResponse | null {
    return this._user$.value;
  }

  loadMe() {
    return this.http.get<AuthMeResponse>(`${environment.apiUrl}/auth/me`).pipe(
      tap((u) => this._user$.next(u))
    );
  }

  clear() {
    this._user$.next(null);
  }

  // opcional: label amigável do acesso
  getRoleLabel(u: AuthMeResponse | null): string {
    if (!u?.authorities?.length) return 'SEM PERFIL';

    // prioriza alguns roles
    if (u.authorities.includes('ROLE_ADMIN')) return 'ADMIN';
    if (u.authorities.includes('ROLE_GESTOR')) return 'GESTOR';
    if (u.authorities.includes('ROLE_OPERADOR')) return 'OPERADOR';
    if (u.authorities.includes('ROLE_CONSULTA')) return 'CONSULTA';

    // fallback: primeiro role
    return u.authorities[0].replace('ROLE_', '');
  }
}
