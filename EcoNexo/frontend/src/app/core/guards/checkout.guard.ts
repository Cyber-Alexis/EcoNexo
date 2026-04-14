import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

const CART_STORAGE_KEY = 'econexo_cart_items';

export const checkoutGuard: CanActivateFn = () => {
  const router = inject(Router);

  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) {
      return router.createUrlTree(['/home']);
    }

    const parsedCart = JSON.parse(rawCart) as Array<{ quantity?: number | string | null }>;
    const hasItems = parsedCart.some((item) => Number(item?.quantity ?? 0) > 0);

    return hasItems ? true : router.createUrlTree(['/home']);
  } catch {
    return router.createUrlTree(['/home']);
  }
};