import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

const PUBLIC_AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/register-negocio'];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  const isPublicAuthRequest = PUBLIC_AUTH_ENDPOINTS.some((path) => req.url.includes(path));

  if (token && !isPublicAuthRequest) {
    req = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  return next(req);
};
