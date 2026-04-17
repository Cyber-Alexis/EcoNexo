import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, interval, switchMap, startWith, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

export interface ProducerOrderItem {
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface ProducerOrder {
  id: number;
  code: string;
  status: string;
  total_price: number;
  payment_method: string;
  pickup_date: string | null;
  created_at: string;
  client_name: string;
  client_email: string;
  items_count: number;
  items: ProducerOrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pendiente',
  confirmed: 'En Proceso',
  listo:     'Listo',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const STATUS_NEXT: Record<string, string> = {
  pending:   'confirmed',
  confirmed: 'listo',
  listo:     'completed',
};

@Component({
  selector: 'app-mis-pedidos-productor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mis-pedidos-productor.html',
  styleUrl: './mis-pedidos-productor.css',
})
export class MisPedidosProductor implements OnInit, OnDestroy {
  private http        = inject(HttpClient);
  private router      = inject(Router);
  private authService = inject(AuthService);
  private cdr         = inject(ChangeDetectorRef);
  private base        = environment.apiUrl;

  private destroy$ = new Subject<void>();

  readonly statusLabels = STATUS_LABELS;

  private ordersSubject  = new BehaviorSubject<ProducerOrder[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  orders: ProducerOrder[]  = [];
  loading                  = true;
  activeTab                = 'all';
  searchQuery              = '';
  detailOrder: ProducerOrder | null = null;
  updatingId: number | null = null;

  readonly tabs = [
    { key: 'all',       label: 'Todos' },
    { key: 'pending',   label: 'Pendientes' },
    { key: 'confirmed', label: 'En Proceso' },
    { key: 'listo',     label: 'Listos' },
    { key: 'completed', label: 'Completados' },
  ];

  get filteredOrders(): ProducerOrder[] {
    const q = this.searchQuery.toLowerCase();
    return this.orders.filter(o => {
      const matchTab = this.activeTab === 'all' || o.status === this.activeTab;
      const matchSearch = !q
        || o.code.toLowerCase().includes(q)
        || o.client_name?.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }

  tabCount(key: string): number {
    if (key === 'all') return this.orders.length;
    return this.orders.filter(o => o.status === key).length;
  }

  labelOf(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  nextStatus(status: string): string | null {
    return STATUS_NEXT[status] ?? null;
  }

  nextStatusLabel(status: string): string {
    const next = STATUS_NEXT[status];
    return next ? STATUS_LABELS[next] : '';
  }

  ngOnInit(): void {
    // Poll every 30 seconds for real-time updates
    interval(30_000)
      .pipe(startWith(0), takeUntil(this.destroy$))
      .subscribe(() => this.loadOrders());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.http.get<ProducerOrder[]>(`${this.base}/mis-pedidos-productor`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.orders  = data;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  advanceStatus(order: ProducerOrder): void {
    const next = STATUS_NEXT[order.status];
    if (!next || this.updatingId === order.id) return;
    this.updateStatus(order, next);
  }

  cancelOrder(order: ProducerOrder): void {
    if (this.updatingId === order.id) return;
    this.updateStatus(order, 'cancelled');
  }

  private updateStatus(order: ProducerOrder, status: string): void {
    this.updatingId = order.id;
    this.cdr.markForCheck();

    this.http.patch<{ id: number; status: string }>(
      `${this.base}/mis-pedidos-productor/${order.id}/status`,
      { status }
    ).subscribe({
      next: (res) => {
        this.orders = this.orders.map(o =>
          o.id === res.id ? { ...o, status: res.status } : o
        );
        if (this.detailOrder?.id === res.id) {
          this.detailOrder = { ...this.detailOrder, status: res.status };
        }
        this.updatingId = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.updatingId = null;
        this.cdr.markForCheck();
      },
    });
  }

  openDetail(order: ProducerOrder): void {
    this.detailOrder = order;
    this.cdr.markForCheck();
  }

  closeDetail(): void {
    this.detailOrder = null;
    this.cdr.markForCheck();
  }

  onLogout(): void {
    this.authService.logout().subscribe({ complete: () => this.router.navigate(['/login']) });
  }
}
