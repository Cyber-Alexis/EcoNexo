import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Endpoints that legitimately return 401 and should NOT trigger a forced logout
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/register-negocio'];
const CART_STORAGE_KEY = 'econexo_cart_items';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const isAuthEndpoint = AUTH_ENDPOINTS.some(path => req.url.includes(path));
  const isOrderCreation = req.method === 'POST' && req.url.includes('/orders');

  return next(req).pipe(
    catchError(err => {
      if (!isAuthEndpoint && !isOrderCreation && err?.status === HttpStatusCode.Unauthorized) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem(CART_STORAGE_KEY);
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
