import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from './auth.models';

const TOKEN_KEY = 'FP_TOKEN';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap((res) => this.setToken(res.accessToken))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }
}
