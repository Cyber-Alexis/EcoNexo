import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, interval, takeUntil, startWith } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { BusinessSidebar } from '../business-sidebar/business-sidebar';

// Declaración global para Google Translate
declare const google: any;

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
  imports: [CommonModule, FormsModule, BusinessSidebar],
  templateUrl: './estadisticas-productor.html',
  styleUrl: './estadisticas-productor.css',
})

export class EstadisticasProductor implements OnInit, AfterViewInit, OnDestroy {
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

  loading   = true;
  data: StatsData | null = null;
  reviewsMaxHeight: number | null = null;

  @ViewChild('chartCard')
  private chartCardRef?: ElementRef<HTMLElement>;

  private chartResizeObserver?: ResizeObserver;

  readonly periodLabel = 'Último mes';

  // Language translation
  currentLanguage = 'es';

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
    interval(30_000)
      .pipe(startWith(0), takeUntil(this.destroy$))
      .subscribe(() => this.loadStats());
  }

  ngAfterViewInit(): void {
    this.setupChartHeightSync();
  }

  ngOnDestroy(): void {
    this.chartResizeObserver?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncReviewsMaxHeight();
  }

  loadStats(): void {
    this.http.get<StatsData>(`${this.base}/mis-estadisticas`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => {
          this.data    = d;
          this.loading = false;
          this.cdr.markForCheck();
          requestAnimationFrame(() => this.setupChartHeightSync());
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private setupChartHeightSync(): void {
    const chartEl = this.chartCardRef?.nativeElement;
    if (!chartEl) {
      this.reviewsMaxHeight = null;
      this.cdr.markForCheck();
      return;
    }

    this.chartResizeObserver?.disconnect();
    this.chartResizeObserver = new ResizeObserver(() => this.syncReviewsMaxHeight());
    this.chartResizeObserver.observe(chartEl);
    this.syncReviewsMaxHeight();
  }

  private syncReviewsMaxHeight(): void {
    const chartEl = this.chartCardRef?.nativeElement;
    if (!chartEl || window.innerWidth <= 792) {
      if (this.reviewsMaxHeight !== null) {
        this.reviewsMaxHeight = null;
        this.cdr.markForCheck();
      }
      return;
    }

    const chartHeight = Math.round(chartEl.getBoundingClientRect().height);
    if (chartHeight > 0 && chartHeight !== this.reviewsMaxHeight) {
      this.reviewsMaxHeight = chartHeight;
      this.cdr.markForCheck();
    }
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
}
