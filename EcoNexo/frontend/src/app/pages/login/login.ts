import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  isLoading = false;
  message = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  ngOnInit(): void {
    const sessionNotice = this.authService.consumeSessionNotice();

    if (sessionNotice) {
      this.message = sessionNotice;
      this.cdr.detectChanges();
    }
  }

  onSubmit(): void {
    if (this.isLoading) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.message = '';

    const { email, password } = this.form.getRawValue();

    this.authService.login(email!, password!)
      .pipe(finalize(() => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }))
      .subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          if (response.user?.role === 'admin') {
            this.router.navigate(['/admin']);
            this.cdr.detectChanges();
            return;
          }

          if (response.user?.role === 'business') {
            this.router.navigate(['/mi-negocio']);
            this.cdr.detectChanges();
            return;
          }

          this.router.navigate(['/home']);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.message = err.error?.message ?? 'Error al iniciar sesión. Verifica tus datos.';
          this.cdr.detectChanges();
        });
      },
    });
  }
}
