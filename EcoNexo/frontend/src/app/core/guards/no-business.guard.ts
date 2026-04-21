import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Blocks users with the 'business' role from accessing consumer-only routes. */
export const noBusinessGuard: CanActivateFn = () => {
  const user = inject(AuthService).getUser();

  if (user?.role === 'business') {
    return inject(Router).createUrlTree(['/mi-negocio']);
  }

  return true;
};
