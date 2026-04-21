import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BusinessService } from '../../core/services/business.service';
import { ApiBusinessListItem } from '../../core/models/business.model';
import { getMainImageUrl } from '../../core/utils/image.utils';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  businesses: ApiBusinessListItem[] = [];
  private static cachedBusinesses: ApiBusinessListItem[] | null = null;
  loading = true;

  constructor(
    private businessService: BusinessService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Load from cache if available (instant)
    if (Home.cachedBusinesses) {
      this.updateTopBusinesses(Home.cachedBusinesses);
      this.loading = false;
      this.cdr.detectChanges(); // Force change detection for synchronous cache load
      return;
    }

    // Otherwise load from API (first time only)
    this.businessService.getAll().subscribe({
      next: (data) => {
        // Store in cache for future visits
        Home.cachedBusinesses = data;
        this.updateTopBusinesses(data);
        this.loading = false;
        this.cdr.detectChanges(); // Ensure all changes are reflected
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private updateTopBusinesses(data: ApiBusinessListItem[]): void {
    // Sort by rating (highest first) and take top 4
    const sortedByRating = [...data].sort((a, b) => {
      const ratingA = a.reviews_avg_rating ?? 0;
      const ratingB = b.reviews_avg_rating ?? 0;
      
      // Primary sort: by rating descending
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      
      // Secondary sort: by number of reviews descending
      return b.reviews_count - a.reviews_count;
    });
    
    this.businesses = sortedByRating.slice(0, 4);
    
    // Force Angular to detect changes and update the view
    this.cdr.detectChanges();
  }

  businessImage(b: ApiBusinessListItem): string {
    return getMainImageUrl(b.images ?? []);
  }
}

