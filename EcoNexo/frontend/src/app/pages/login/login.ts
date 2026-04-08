import { ChangeDetectorRef, Component, NgZone, inject } from '@angular/core';
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
export class Login {
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.message = '';

    const { email, password } = this.form.value;

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
