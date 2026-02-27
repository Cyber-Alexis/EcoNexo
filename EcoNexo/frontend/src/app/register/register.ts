import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  email = '';
  username = '';
  dni = '';
  domicilio = '';
  password = '';
  confirmPassword = '';
  message = '';

  onSubmit(): void {
    if (this.password !== this.confirmPassword) {
      this.message = 'Las contraseñas no coinciden.';
      return;
    }
    this.message = `Registro enviado para: ${this.email}`;
  }

}
