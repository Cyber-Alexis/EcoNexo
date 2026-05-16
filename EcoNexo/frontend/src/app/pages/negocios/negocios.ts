import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../core/services/business.service';
import { ApiBusinessListItem } from '../../core/models/business.model';
import { getMainImageUrl } from '../../core/utils/image.utils';
import { BehaviorSubject, Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-negocios',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './negocios.html',
  styleUrl: './negocios.css',
})
export class Negocios implements OnInit, OnDestroy {
  searchQuery = '';
  selectedFilter = 'Todas';
  selectedSort = 'rating-desc';
  loading = true;
  error = false;

  // Reactive state with BehaviorSubject
  private businessesSubject = new BehaviorSubject<ApiBusinessListItem[]>([]);
  private destroy$ = new Subject<void>();

  businesses: ApiBusinessListItem[] = [];
  filteredBusinesses: ApiBusinessListItem[] = [];
  
  // Polling configuration (90 segundos para negocios)
  private readonly POLLING_INTERVAL = 90000;

  constructor(
    private businessService: BusinessService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Initial load - get all businesses at once
    this.loadBusinesses();
    
    // Suscribirse al BehaviorSubject para actualizaciones reactivas
    this.businessesSubject.pipe(takeUntil(this.destroy$)).subscribe(businesses => {
      this.businesses = businesses;
      this.applyFilters();
    });
    
    // Iniciar polling automático cada 90 segundos
    interval(this.POLLING_INTERVAL).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.businessService.getAll())
    ).subscribe({
      next: (data) => {
        this.businessesSubject.next(data);
      },
      error: (err) => console.error('Polling error:', err)
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadBusinesses(): void {
    this.businessService.getAll().subscribe({
      next: (data) => {
        // Actualizar BehaviorSubject (esto dispara la reactividad)
        this.businessesSubject.next(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading businesses:', err);
        this.error = true;
        this.businessesSubject.next([]);
        this.filteredBusinesses = [];
        this.loading = false;
        this.syncView();
      },
    });
  }

  get categories(): string[] {
    const cats = new Set<string>();
    this.businesses.forEach(b => b.categories?.forEach(c => cats.add(c.name)));
    return ['Todas', ...Array.from(cats).sort()];
  }

  filterByCategory(category: string) {
    this.selectedFilter = category;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.businesses];

    if (this.selectedFilter !== 'Todas') {
      filtered = filtered.filter(b =>
        b.categories?.some(c => c.name === this.selectedFilter)
      );
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(query) ||
        (b.description ?? '').toLowerCase().includes(query) ||
        b.city.toLowerCase().includes(query)
      );
    }

    switch (this.selectedSort) {
      case 'reviews-desc':
        filtered.sort((a, b) => b.reviews_count - a.reviews_count);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        break;
      default:
        filtered.sort(
          (a, b) =>
            (b.reviews_avg_rating ?? 0) - (a.reviews_avg_rating ?? 0) ||
            b.reviews_count - a.reviews_count
        );
        break;
    }

    this.filteredBusinesses = filtered;
    this.syncView();
  }

  onSearchChange() {
    this.applyFilters();
  }

  get hasActiveCriteria(): boolean {
    return this.searchQuery.trim().length > 0 || this.selectedFilter !== 'Todas';
  }

  get hasNoBusinessesAvailable(): boolean {
    return !this.loading && this.businesses.length === 0;
  }

  get showLoadingState(): boolean {
    return this.loading;
  }

  get showResultsCount(): boolean {
    return !this.loading && this.filteredBusinesses.length > 0;
  }

  get showEmptyState(): boolean {
    return !this.loading && this.filteredBusinesses.length === 0;
  }

  get emptyStateMessage(): string {
    if (this.hasNoBusinessesAvailable) {
      return 'No hay negocios disponibles en este momento.';
    }

    if (this.hasActiveCriteria) {
      return 'No se encontraron negocios con los criterios de búsqueda.';
    }

    return 'No hay negocios disponibles en este momento.';
  }

  businessImage(b: ApiBusinessListItem): string {
    return getMainImageUrl(b.images ?? []);
  }

  private syncView(): void {
    this.cdr.detectChanges();
  }
}

