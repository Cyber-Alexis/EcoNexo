import { CanDeactivateFn } from '@angular/router';
import { CanComponentDeactivate } from '../interfaces/can-component-deactivate.interface';

/**
 * Guard to prevent navigation away from Mi Negocio component when in edit mode.
 * Delegates the decision entirely to the component, which shows a custom modal.
 */
export const canDeactivateMiNegocioGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (!component || typeof component.canDeactivate !== 'function') {
    return true;
  }
  return component.canDeactivate();
};
