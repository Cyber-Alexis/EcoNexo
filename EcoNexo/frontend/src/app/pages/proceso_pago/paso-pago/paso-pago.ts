import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule, FormBuilder, ValidationErrors, Validators } from '@angular/forms';

export interface PaymentData {
  paymentMethod: 'card' | 'cash';
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

// Valida que el número de tarjeta tenga exactamente 16 dígitos (ignora espacios)
function cardNumberValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  const digits = value.replace(/\s/g, '');
  if (!digits) return null;
  if (!/^\d+$/.test(digits)) return { cardInvalid: true };
  if (digits.length !== 16) return { cardLength: true };
  return null;
}

// Valida formato MM/AA, mes 01-12, no caducada, máximo +10 años
function expiryValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) return null;

  if (!/^\d{2}\/\d{2}$/.test(value)) return { format: true };

  const [mmStr, yyStr] = value.split('/');
  const month = parseInt(mmStr, 10);
  const year = parseInt('20' + yyStr, 10);

  if (month < 1 || month > 12) return { month: true };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { expired: true };
  }
  if (year > currentYear + 10) return { tooFar: true };

  return null;
}

@Component({
  selector: 'app-paso-pago',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './paso-pago.html',
  styleUrl: './paso-pago.css',
})
export class PasoPago implements OnInit {
  @Input() deliveryMethod: 'pickup' | 'delivery' = 'pickup';
  @Input() total = 0;
  @Input() submitting = false;
  @Input() submitError = '';
  @Output() back = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<PaymentData>();

  private fb = inject(FormBuilder);

  selectedPaymentMethod: 'card' | 'cash' = 'card';

  form = this.fb.group({
    cardNumber: ['', [Validators.required, cardNumberValidator]],
    cardExpiry: ['', [Validators.required, expiryValidator]],
    cardCvv:    ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
  });

  ngOnInit(): void {
    // Si es entrega a domicilio, solo permitir tarjeta
    if (this.deliveryMethod === 'delivery') {
      this.selectedPaymentMethod = 'card';
    }
    this.updateCardValidators();
  }

  get showCashOption(): boolean {
    return this.deliveryMethod === 'pickup';
  }

  selectPaymentMethod(method: 'card' | 'cash'): void {
    this.selectedPaymentMethod = method;
    this.updateCardValidators();
  }

  private updateCardValidators(): void {
    const cardNumber = this.form.get('cardNumber');
    const cardExpiry = this.form.get('cardExpiry');
    const cardCvv = this.form.get('cardCvv');

    if (this.selectedPaymentMethod === 'card') {
      // Hacer campos obligatorios
      cardNumber?.setValidators([Validators.required, cardNumberValidator]);
      cardExpiry?.setValidators([Validators.required, expiryValidator]);
      cardCvv?.setValidators([Validators.required, Validators.pattern(/^\d{3}$/)]);
    } else {
      // Quitar validaciones
      cardNumber?.clearValidators();
      cardExpiry?.clearValidators();
      cardCvv?.clearValidators();
      // Limpiar valores
      this.form.patchValue({
        cardNumber: '',
        cardExpiry: '',
        cardCvv: ''
      });
    }

    cardNumber?.updateValueAndValidity();
    cardExpiry?.updateValueAndValidity();
    cardCvv?.updateValueAndValidity();
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

    // Número de tarjeta
    if (err['cardLength'])  return 'El número de tarjeta debe tener 16 dígitos';
    if (err['cardInvalid']) return 'Solo se permiten dígitos';

    // Fecha de expiración
    if (err['format'])  return 'Formato incorrecto. Usa MM/AA (solo números)';
    if (err['month'])   return 'El mes debe estar entre 01 y 12';
    if (err['expired']) return 'La tarjeta está caducada';
    if (err['tooFar'])  return `Fecha demasiado lejana (máximo ${new Date().getFullYear() + 10})`;

    // CVV
    if (err['pattern']) return 'El CVV debe tener exactamente 3 dígitos';

    return 'Campo inválido';
  }

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '').slice(0, 16);
    value = value.replace(/(.{4})/g, '$1 ').trim();
    input.value = value;
    this.form.get('cardNumber')?.setValue(value, { emitEvent: false });
  }

  formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '').slice(0, 4);
    if (value.length >= 3) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    input.value = value;
    this.form.get('cardExpiry')?.setValue(value, { emitEvent: false });
  }

  filterCvv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 3);
    input.value = digits;
    this.form.get('cardCvv')?.setValue(digits, { emitEvent: false });
  }

  onConfirmar(): void {
    if (this.selectedPaymentMethod === 'card' && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const paymentData: PaymentData = {
      paymentMethod: this.selectedPaymentMethod,
      ...(this.selectedPaymentMethod === 'card' ? {
        cardNumber: this.form.value.cardNumber ?? undefined,
        cardExpiry: this.form.value.cardExpiry ?? undefined,
        cardCvv: this.form.value.cardCvv ?? undefined,
      } : {})
    };

    this.confirm.emit(paymentData);
  }
}
