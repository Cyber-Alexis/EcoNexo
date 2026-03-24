import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Endpoints that legitimately return 401 and should NOT trigger a forced logout
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/register-negocio'];

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint = AUTH_ENDPOINTS.some(path => req.url.includes(path));

  return next(req).pipe(
    catchError(err => {
      if (!isAuthEndpoint && err?.status === HttpStatusCode.Unauthorized) {
        authService.clearAuth();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
