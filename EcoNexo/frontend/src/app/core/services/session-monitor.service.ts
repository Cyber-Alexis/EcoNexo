import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Subscription, interval } from 'rxjs';
import { catchError, exhaustMap, startWith, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

const SESSION_CHECK_INTERVAL_MS = 5000;

@Injectable({ providedIn: 'root' })
export class SessionMonitorService {
  private subscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  start(): void {
    if (this.subscription) {
      return;
    }

    this.subscription = this.authService.user$
      .pipe(
        switchMap(user => {
          if (!user) return EMPTY;

          return interval(SESSION_CHECK_INTERVAL_MS).pipe(
            startWith(0),
            exhaustMap(() => {
              if (!this.authService.isLoggedIn()) {
                return EMPTY;
              }

              return this.authService.fetchMe().pipe(
                catchError((err) => {
                  if (this.shouldTerminateSession(err)) {
                    const message = err?.error?.message ?? 'Tu sesión ya no es válida.';
                    this.authService.setSessionNotice(message);
                    this.authService.clearAuth();
                    this.router.navigate(['/login']);
                  }

                  return EMPTY;
                }),
              );
            }),
          );
        }),
      )
      .subscribe();
  }

  private shouldTerminateSession(err: any): boolean {
    const message = String(err?.error?.message ?? '').toLowerCase();

    return err?.status === 401
      || (err?.status === 403 && message.includes('bloqueado'))
      || (err?.status === 503 && message.includes('modo mantenimiento'));
  }
}