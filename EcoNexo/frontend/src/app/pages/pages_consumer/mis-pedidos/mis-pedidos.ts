import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  computed,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { environment } from '../../../../environments/environment';
import { ConsumerSidebar } from '../consumer-sidebar/consumer-sidebar';

export interface OrderItem {
  product_id: number;
  product_name: string;
  price: number;
  price_unit: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  code: string;
  status: string;
  total_price: number;
  payment_method: string;
  pickup_date: string | null;
  created_at: string;
  delivery_method: string;
  user_address: string;
  business_id: number;
  business_name: string;
  business_address: string;
  items_count: number;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pendiente',
  confirmed: 'En Proceso',
  listo:     'Listo',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ConsumerSidebar],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css',
})
export class MisPedidos implements OnInit, OnDestroy {
  private http        = inject(HttpClient);
  private router      = inject(Router);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private ngZone      = inject(NgZone);
  private cdr         = inject(ChangeDetectorRef);
  private base = environment.apiUrl;
  private destroy$ = new Subject<void>();

  userName = '';

  // ── Signals ──────────────────────────────────────────────
  readonly orders        = signal<Order[]>([]);
  readonly loading       = signal(true);
  readonly searchQuery   = signal('');
  readonly selectedStatus = signal('');
  readonly filterOpen    = signal(false);
  readonly detailOrder   = signal<Order | null>(null);

  // ── Review modal ──────────────────────────────────────────
  readonly reviewingOrder  = signal<Order | null>(null);
  readonly reviewRating    = signal(5);
  readonly reviewComment   = signal('');
  readonly reviewSaving    = signal(false);
  readonly reviewError     = signal('');
  readonly reviewedBizIds  = signal<Set<number>>(new Set());

  readonly reviewLabel = computed(() => {
    const n = this.reviewRating();
    if (n >= 5) return 'Excelente';
    if (n >= 4) return 'Bueno';
    if (n >= 3) return 'Regular';
    if (n >= 2) return 'Malo';
    return 'Muy malo';
  });

  readonly reviewLabelColor = computed(() => {
    const n = this.reviewRating();
    if (n >= 5) return '#22C55E';
    if (n >= 4) return '#84CC16';
    if (n >= 3) return '#EAB308';
    if (n >= 2) return '#F97316';
    return '#EF4444';
  });

  readonly availableFilters = computed(() => {
    const seen = new Set<string>();
    const filters: { value: string; label: string }[] = [
      { value: '', label: 'Todos los estados' },
    ];
    for (const o of this.orders()) {
      if (!seen.has(o.status)) {
        seen.add(o.status);
        filters.push({ value: o.status, label: this.labelOf(o.status) });
      }
    }
    return filters;
  });

  // ── Computed filter ───────────────────────────────────────
  readonly filtered = computed(() => {
    const q      = this.searchQuery().toLowerCase();
    const status = this.selectedStatus();
    return this.orders().filter(o => {
      const matchStatus = !status || o.status === status;
      const matchSearch = !q
        || o.business_name?.toLowerCase().includes(q)
        || o.code.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  });

  readonly statusLabels = STATUS_LABELS;

  // ── Calendar ────────────────────────────────────────────
  readonly view          = signal<'list' | 'calendar'>('list');
  readonly calYear       = signal(new Date().getFullYear());
  readonly calMonth      = signal(new Date().getMonth());
  readonly selectedDay   = signal<number | null>(null);
  readonly calFilter     = signal('');
  readonly calFilterOpen = signal(false);
  readonly viewportWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1920);

  private readonly MONTHS = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
  ];

  readonly calFilterOptions = [
    { value: '',          label: 'Todos' },
    { value: 'pending',   label: 'Pendiente' },
    { value: 'confirmed', label: 'En Proceso' },
    { value: 'listo',     label: 'Listo' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  readonly monthName = computed(() =>
    `${this.MONTHS[this.calMonth()]} ${this.calYear()}`
  );

  readonly calFilterLabel = computed(() =>
    this.calFilterOptions.find(o => o.value === this.calFilter())?.label ?? 'Todos'
  );

  readonly maxVisibleOrders = computed(() => {
    const w = this.viewportWidth();
    if (w >= 1024) return 3;  // Desktop: celdas grandes
    if (w >= 768)  return 3;  // Tablet: celdas grandes
    if (w >= 480)  return 2;  // Mobile: celdas medianas
    return 1;                 // Small mobile: celdas pequeñas
  });

  readonly statsForMonth = computed(() => {
    const y = this.calYear(), m = this.calMonth();
    const mo = this.orders().filter(o => {
      if (!o.pickup_date) return false;
      const d = new Date(o.pickup_date);
      return d.getFullYear() === y && d.getMonth() === m;
    });
    return {
      total:      mo.length,
      entregados: mo.filter(o => o.status === 'completed').length,
      pendientes: mo.filter(o =>
        !['completed', 'cancelled'].includes(o.status)
      ).length,
      gasto: mo.filter(o => o.status === 'completed').reduce((s, o) => s + o.total_price, 0),
    };
  });

  readonly calendarDays = computed(() => {
    const y = this.calYear(), m = this.calMonth(), f = this.calFilter();
    let offset = new Date(y, m, 1).getDay() - 1;
    if (offset < 0) offset = 6;
    const dim = new Date(y, m + 1, 0).getDate();
    const cells: { day: number | null; orders: Order[] }[] = Array.from(
      { length: offset }, () => ({ day: null, orders: [] })
    );
    for (let d = 1; d <= dim; d++) {
      cells.push({
        day: d,
        orders: this.orders().filter(o => {
          if (!o.pickup_date) return false;
          const dt = new Date(o.pickup_date);
          return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
            && (!f || o.status === f);
        }),
      });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, orders: [] });
    return cells;
  });

  readonly selectedDayOrders = computed(() => {
    const day = this.selectedDay();
    if (day === null) return [];
    const y = this.calYear(), m = this.calMonth(), f = this.calFilter();
    return this.orders().filter(o => {
      if (!o.pickup_date) return false;
      const dt = new Date(o.pickup_date);
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === day
        && (!f || o.status === f);
    });
  });

  // ─────────────────────────────────────────────────────────

  @HostListener('window:resize')
  onResize(): void {
    this.viewportWidth.set(window.innerWidth);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.filter-wrap'))     this.filterOpen.set(false);
    if (!target.closest('.cal-filter-wrap')) this.calFilterOpen.set(false);
  }

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.name;
    }

