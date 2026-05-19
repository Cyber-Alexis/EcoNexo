import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService, CalendarOrder } from '../../../core/services/order.service';
import { environment } from '../../../../environments/environment';
import { BusinessSidebar } from '../business-sidebar/business-sidebar';

// Declaración global para Google Translate
declare const google: any;

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
  private orderService = inject(OrderService);
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

  // ─── Signals ─────────────────────────────────────────────
  readonly orders = signal<CalendarOrder[]>([]);
  readonly loading = signal(true);
  readonly viewYear = signal(new Date().getFullYear());
  readonly viewMonth = signal(new Date().getMonth() + 1); // 1-based
  readonly selectedDay = signal<number | null>(null);
  readonly statusFilter = signal('');
  readonly filterDropdownOpen = signal(false);
  readonly detailOrder = signal<CalendarOrder | null>(null);
  readonly loadingDetail = signal(false);

  readonly filterOptions = [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'confirmed', label: 'En Proceso' },
    { value: 'listo', label: 'Listo' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  readonly filterLabel = computed(() => 
    this.filterOptions.find(o => o.value === this.statusFilter())?.label ?? 'Todos'
  );

  readonly DAY_HEADERS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  readonly monthLabel = computed(() =>
    `${MONTH_NAMES_ES[this.viewMonth() - 1]} ${this.viewYear()}`
  );

  readonly selectedDayLabel = computed(() => {
    const day = this.selectedDay();
    if (!day) return null;
    const d = new Date(this.viewYear(), this.viewMonth() - 1, day);
    return `${DAY_NAMES_ES[d.getDay()]}, ${day} ${MONTH_NAMES_ES[this.viewMonth() - 1]}`;
  });

  readonly selectedOrdersCount = computed(() => {
    const day = this.selectedDay();
    if (!day) return 0;
    return this.getOrdersForDay(day).length;
  });

  readonly calendarCells = computed(() => {
    const firstDay = new Date(this.viewYear(), this.viewMonth() - 1, 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const totalDays = new Date(this.viewYear(), this.viewMonth(), 0).getDate();
    const cells: (number | null)[] = Array(adjustedFirstDay).fill(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    return cells;
  });

  readonly calendarRows = computed(() => {
    const cells = this.calendarCells();
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  });

  readonly selectedDayOrders = computed(() => {
    const day = this.selectedDay();
    if (!day) return [];
    return this.getOrdersForDay(day).filter(o => {
      const filter = this.statusFilter();
      return !filter || o.status === filter;
    });
  });

  // ─── Computed: órdenes del mes actual ────────────────────
  readonly ordersForCurrentMonth = computed(() => {
    const y = this.viewYear();
    const m = this.viewMonth();
    return this.orders().filter(o => {
      // Usar pickup_date si existe, sino created_at
      const dateStr = o.pickup_date || o.created_at;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  });

  // ─── Stats ───────────────────────────────────────────────
  readonly monthlyStats = computed(() => {
    const monthOrders = this.ordersForCurrentMonth();
    const completedOrders = monthOrders.filter(o => o.status === 'completed');
    return {
      orders_count: monthOrders.length,
      total_revenue: completedOrders.reduce((sum, o) => sum + o.total_price, 0),
    };
  });

  // ─── Methods ─────────────────────────────────────────────
  getOrdersForDay(day: number): CalendarOrder[] {
    return this.ordersForCurrentMonth().filter(o => {
      // Usar pickup_date si existe, sino created_at
      const dateStr = o.pickup_date || o.created_at;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getDate() === day;
    });
  }

  getDayData(day: number): { count: number; total: number } | null {
    const orders = this.getOrdersForDay(day);
    const filter = this.statusFilter();
    
    // Aplicar filtro de estado si está activo
    const filteredOrders = filter ? orders.filter(o => o.status === filter) : orders;
    
    if (filteredOrders.length === 0) return null;
    return {
      count: filteredOrders.length,
      total: filteredOrders.reduce((sum, o) => sum + o.total_price, 0),
    };
  }

  isToday(day: number): boolean {
    const now = new Date();
    return (
      now.getFullYear() === this.viewYear() &&
      now.getMonth() + 1 === this.viewMonth() &&
      now.getDate() === day
    );
  }

  isSelected(day: number): boolean {
    return this.selectedDay() === day;
  }

  selectDay(day: number | null): void {
    if (!day) return;
    this.selectedDay.set(day);
    this.filterDropdownOpen.set(false);
  }

  toggleFilterDropdown(): void {
    this.filterDropdownOpen.update(v => !v);
  }

  selectFilter(value: string): void {
    this.statusFilter.set(value);
    this.filterDropdownOpen.set(false);
  }

  getVisibleOrdersForDay(day: number): CalendarOrder[] {
    const orders = this.getOrdersForDay(day);
    const filter = this.statusFilter();
    return orders
      .filter(o => !filter || o.status === filter)
      .slice(0, 2); // Mostrar máximo 2 pedidos como chips
  }

  chipClass(status: string): string {
    const map: Record<string, string> = {
      completed: 'order-chip chip-completed',
      listo: 'order-chip chip-listo',
      confirmed: 'order-chip chip-confirmed',
      pending: 'order-chip chip-pending',
      cancelled: 'order-chip chip-cancelado',
    };
    return map[status] ?? 'order-chip chip-pending';
  }

  prevMonth(): void {
    if (this.viewMonth() === 1) {
      this.viewYear.update(y => y - 1);
      this.viewMonth.set(12);
    } else {
      this.viewMonth.update(m => m - 1);
    }
    this.selectedDay.set(null);
    this.filterDropdownOpen.set(false);
  }

  nextMonth(): void {
    if (this.viewMonth() === 12) {
      this.viewYear.update(y => y + 1);
      this.viewMonth.set(1);
    } else {
      this.viewMonth.update(m => m + 1);
    }
    this.selectedDay.set(null);
    this.filterDropdownOpen.set(false);
  }

  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
  statusColor(s: string): string { return STATUS_COLORS[s] ?? ''; }

  deliveryMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      'pickup': 'Recogida en tienda',
      'delivery': 'Entrega a domicilio'
    };
    return labels[method] ?? method;
  }

  openDetail(order: CalendarOrder): void {
    // Si la orden ya tiene items, mostrar directamente
    if (order.items && order.items.length > 0) {
      this.detailOrder.set(order);
      return;
    }

    // Si no tiene items, cargar los detalles completos de la orden
    this.loadingDetail.set(true);

    this.http
      .get<CalendarOrder>(`${this.base}/orders/${order.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fullOrder) => {
          // Combinar los datos del calendario con los detalles completos
          this.detailOrder.set({
            ...order,
            items: fullOrder.items || [],
            business_address: fullOrder.business_address || order.business_address,
            payment_method: fullOrder.payment_method || order.payment_method,
            created_at: fullOrder.created_at || order.created_at,
          });
          this.loadingDetail.set(false);
        },
        error: (err) => {
          console.error('Error loading order details:', err);
          // Mostrar el modal aunque falle, con la info básica disponible
          this.detailOrder.set(order);
          this.loadingDetail.set(false);
        },
      });
  }

  closeDetail(): void {
    this.detailOrder.set(null);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Language translation
  currentLanguage = '';

  private detectCurrentLanguage(): string {
    try {
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (selectElement && selectElement.value) {
        return selectElement.value;
      }
    } catch (error) {
      console.error('Error detecting language:', error);
    }
    return 'es';
  }

  changeLanguage(lang: string): void {
    if (this.currentLanguage === lang) return;
    this.currentLanguage = lang;
    const changeGoogleLanguage = () => {
      try {
        const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (selectElement) {
          selectElement.value = lang;
          selectElement.dispatchEvent(new Event('change'));
        }
      } catch (error) {
        console.error('Error al cambiar idioma:', error);
      }
    };
    if (typeof google !== 'undefined' && google.translate) {
      changeGoogleLanguage();
    } else {
      setTimeout(changeGoogleLanguage, 500);
    }
  }

  ngOnInit(): void {
    // Detectar idioma actual
    this.currentLanguage = this.detectCurrentLanguage();
    
    // Suscribirse al Observable de órdenes
    this.orderService.businessOrders$
      .pipe(takeUntil(this.destroy$))
      .subscribe(orders => {
        this.orders.set(orders);
        this.loading.set(false);
        
        // Auto-select today if viewing the current month
        const now = new Date();
        if (now.getFullYear() === this.viewYear() && now.getMonth() + 1 === this.viewMonth()) {
          if (this.selectedDay() === null) {
            this.selectedDay.set(now.getDate());
          }
        }
        
        this.cdr.markForCheck();
      });

    // Iniciar polling automático cada 30 segundos
    this.orderService.startPolling(30000);
  }

  ngOnDestroy(): void {
    // Detener polling al destruir el componente
    this.orderService.stopPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
