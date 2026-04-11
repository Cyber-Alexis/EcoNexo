import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const businessGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getUser();

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  if (user?.role === 'business') {
    return true;
  }

  if (user?.role === 'admin') {
    return router.createUrlTree(['/admin']);
  }

  return router.createUrlTree(['/home']);
};
