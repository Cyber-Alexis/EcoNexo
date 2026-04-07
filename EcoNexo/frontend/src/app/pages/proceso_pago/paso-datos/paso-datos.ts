import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

export interface ContactData {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

// Teléfono español: 9 dígitos empezando por 6, 7 o 9
const SPANISH_PHONE_PATTERN = /^[679]\d{8}$/;

@Component({
  selector: 'app-paso-datos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './paso-datos.html',
  styleUrl: './paso-datos.css',
})
export class PasoDatos implements OnInit {
  @Input() initialData?: Partial<ContactData>;
  @Output() next = new EventEmitter<ContactData>();

  private fb = inject(FormBuilder);

  form = this.fb.group({
    name:  ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(SPANISH_PHONE_PATTERN)]],
    notes: [''],
  });

  ngOnInit(): void {
    if (this.initialData) {
      this.form.patchValue(this.initialData);
    }
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty));
  }

  isFieldValid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.valid && (ctrl.touched || ctrl.dirty));
  }

  getErrorMessage(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !(ctrl.touched || ctrl.dirty) || !ctrl.errors) return '';
    const err = ctrl.errors;

    if (err['required']) return 'Este campo es obligatorio';
    if (err['minlength']) return `Mínimo ${err['minlength'].requiredLength} caracteres`;
    if (err['email']) return 'Formato de email inválido';
    if (err['pattern']) return this.patternMessage(field);
    return 'Campo inválido';
  }

  private patternMessage(field: string): string {
    switch (field) {
      case 'phone':
        return 'Debe tener 9 dígitos y empezar por 6, 7 o 9';
      default:
        return 'Formato incorrecto';
    }
  }

  onContinuar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.next.emit(this.form.value as ContactData);
  }
}
