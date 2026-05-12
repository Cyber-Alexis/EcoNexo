import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';import { BusinessSidebar } from '../business-sidebar/business-sidebar';
interface CalendarOrder {
  id: number;
  code: string;
  day: number;
  time: string;
  status: string;
  client_name: string;
  items_count: number;
  total_price: number;
}

interface DayData {
  count: number;
  total: number;
}

interface CalendarData {
  year: number;
  month: number;
  days: Record<string, DayData>;
  monthly_stats: { orders_count: number; total_revenue: number };
  orders: CalendarOrder[];
}

const MONTH_NAMES_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const DAY_NAMES_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pendiente',
  confirmed: 'En Proceso',
  listo:     'Listo',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending:   'badge--orange',
  confirmed: 'badge--blue',
  listo:     'badge--teal',
  completed: 'badge--green',
  cancelled: 'badge--red',
};

@Component({
  selector: 'app-calendario-productor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, BusinessSidebar],
  templateUrl: './calendario-productor.html',
  styleUrl: './calendario-productor.css',
})
export class CalendarioProductor implements OnInit, OnDestroy {
  private http        = inject(HttpClient);
  private router      = inject(Router);
  private authService = inject(AuthService);
  private cdr         = inject(ChangeDetectorRef);
  private base        = environment.apiUrl;
  private destroy$    = new Subject<void>();

  get businessHeaderName(): string {
    return this.authService.getUser()?.business_name?.trim() || 'Mi Negocio';
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => console.error('Logout error:', err)
    });
  }

  loading      = true;
  data: CalendarData | null = null;
  viewYear     = new Date().getFullYear();
  viewMonth    = new Date().getMonth() + 1; // 1-based
  selectedDay: number | null = null;
  statusFilter = '';

  readonly DAY_HEADERS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  get monthLabel(): string {
    return `${MONTH_NAMES_ES[this.viewMonth - 1]} ${this.viewYear}`;
  }

  get selectedDayLabel(): string | null {
    if (!this.selectedDay) return null;
    const d = new Date(this.viewYear, this.viewMonth - 1, this.selectedDay);
    return `${DAY_NAMES_ES[d.getDay()]}, ${this.selectedDay} ${MONTH_NAMES_ES[this.viewMonth - 1]}`;
  }

  get selectedOrdersCount(): number {
    if (!this.data || !this.selectedDay) return 0;
    return this.data.days[String(this.selectedDay)]?.count ?? 0;
  }

  get calendarCells(): (number | null)[] {
    const firstDay = new Date(this.viewYear, this.viewMonth - 1, 1).getDay();
    // Ajustar para que lunes sea 0 (domingo es 6)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const totalDays = new Date(this.viewYear, this.viewMonth, 0).getDate();
    const cells: (number | null)[] = Array(adjustedFirstDay).fill(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  get calendarRows(): (number | null)[][] {
    const cells = this.calendarCells;
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }

  get filteredOrders(): CalendarOrder[] {
    if (!this.data || !this.selectedDay) return [];
    return this.data.orders.filter(
      o => o.day === this.selectedDay && (!this.statusFilter || o.status === this.statusFilter)
    );
  }

  getDayData(day: number): DayData | null {
    return this.data?.days[String(day)] ?? null;
  }

  isToday(day: number): boolean {
    const now = new Date();
    return (
      now.getFullYear() === this.viewYear &&
      now.getMonth() + 1 === this.viewMonth &&
      now.getDate() === day
    );
  }

  isSelected(day: number): boolean {
    return this.selectedDay === day;
  }

  selectDay(day: number | null): void {
    if (!day) return;
    this.selectedDay = day;
    this.statusFilter = '';
    this.cdr.markForCheck();
  }

  prevMonth(): void {
    if (this.viewMonth === 1) { this.viewYear--; this.viewMonth = 12; }
    else this.viewMonth--;
    this.selectedDay = null;
    this.loadData();
  }

  nextMonth(): void {
    if (this.viewMonth === 12) { this.viewYear++; this.viewMonth = 1; }
    else this.viewMonth++;
    this.selectedDay = null;
    this.loadData();
  }

  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
  statusColor(s: string): string { return STATUS_COLORS[s] ?? ''; }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.http
      .get<CalendarData>(`${this.base}/calendario-pedidos?year=${this.viewYear}&month=${this.viewMonth}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.data = data;
          // Auto-select today if viewing the current month
          if (!this.selectedDay) {
            const now = new Date();
            if (now.getFullYear() === this.viewYear && now.getMonth() + 1 === this.viewMonth) {
              this.selectedDay = now.getDate();
            }
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
