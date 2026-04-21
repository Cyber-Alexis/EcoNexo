import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { BusinessService } from '../../../core/services/business.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiBusiness, ApiImage, ApiProduct } from '../../../core/models/business.model';
import { getMainImageUrl, getGalleryImageUrl, getProductImageUrl } from '../../../core/utils/image.utils';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import { BusinessSidebar } from '../business-sidebar/business-sidebar';

@Component({
  selector: 'app-vista-negocio',
  standalone: true,
  imports: [CommonModule, FormsModule, BusinessSidebar],
  templateUrl: './vista-negocio.html',
  styleUrl: './vista-negocio.css',
})
export class VistaNegocio implements OnInit {
  business: ApiBusiness | null = null;
  loading = true;
  error = false;
  activeTab: 'desc' | 'galeria' | 'productos' | 'mapa' | 'comentarios' = 'desc';
  expandedReviews = new Set<number>();
  productQuantities = new Map<number, number>();

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private businessService = inject(BusinessService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadMyBusiness();
  }

  get businessHeaderName(): string {
    return this.business?.name?.trim() || this.authService.getUser()?.business_name?.trim() || 'Mi Negocio';
  }

  private loadMyBusiness(): void {
    this.businessService.getMine().subscribe({
      next: (data) => {
        // Ensure products and reviews arrays exist
        if (!data.products) {
          data.products = [];
        }
        if (!data.reviews) {
          data.reviews = [];
        }
        this.business = data;
        this.loading = false;
        console.log('Business loaded:', this.business);
        console.log('Products count:', this.business.products?.length || 0);
        console.log('Reviews count:', this.business.reviews?.length || 0);
        this.cdr.detectChanges(); // Force change detection
      },
      error: (err) => {
        console.error('Error loading business:', err);
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges(); // Force change detection
      },
    });
  }

  getRatingStars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  get avgRating(): number {
    return this.business?.reviews_avg_rating ?? 0;
  }

  get ratingLabel(): string {
    if (!this.business?.reviews_count) return 'Sin valoraciones aún';
    return this.ratingToLabel(Math.round(this.avgRating));
  }

  get ratingLabelColor(): string {
    if (!this.business?.reviews_count) return '#9CA3AF';
    const r = this.avgRating;
    if (r >= 4.5) return '#22C55E';
    if (r >= 3.5) return '#84CC16';
    if (r >= 2.5) return '#EAB308';
    if (r >= 1.5) return '#F97316';
    return '#EF4444';
  }

  get descParagraphs(): string[] {
    return (this.business?.description ?? '')
      .split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  get mapEmbedSafe(): SafeResourceUrl {
    const query = encodeURIComponent(
      `${this.business?.address ?? ''}, ${this.business?.city ?? ''}`,
    );
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://maps.google.com/maps?q=${query}&output=embed`,
    );
  }

  productImage(images: ApiImage[]): string {
    return getProductImageUrl(images);
  }

  mainGalleryImage(): string {
    return getMainImageUrl(this.business?.images ?? []);
  }

  galleryImage(image: ApiImage): string {
    return getGalleryImageUrl(image);
  }

  get businessCategories(): string[] {
    if (!this.business) return [];
    return this.business.categories.map(cat => cat.name).slice(0, 3);
  }

  getDisplayPriceUnit(product: { price_unit?: string | null; category?: { name: string } | null }): string {
    const directUnit = product.price_unit?.trim();
    if (directUnit) {
      return directUnit;
    }

    const categoryName = product.category?.name?.trim().toLowerCase() ?? '';

    if (['frutas', 'verdures', 'fruits secs', 'vedella', 'porc', 'aus'].includes(categoryName)) {
      return 'kg';
    }

    if (['vins negres', 'vins blancs', 'caves i escumosos'].includes(categoryName)) {
      return 'botella';
    }

    if (categoryName === 'rams i bouquets') {
      return 'ramo';
    }

    return 'unidad';
  }

  formatUserName(user: { name: string; last_name: string }): string {
    const lastName = user.last_name?.charAt(0)?.toUpperCase() ?? '';
    return lastName ? `${user.name} ${lastName}.` : user.name;
  }

  getReviewText(review: { id: number; comment: string | null }, maxLength = 200): string {
    const text = review.comment ?? '';
    if (text.length <= maxLength || this.expandedReviews.has(review.id)) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  shouldShowReadMore(review: { id: number; comment: string | null }, maxLength = 200): boolean {
    const text = review.comment ?? '';
    return text.length > maxLength && !this.expandedReviews.has(review.id);
  }

  toggleExpandReview(reviewId: number): void {
    if (this.expandedReviews.has(reviewId)) {
      this.expandedReviews.delete(reviewId);
    } else {
      this.expandedReviews.add(reviewId);
    }
  }

  ratingToLabel(n: number): string {
    if (n >= 5) return 'Excelente';
    if (n >= 4) return 'Bueno';
    if (n >= 3) return 'Regular';
    if (n >= 2) return 'Malo';
    return 'Muy malo';
  }

  // ─── Product quantity controls (visual only) ───
  getQty(productId: number): number {
    return this.productQuantities.get(productId) ?? 1;
  }

  incrementQty(productId: number): void {
    const current = this.getQty(productId);
    this.productQuantities.set(productId, current + 1);
  }

  decrementQty(productId: number): void {
    const current = this.getQty(productId);
    if (current > 1) {
      this.productQuantities.set(productId, current - 1);
    }
  }

  goBack(): void {
    this.router.navigate(['/mi-negocio']);
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
