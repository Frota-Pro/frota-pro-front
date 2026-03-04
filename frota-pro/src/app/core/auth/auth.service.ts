import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable, finalize, of, shareReplay, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RefreshTokenRequest } from './auth.models';

const ACCESS_TOKEN_KEY = 'FP_ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'FP_REFRESH_TOKEN';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = environment.apiUrl;
  private refreshInFlight$: Observable<LoginResponse> | null = null;

  constructor(private http: HttpClient) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap((res) => this.setSession(res))
    );
  }

  refreshSession(): Observable<LoginResponse> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Refresh token ausente'));
    }

    const payload: RefreshTokenRequest = { refreshToken };

    this.refreshInFlight$ = this.http
      .post<LoginResponse>(`${this.baseUrl}/login/refresh`, payload)
      .pipe(
        tap((res) => this.setSession(res)),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay(1)
      );

    return this.refreshInFlight$;
  }

  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearSession();
      return of(void 0);
    }

    const payload: RefreshTokenRequest = { refreshToken };

    return this.http
      .post<void>(`${this.baseUrl}/login/logout`, payload)
      .pipe(finalize(() => this.clearSession()));
  }

  forceLogout(): void {
    this.clearSession();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  isAuthRequest(url: string): boolean {
    return (
      url.endsWith('/login') ||
      url.endsWith('/login/refresh') ||
      url.endsWith('/login/logout')
    );
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  private setSession(tokens: LoginResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
