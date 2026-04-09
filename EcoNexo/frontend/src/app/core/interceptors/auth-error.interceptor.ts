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
  const isOrderCreation = req.method === 'POST' && req.url.includes('/orders');

  return next(req).pipe(
    catchError(err => {
      const message = String(err?.error?.message ?? '').toLowerCase();
      const isBlockedResponse = err?.status === HttpStatusCode.Forbidden && message.includes('bloqueado');
      const isMaintenanceResponse = err?.status === HttpStatusCode.ServiceUnavailable && message.includes('modo mantenimiento');
      const shouldLogout = !isAuthEndpoint
        && !isOrderCreation
        && authService.isLoggedIn()
        && (err?.status === HttpStatusCode.Unauthorized || isBlockedResponse || isMaintenanceResponse);

      if (shouldLogout) {
        if (err?.error?.message) {
          authService.setSessionNotice(err.error.message);
        }
        authService.clearAuth();
        router.navigate(['/login']);
      }

      return throwError(() => err);
    }),
  );
};
