import { Observable } from 'rxjs';

/**
 * Interface for components that need to control navigation away from them.
 * Used with CanDeactivateFn guards to prevent navigation when there are unsaved changes.
 */
export interface CanComponentDeactivate {
  /**
   * Determines if the component can be deactivated.
   * @returns true if navigation is allowed, false to block it
   */
  canDeactivate(): boolean | Observable<boolean>;
}
