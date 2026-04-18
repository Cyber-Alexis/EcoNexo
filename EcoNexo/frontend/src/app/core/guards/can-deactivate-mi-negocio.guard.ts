import { CanDeactivateFn } from '@angular/router';
import { CanComponentDeactivate } from '../interfaces/can-component-deactivate.interface';

/**
 * Guard to prevent navigation away from Mi Negocio component when there are unsaved changes.
 * 
 * Prevents navigation if:
 * - Component is in edit mode
 * - There are unsaved form changes
 * - There are images being uploaded
 * - Any pending changes exist
 * 
 * Shows a native browser confirmation dialog to the user.
 */
export const canDeactivateMiNegocioGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  // If component doesn't implement canDeactivate, allow navigation
  if (!component || typeof component.canDeactivate !== 'function') {
    return true;
  }

  // Let the component decide if navigation is allowed
  const canLeave = component.canDeactivate();
  
  // If navigation is blocked, show confirmation dialog
  if (!canLeave) {
    return confirm(
      '¿Estás seguro de que quieres salir?\n\n' +
      'Tienes cambios sin guardar que se perderán si abandonas esta página.\n\n' +
      'Haz clic en "Aceptar" para salir sin guardar, o en "Cancelar" para quedarte y guardar tus cambios.'
    );
  }

  return true;
};
