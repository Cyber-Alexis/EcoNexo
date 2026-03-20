import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/auth/login`, { email, password })
      .pipe(tap(res => this.storeAuth(res)));
  }

  registerCliente(name: string, last_name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/auth/register`, { name, last_name, email, password })
      .pipe(tap(res => this.storeAuth(res)));
  }

  registerNegocio(name: string, last_name: string, email: string, password: string, business_name: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/auth/register-negocio`, { name, last_name, email, password, business_name })
      .pipe(tap(res => this.storeAuth(res)));
  }

  logout(): Observable<unknown> {
    return this.http
      .post(`${this.base}/auth/logout`, {})
      .pipe(tap(() => this.clearAuth()));
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private storeAuth(res: AuthResponse): void {
    localStorage.setItem('access_token', res.access_token);
    localStorage.setItem('auth_user', JSON.stringify(res.user));
  }

  private clearAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
  }
}
