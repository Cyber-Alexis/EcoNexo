import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return true;
  }

  const role = auth.getUser()?.role;
  if (role === 'business') {
    return router.createUrlTree(['/mi-negocio']);
  }
  if (role === 'admin') {
    return router.createUrlTree(['/admin']);
  }
  return router.createUrlTree(['/home']);
};
