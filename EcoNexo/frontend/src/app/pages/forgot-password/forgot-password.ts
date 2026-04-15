import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly base = environment.apiUrl;

  readonly step         = signal(1);
  readonly isLoading    = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  email = '';
  code = '';
  password = '';
  confirmPassword = '';

  async sendCode(): Promise<void> {
    this.errorMessage.set('');
    this.isLoading.set(true);

    try {
      await firstValueFrom(
        this.http.post<{ message: string }>(`${this.base}/auth/forgot-password`, { email: this.email })
      );
      this.step.set(2);
    } catch (err: any) {
      this.errorMessage.set(err.error?.message ?? 'Error al enviar el código. Inténtalo de nuevo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async resetPassword(): Promise<void> {
    this.errorMessage.set('');

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.isLoading.set(true);

    try {
      const res = await firstValueFrom(
        this.http.post<{ message: string }>(`${this.base}/auth/reset-password`, {
          email: this.email,
          code: this.code,
          password: this.password,
          password_confirmation: this.confirmPassword,
        })
      );
      this.successMessage.set(res.message);
      this.step.set(3);
    } catch (err: any) {
      this.errorMessage.set(err.error?.message ?? 'Error al restablecer la contraseña.');
    } finally {
      this.isLoading.set(false);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
