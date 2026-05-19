import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const user = authService.getUser();
  if (user?.role === 'admin') {
    return true;
  }

  // Redirect based on user role to avoid double redirections
  if (user?.role === 'business') {
    return router.createUrlTree(['/mi-negocio']);
  }

  return router.createUrlTree(['/home']);
};
