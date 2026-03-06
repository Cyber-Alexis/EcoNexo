import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

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

    setTimeout(() => {
      const { email } = this.form.value;
      const userData = {
        email,
        name: email!.split('@')[0],
        token: 'fake-jwt-token',
      };

      localStorage.setItem('user', JSON.stringify(userData));
      this.message = '✓ Iniciando sesión...';
      this.isLoading = false;

      setTimeout(() => this.router.navigate(['/home']), 500);
    }, 800);
  }
}
