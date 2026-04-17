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
import { Subject, interval, takeUntil, startWith } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface Kpis {
  total_revenue: number;
  completed_orders: number;
  unique_clients: number;
  avg_rating: number;
  total_reviews: number;
  revenue_change: number;
  orders_change: number;
}

interface MonthlySale {
  label: string;
  year: number;
  month: number;
  total: number;
  orders: number;
}

interface TopProduct {
  rank: number;
  name: string;
  units_sold: number;
  revenue: number;
  trend: 'up' | 'down';
}

interface RecentReview {
  author: string;
  rating: number;
  comment: string;
  ago: string;
}

interface StatsData {
  kpis: Kpis;
  monthly_sales: MonthlySale[];
  top_products: TopProduct[];
  recent_reviews: RecentReview[];
}

@Component({
  selector: 'app-estadisticas-productor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './estadisticas-productor.html',
  styleUrl: './estadisticas-productor.css',
})
export class EstadisticasProductor implements OnInit, OnDestroy {
  private http        = inject(HttpClient);
  private router      = inject(Router);
  private authService = inject(AuthService);
  private cdr         = inject(ChangeDetectorRef);
  private base        = environment.apiUrl;
  private destroy$    = new Subject<void>();

  loading   = true;
  data: StatsData | null = null;

  readonly periodLabel = 'Último mes';

  ngOnInit(): void {
    interval(30_000)
      .pipe(startWith(0), takeUntil(this.destroy$))
      .subscribe(() => this.loadStats());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats(): void {
    this.http.get<StatsData>(`${this.base}/mis-estadisticas`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => {
          this.data    = d;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  get maxMonthlyTotal(): number {
    if (!this.data?.monthly_sales?.length) return 1;
    return Math.max(...this.data.monthly_sales.map(m => m.total), 1);
  }

  barHeight(total: number): string {
    const pct = (total / this.maxMonthlyTotal) * 100;
    return `${Math.max(pct, 3)}%`;
  }

  stars(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  isFilled(star: number, rating: number): boolean {
    return star <= Math.round(rating);
  }

  onLogout(): void {
    this.authService.logout().subscribe({ complete: () => this.router.navigate(['/login']) });
  }
}
