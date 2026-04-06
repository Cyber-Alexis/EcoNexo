import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../core/services/business.service';
import { ApiBusinessListItem } from '../../core/models/business.model';

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

  businesses: ApiBusinessListItem[] = [];
  filteredBusinesses: ApiBusinessListItem[] = [];

  constructor(
    private businessService: BusinessService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Initial load - get all businesses at once
    this.loadBusinesses();
  }
  
  ngOnDestroy(): void {
    // Clean up if needed
  }
  
  private loadBusinesses(): void {
    this.businessService.getAll().subscribe({
      next: (data) => {
        this.businesses = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading businesses:', err);
        this.error = true;
        this.loading = false;
      },
    });
  }
  
  private updateBusinessesData(data: ApiBusinessListItem[]): void {
    this.businesses = data;
    this.applyFilters();
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
    
    // Force Angular to detect changes and update the view
    this.cdr.detectChanges();
  }

  onSearchChange() {
    this.applyFilters();
  }

  businessImage(b: ApiBusinessListItem): string {
    return b.images?.[0]?.path ?? 'https://placehold.co/500x300?text=Sin+imagen';
  }
}