    // Suscribirse al Observable de órdenes del consumidor
    this.orderService.consumerOrders$
      .pipe(takeUntil(this.destroy$))
      .subscribe(orders => {
        this.ngZone.run(() => {
          this.orders.set(orders as Order[]);
          this.loading.set(false);
          this.loadReviewedBizIds();
          this.cdr.markForCheck();
        });
      });

    // Iniciar polling automático cada 30 segundos
    this.orderService.startConsumerPolling(30000);
  }

  ngOnDestroy(): void {
    // Detener polling al destruir el componente
    this.orderService.stopConsumerPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadReviewedBizIds(): void {
    this.http.get<{ reviews: any[] }>(`${this.base}/resenas`).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          const ids = new Set<number>(
            res.reviews
              .filter((r: any) => r.type === 'business' && r.business_id)
              .map((r: any) => r.business_id as number)
          );
          this.reviewedBizIds.set(ids);
          this.cdr.markForCheck();
        });
      },
    });
  }

  labelOf(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  selectFilter(value: string): void {
    this.selectedStatus.set(value);
    this.filterOpen.set(false);
  }

  isDelivered(order: Order): boolean {
    return order.status === 'completed';
  }

  hasReviewed(order: Order): boolean {
    return this.reviewedBizIds().has(order.business_id);
  }

  openReview(order: Order): void {
    this.reviewingOrder.set(order);
    this.reviewRating.set(5);
    this.reviewComment.set('');
    this.reviewError.set('');
  }

  closeReview(): void {
    this.reviewingOrder.set(null);
  }

  setReviewRating(n: number): void {
    this.reviewRating.set(n);
  }

  submitReview(): void {
    const order = this.reviewingOrder();
    if (!order || this.reviewSaving()) return;
    this.reviewSaving.set(true);
    this.reviewError.set('');

    this.http.post(`${this.base}/resenas/negocio`, {
      business_id: order.business_id,
      rating:      this.reviewRating(),
      comment:     this.reviewComment() || null,
    }).subscribe({
      next: () => {
        this.reviewSaving.set(false);
        this.reviewingOrder.set(null);
        // mark this business as reviewed so button disappears
        const ids = new Set(this.reviewedBizIds());
        ids.add(order.business_id);
        this.reviewedBizIds.set(ids);
      },
      error: (err) => {
        this.reviewSaving.set(false);
        this.reviewError.set(err?.error?.message ?? 'Error al publicar la reseña.');
      },
    });
  }

  openDetail(order: Order): void {
    this.detailOrder.set(order);
  }

  closeDetail(): void {
    this.detailOrder.set(null);
  }

  onRepetir(order: Order): void {
    this.cartService.clear();
    for (const item of order.items) {
      this.cartService.addItem(
        {
          productId: item.product_id,
          businessId: order.business_id,
          name: item.product_name,
          price: item.price ?? item.unit_price,
          priceUnit: item.price_unit ?? '',
          img: '',
          business: order.business_name,
        },
        item.quantity,
      );
    }
    this.cartService.open();
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  prevMonth(): void {
    this.selectedDay.set(null);
    if (this.calMonth() === 0) { this.calYear.update(y => y - 1); this.calMonth.set(11); }
    else { this.calMonth.update(m => m - 1); }
  }

  nextMonth(): void {
    this.selectedDay.set(null);
    if (this.calMonth() === 11) { this.calYear.update(y => y + 1); this.calMonth.set(0); }
    else { this.calMonth.update(m => m + 1); }
  }

  selectDay(day: number | null): void {
    if (!day) return;
    this.selectedDay.set(this.selectedDay() === day ? null : day);
  }

  selectCalFilter(val: string): void {
    this.calFilter.set(val);
    this.calFilterOpen.set(false);
    this.selectedDay.set(null);
  }

  isToday(day: number): boolean {
    const t = new Date();
    return t.getFullYear() === this.calYear()
      && t.getMonth() === this.calMonth()
      && t.getDate() === day;
  }

  getVisibleOrdersForDay(day: number | null): Order[] {
    if (day === null) return [];
    const cell = this.calendarDays().find(c => c.day === day);
    if (!cell) return [];
    const maxOrders = this.maxVisibleOrders();
    return cell.orders.slice(0, maxOrders); // Límite adaptativo según tamaño de celda
  }

  deliveryMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      'pickup': 'Recogida en tienda',
      'delivery': 'Entrega a domicilio'
    };
    return labels[method] ?? method;
  }

  chipClass(status: string): string {
    const m: Record<string, string> = {
      completed:  'chip-completed',
      entregado:  'chip-completed',
      listo:      'chip-listo',
      confirmed:  'chip-confirmed',
      en_camino:  'chip-confirmed',
      preparando: 'chip-pending',
      pending:    'chip-pending',
      cancelled:  'chip-cancelado',
      cancelado:  'chip-cancelado',
    };
    return `order-chip ${m[status] ?? 'chip-pending'}`;
  }
}
