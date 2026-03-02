import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  rememberMe = false;
  message = '';
  isLoading = false;

  constructor(private router: Router) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.message = 'Por favor, completa todos los campos.';
      return;
    }

    this.isLoading = true;

    // Simular llamada al backend con un pequeño delay
    setTimeout(() => {
      // Aquí iría la llamada real al backend
      // this.authService.login(this.email, this.password).subscribe(...)
      
      // Simulamos un login exitoso
      const userData = {
        email: this.email,
        name: this.email.split('@')[0],
        token: 'fake-jwt-token',
      };

      // Guardar datos del usuario en localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      this.message = '✓ Iniciando sesión...';
      this.isLoading = false;

      // Redirigir al home después de 500ms
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 500);
    }, 800);
  }
}
