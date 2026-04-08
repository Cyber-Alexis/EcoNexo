import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { CartGroup } from '../../../core/services/cart.service';

export interface DeliveryData {
  method: 'pickup' | 'delivery';
  date: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

const POSTAL_CODE_PATTERN = /^\d{5}$/;

@Component({
  selector: 'app-paso-entrega',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './paso-entrega.html',
  styleUrl: './paso-entrega.css',
})
export class PasoEntrega implements OnInit {
  @Input() groups: CartGroup[] = [];
  @Input() deliveryFee = 3.5;
  @Input() initialData: Partial<DeliveryData> | null = null;
  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<DeliveryData>();
  @Output() deliveryChange = new EventEmitter<DeliveryData>();

  private fb = inject(FormBuilder);

  readonly minDateObj = this.createStartOfDayFromOffset(1);
  readonly maxDateObj = this.createStartOfDayFromOffset(30);
  readonly minDate = this.formatDate(this.minDateObj);
  readonly maxDate = this.formatDate(this.maxDateObj);

  form = this.fb.group({
    method: this.fb.nonNullable.control<'pickup' | 'delivery'>('pickup', Validators.required),
    date: this.fb.nonNullable.control('', [
      Validators.required,
      this.dateRangeValidator(),
      this.noSundayValidator(),
    ]),
    address: this.fb.nonNullable.control(''),
    city: this.fb.nonNullable.control(''),
    postalCode: this.fb.nonNullable.control(''),
  });

  ngOnInit(): void {
    if (this.initialData) {
      this.form.patchValue(
        {
          method: this.initialData.method ?? 'pickup',
          date: this.initialData.date ?? '',
          address: this.initialData.address ?? '',
          city: this.initialData.city ?? '',
          postalCode: this.initialData.postalCode ?? '',
        },
        { emitEvent: false },
      );
    }

    this.updateDeliveryValidators(this.selectedMethod);

    this.form.controls.method.valueChanges.subscribe((method) => {
      this.updateDeliveryValidators(method);
      this.emitSelectionChange();
    });

    this.form.controls.date.valueChanges.subscribe(() => this.emitSelectionChange());
    this.form.controls.address.valueChanges.subscribe(() => this.emitSelectionChange());
    this.form.controls.city.valueChanges.subscribe(() => this.emitSelectionChange());
    this.form.controls.postalCode.valueChanges.subscribe(() => this.emitSelectionChange());
  }

  get selectedMethod(): 'pickup' | 'delivery' {
    return this.form.controls.method.value;
  }

  selectMethod(method: 'pickup' | 'delivery'): void {
    this.form.controls.method.setValue(method);
  }

  isFieldInvalid(field: 'date' | 'address' | 'city' | 'postalCode'): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty));
  }

  getErrorMessage(field: 'date' | 'address' | 'city' | 'postalCode'): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !(ctrl.touched || ctrl.dirty) || !ctrl.errors) return '';

    const err = ctrl.errors;

    if (err['required']) return 'Este campo es obligatorio';
    if (err['outOfRange']) return 'Selecciona una fecha entre mañana y los próximos 30 días';
    if (err['sundayNotAllowed']) return 'Los domingos no están disponibles';
    if (err['pattern']) return 'Introduce un código postal válido de 5 dígitos';
    if (err['invalidDate']) return 'Selecciona una fecha válida';
    return 'Campo inválido';
  }

  onContinuar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.buildDeliveryData();
    this.deliveryChange.emit(data);
    this.next.emit(data);
  }

  private emitSelectionChange(): void {
    const data = this.buildDeliveryData();
    queueMicrotask(() => this.deliveryChange.emit(data));
  }

  private buildDeliveryData(): DeliveryData {
    const value = this.form.getRawValue();

    return {
      method: value.method,
      date: value.date,
      address: value.address.trim() || undefined,
      city: value.city.trim() || undefined,
      postalCode: value.postalCode.trim() || undefined,
    };
  }

  private updateDeliveryValidators(method: 'pickup' | 'delivery'): void {
    this.form.controls.address.setValidators(method === 'delivery' ? [Validators.required] : []);
    this.form.controls.city.setValidators(method === 'delivery' ? [Validators.required] : []);
    this.form.controls.postalCode.setValidators(
      method === 'delivery'
        ? [Validators.required, Validators.pattern(POSTAL_CODE_PATTERN)]
        : [Validators.pattern(POSTAL_CODE_PATTERN)],
    );

    this.form.controls.address.updateValueAndValidity({ emitEvent: false });
    this.form.controls.city.updateValueAndValidity({ emitEvent: false });
    this.form.controls.postalCode.updateValueAndValidity({ emitEvent: false });
  }

  private dateRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string;
      if (!value) return null;

      const selectedDate = this.parseDate(value);
      if (!selectedDate) return { invalidDate: true };

      if (selectedDate < this.minDateObj || selectedDate > this.maxDateObj) {
        return { outOfRange: true };
      }

      return null;
    };
  }

  private noSundayValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string;
      if (!value) return null;

      const selectedDate = this.parseDate(value);
      return selectedDate?.getDay() === 0 ? { sundayNotAllowed: true } : null;
    };
  }

  private parseDate(value: string): Date | null {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day);
  }

  private createStartOfDayFromOffset(daysFromToday: number): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + daysFromToday);
    return date;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
