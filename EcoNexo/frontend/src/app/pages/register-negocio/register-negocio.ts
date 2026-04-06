import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-register-negocio',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-negocio.html',
  styleUrl: './register-negocio.css',
})
export class RegisterNegocio {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  isLoading = false;
  message = '';

  form = this.fb.group({
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    nombreNegocio: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  get nombre() { return this.form.get('nombre')!; }
  get apellidos() { return this.form.get('apellidos')!; }
  get nombreNegocio() { return this.form.get('nombreNegocio')!; }
  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }
  get mismatch() { return this.form.hasError('passwordsMismatch') && this.confirmPassword.touched; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.message = '';

    const { nombre, apellidos, nombreNegocio, email, password } = this.form.value;

    this.authService.registerNegocio(nombre!, apellidos!, email!, password!, nombreNegocio!).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.message = err.error?.message ?? 'Error al registrar el negocio. Inténtalo de nuevo.';
      },
    });
  }
}
