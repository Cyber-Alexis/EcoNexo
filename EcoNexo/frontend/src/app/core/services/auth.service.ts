import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartService } from './cart.service';

const REQUEST_TIMEOUT_MS = 10_000; // 10 s

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
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
  private readonly _user$ = new BehaviorSubject<AuthUser | null>(this.restoreUser());
  private readonly cartService = inject(CartService);

  readonly user$ = this._user$.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    this.clearAuth(false);

    return this.http
      .post<AuthResponse>(`${this.base}/auth/login`, { email: normalizedEmail, password })
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        tap((res) => this.storeAuth(res)),
      );
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
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        tap({
          next: () => this.clearAuth(),
          error: () => this.clearAuth(),
        }),
      );
  }

  fetchMe(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(`${this.base}/auth/me`)
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        tap(user => this.storeUser(user)),
      );
  }

  uploadAvatar(file: File): Observable<{ avatar_url: string; user: AuthUser }> {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.http
      .post<{ avatar_url: string; user: AuthUser }>(`${this.base}/perfil/avatar`, fd)
      .pipe(tap(res => this.patchUser(res.user)));
  }

  updateProfile(data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  }): Observable<{ user: AuthUser }> {
    return this.http
      .put<{ user: AuthUser }>(`${this.base}/perfil`, data)
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        tap(res => this.patchUser(res.user)),
      );
  }

  changePassword(current_password: string, new_password: string): Observable<{ message: string }> {
    return this.http
      .put<{ message: string }>(`${this.base}/perfil/password`, {
        current_password,
        new_password,
        new_password_confirmation: new_password,
      })
      .pipe(timeout(REQUEST_TIMEOUT_MS));
  }

  deleteAccount(): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.base}/perfil`)
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        tap(() => this.clearAuth()),
      );
  }

  patchUser(partial: Partial<AuthUser>): void {
    const current = this._user$.value;
    if (!current) return;
    const updated = { ...current, ...partial };
    localStorage.setItem('auth_user', JSON.stringify(updated));
    this._user$.next(updated);
  }

  clearAuth(clearCart = true): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    if (clearCart) {
      this.cartService.clear();
    }
    this._user$.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getUser(): AuthUser | null {
    return this._user$.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private restoreUser(): AuthUser | null {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  }

  private storeAuth(res: AuthResponse): void {
    localStorage.setItem('access_token', res.access_token);
    this.storeUser(res.user);
    this.cartService.hydrateCart();
  }

  private storeUser(user: AuthUser): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
    this._user$.next(user);
  }
}
