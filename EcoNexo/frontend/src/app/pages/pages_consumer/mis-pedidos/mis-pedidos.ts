import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';

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
  business_id: number;
  business_name: string;
  business_address: string;
  items_count: number;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pendiente',
  confirmed:   'Confirmado',
  preparando:  'Preparando',
  en_camino:   'En Camino',
  completed:   'Completado',
  entregado:   'Entregado',
  cancelled:   'Cancelado',
  cancelado:   'Cancelado',
};

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css',
})
export class MisPedidos implements OnInit {
  private http        = inject(HttpClient);
  private router      = inject(Router);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private base = environment.apiUrl;

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

  private readonly MONTHS = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
  ];

  readonly calFilterOptions = [
    { value: '',           label: 'Todos' },
    { value: 'preparando', label: 'Preparando' },
    { value: 'en_camino',  label: 'En Camino' },
    { value: 'entregado',  label: 'Entregado' },
  ];

  readonly monthName = computed(() =>
    `${this.MONTHS[this.calMonth()]} De ${this.calYear()}`
  );

  readonly calFilterLabel = computed(() =>
    this.calFilterOptions.find(o => o.value === this.calFilter())?.label ?? 'Todos'
  );

  readonly statsForMonth = computed(() => {
    const y = this.calYear(), m = this.calMonth();
    const mo = this.orders().filter(o => {
      const d = new Date(o.created_at);
      return d.getFullYear() === y && d.getMonth() === m;
    });
    return {
      total:      mo.length,
      entregados: mo.filter(o => ['entregado', 'completed'].includes(o.status)).length,
      pendientes: mo.filter(o =>
        !['entregado', 'completed', 'cancelled', 'cancelado'].includes(o.status)
      ).length,
      gasto: mo.reduce((s, o) => s + o.total_price, 0),
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
          const dt = new Date(o.created_at);
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
      const dt = new Date(o.created_at);
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === day
        && (!f || o.status === f);
    });
  });

  // ─────────────────────────────────────────────────────────

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.filter-wrap'))     this.filterOpen.set(false);
    if (!target.closest('.cal-filter-wrap')) this.calFilterOpen.set(false);
  }

  ngOnInit(): void {
    this.http.get<Order[]>(`${this.base}/orders`).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
        this.loadReviewedBizIds();
      },
      error: () => { this.loading.set(false); },
    });
  }

  private loadReviewedBizIds(): void {
    this.http.get<{ reviews: any[] }>(`${this.base}/resenas`).subscribe({
      next: (res) => {
        const ids = new Set<number>(
          res.reviews
            .filter((r: any) => r.type === 'business' && r.business_id)
            .map((r: any) => r.business_id as number)
        );
        this.reviewedBizIds.set(ids);
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
    return ['completed', 'entregado'].includes(order.status);
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

  chipClass(status: string): string {
    const m: Record<string, string> = {
      entregado: 'chip-entregado', completed: 'chip-entregado',
      en_camino: 'chip-encamino',
      preparando: 'chip-preparando', confirmed: 'chip-preparando',
      pending:   'chip-pending',
      cancelled: 'chip-cancelado', cancelado: 'chip-cancelado',
    };
    return `order-chip ${m[status] ?? 'chip-preparando'}`;
  }
}
