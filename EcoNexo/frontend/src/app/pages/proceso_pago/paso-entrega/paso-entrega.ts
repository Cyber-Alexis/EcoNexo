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

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface TimeInterval {
  start: number;
  end: number;
}

interface CommonScheduleRow {
  label: string;
  hours: string;
}

const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Lun',
  tue: 'Mar',
  wed: 'Mié',
  thu: 'Jue',
  fri: 'Vie',
  sat: 'Sáb',
  sun: 'Dom',
};

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

  get commonOpeningHoursSummary(): CommonScheduleRow[] {
    return this.buildCommonOpeningHoursSummary();
  }

  get commonOpeningHoursMessage(): string {
    if (this.groups.length <= 1) {
      return 'Horario disponible para los negocios incluidos en este pedido.';
    }

    if (this.hasMissingOpeningHours()) {
      return 'Algún negocio no tiene horario definido, así que el resumen común puede no ser exacto.';
    }

    if (this.commonOpeningHoursSummary.length === 0) {
      return 'No hay una franja horaria exacta que coincida en todos los negocios.';
    }

    return 'Este es el horario que comparten todos los negocios de tu compra.';
  }

  getGroupOpeningHours(group: CartGroup): string {
    return this.getRawGroupOpeningHours(group) ?? 'Horario no disponible';
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

  private buildCommonOpeningHoursSummary(): CommonScheduleRow[] {
    const schedules = this.groups
      .map((group) => this.getRawGroupOpeningHours(group))
      .filter((schedule): schedule is string => !!schedule);

    if (schedules.length === 0 || schedules.length !== this.groups.length) {
      return [];
    }

    const parsedSchedules = schedules.map((schedule) => this.parseOpeningHours(schedule));
    if (parsedSchedules.some((schedule) => this.scheduleHasNoOpenDays(schedule))) {
      return [];
    }

    let commonSchedule = this.cloneScheduleMap(parsedSchedules[0]);

    for (const schedule of parsedSchedules.slice(1)) {
      for (const day of DAY_ORDER) {
        commonSchedule[day] = this.intersectIntervals(commonSchedule[day], schedule[day]);
      }
    }

    return this.toSummaryRows(commonSchedule);
  }

  private getRawGroupOpeningHours(group: CartGroup): string | null {
    const directHours = group.openingHours?.trim();
    if (directHours) {
      return directHours;
    }

    const itemHours = group.items.find((item) => item.openingHours?.trim())?.openingHours?.trim();
    return itemHours || null;
  }

  private hasMissingOpeningHours(): boolean {
    return this.groups.some((group) => !this.getRawGroupOpeningHours(group));
  }

  private parseOpeningHours(openingHours: string): Record<DayKey, TimeInterval[]> {
    const schedule = this.createEmptyScheduleMap();
    const normalized = openingHours.replace(/\s+/g, ' ').trim();
    const segmentRegex =
      /(Lun(?:es)?|Mar(?:tes)?|Mi(?:é|e)(?:rcoles)?|Jue(?:ves)?|Vie(?:rnes)?|S(?:á|a)b(?:ado)?|Dom(?:ingo)?)(?:\s*-\s*(Lun(?:es)?|Mar(?:tes)?|Mi(?:é|e)(?:rcoles)?|Jue(?:ves)?|Vie(?:rnes)?|S(?:á|a)b(?:ado)?|Dom(?:ingo)?))?\s*:\s*([^:]+?)(?=(?:,\s*(?:Lun|Mar|Mi(?:é|e)|Jue|Vie|S(?:á|a)b|Dom)\b)|$)/gi;

    let match: RegExpExecArray | null;
    while ((match = segmentRegex.exec(normalized)) !== null) {
      const startDay = this.parseDayKey(match[1]);
      const endDay = this.parseDayKey(match[2] ?? match[1]);
      if (!startDay || !endDay) {
        continue;
      }

      const intervals = this.parseIntervals(match[3]);
      if (intervals.length === 0) {
        continue;
      }

      for (const day of this.expandDayRange(startDay, endDay)) {
        schedule[day] = this.mergeIntervals([...schedule[day], ...intervals]);
      }
    }

    return schedule;
  }

  private parseDayKey(value: string): DayKey | null {
    const normalized = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized.startsWith('lun')) return 'mon';
    if (normalized.startsWith('mar')) return 'tue';
    if (normalized.startsWith('mie')) return 'wed';
    if (normalized.startsWith('jue')) return 'thu';
    if (normalized.startsWith('vie')) return 'fri';
    if (normalized.startsWith('sab')) return 'sat';
    if (normalized.startsWith('dom')) return 'sun';
    return null;
  }

  private expandDayRange(startDay: DayKey, endDay: DayKey): DayKey[] {
    const startIndex = DAY_ORDER.indexOf(startDay);
    const endIndex = DAY_ORDER.indexOf(endDay);

    if (startIndex === -1 || endIndex === -1) {
      return [];
    }

    if (startIndex <= endIndex) {
      return DAY_ORDER.slice(startIndex, endIndex + 1);
    }

    return [startDay];
  }

  private parseIntervals(value: string): TimeInterval[] {
    return this.mergeIntervals(
      value
        .split(',')
        .map((part) => part.trim())
        .map((part) => part.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/))
        .filter((match): match is RegExpMatchArray => !!match)
        .map(([, start, end]) => ({
          start: this.toMinutes(start),
          end: this.toMinutes(end),
        }))
        .filter((interval) => interval.end > interval.start),
    );
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return (hours * 60) + minutes;
  }

  private toHourString(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const minutes = (totalMinutes % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
    if (intervals.length === 0) {
      return [];
    }

    const sorted = [...intervals].sort((a, b) => a.start - b.start);
    const merged: TimeInterval[] = [{ ...sorted[0] }];

    for (const current of sorted.slice(1)) {
      const last = merged[merged.length - 1];
      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push({ ...current });
      }
    }

    return merged;
  }

  private intersectIntervals(left: TimeInterval[], right: TimeInterval[]): TimeInterval[] {
    const intersections: TimeInterval[] = [];

    for (const first of left) {
      for (const second of right) {
        const start = Math.max(first.start, second.start);
        const end = Math.min(first.end, second.end);

        if (start < end) {
          intersections.push({ start, end });
        }
      }
    }

    return this.mergeIntervals(intersections);
  }

  private scheduleHasNoOpenDays(schedule: Record<DayKey, TimeInterval[]>): boolean {
    return DAY_ORDER.every((day) => schedule[day].length === 0);
  }

  private cloneScheduleMap(schedule: Record<DayKey, TimeInterval[]>): Record<DayKey, TimeInterval[]> {
    return DAY_ORDER.reduce<Record<DayKey, TimeInterval[]>>((acc, day) => {
      acc[day] = schedule[day].map((interval) => ({ ...interval }));
      return acc;
    }, this.createEmptyScheduleMap());
  }

  private createEmptyScheduleMap(): Record<DayKey, TimeInterval[]> {
    return {
      mon: [],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
    };
  }

  private toSummaryRows(schedule: Record<DayKey, TimeInterval[]>): CommonScheduleRow[] {
    const rows: CommonScheduleRow[] = [];
    let rangeStart = -1;
    let previousHours = '';

    DAY_ORDER.forEach((day, index) => {
      const hours = this.formatIntervals(schedule[day]);

      if (!hours) {
        if (rangeStart !== -1) {
          rows.push(this.buildSummaryRow(rangeStart, index - 1, previousHours));
          rangeStart = -1;
          previousHours = '';
        }
        return;
      }

      if (rangeStart === -1) {
        rangeStart = index;
        previousHours = hours;
        return;
      }

      if (hours !== previousHours) {
        rows.push(this.buildSummaryRow(rangeStart, index - 1, previousHours));
        rangeStart = index;
        previousHours = hours;
      }
    });

    if (rangeStart !== -1) {
      rows.push(this.buildSummaryRow(rangeStart, DAY_ORDER.length - 1, previousHours));
    }

    return rows;
  }

  private buildSummaryRow(startIndex: number, endIndex: number, hours: string): CommonScheduleRow {
    const startDay = DAY_LABELS[DAY_ORDER[startIndex]];
    const endDay = DAY_LABELS[DAY_ORDER[endIndex]];

    return {
      label: startIndex === endIndex ? startDay : `${startDay}-${endDay}`,
      hours,
    };
  }

  private formatIntervals(intervals: TimeInterval[]): string {
    return intervals
      .map((interval) => `${this.toHourString(interval.start)}-${this.toHourString(interval.end)}`)
      .join(', ');
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
