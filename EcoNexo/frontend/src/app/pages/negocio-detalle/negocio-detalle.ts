import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { BusinessService } from '../../core/services/business.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiBusiness, ApiImage, ApiProduct } from '../../core/models/business.model';
import { getMainImageUrl, getGalleryImageUrl, getProductImageUrl, sortedBusinessImages } from '../../core/utils/image.utils';
import { environment } from '../../../environments/environment';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-negocio-detalle',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './negocio-detalle.html',
  styleUrl: './negocio-detalle.css',
})
export class NegocioDetalle implements OnInit, OnDestroy {
  business: ApiBusiness | null = null;
  loading = true;
  error = false;
  liked = false;
  showAllPhotos = false;
  activeTab: 'desc' | 'galeria' | 'productos' | 'mapa' | 'comentarios' = 'desc';
  expandedReviews = new Set<number>();

  // Write review form
  reviewOpen     = false;
  reviewRating   = 5;
  reviewComment  = '';
  reviewSaving   = false;
  reviewError    = '';
  reviewSuccess  = false;

  private http        = inject(HttpClient);
  private authService = inject(AuthService);
  private base        = environment.apiUrl;

  // Polling disabled for better stability (business details don't change frequently)
  private readonly POLLING_INTERVAL = 0; // Desactivado
  private pollingSubscription?: Subscription;
  private businessId: string = '';

  constructor(
    private route: ActivatedRoute,
    private businessService: BusinessService,
    private sanitizer: DomSanitizer,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('id') ?? '';
    
    // Initial load
    this.loadBusiness();
    
    // Setup polling if enabled
    if (this.POLLING_INTERVAL > 0 && this.businessId) {
      this.pollingSubscription = interval(this.POLLING_INTERVAL)
        .pipe(switchMap(() => this.businessService.getById(this.businessId)))
        .subscribe({
          next: (data) => {
            this.business = data;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Polling error:', err);
          }
        });
    }
  }
  
  ngOnDestroy(): void {
    // Clean up polling subscription
    this.pollingSubscription?.unsubscribe();
  }
  
  private loadBusiness(): void {
    if (!this.businessId) return;
    
    this.businessService.getById(this.businessId).subscribe({
      next: (data) => {
        this.business = data;
        this.loading = false;
        this.cdr.detectChanges(); // Force change detection
      },
      error: (err) => {
        console.error('Error loading business:', err);
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  toggleLike() {
    this.liked = !this.liked;
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

  get galleryPreview(): ApiImage[] {
    return this.business?.images.slice(0, 4) ?? [];
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

  get sortedGalleryImages(): ApiImage[] {
    return sortedBusinessImages(this.business?.images ?? []);
  }

  get businessCategories(): string[] {
    if (!this.business) return [];
    return this.business.categories.map(cat => cat.name).slice(0, 3);
  }

  private quantities = new Map<number, number>();

  getQty(id: number): number {
    return this.quantities.get(id) ?? 1;
  }

  incrementQty(id: number): void {
    this.quantities.set(id, this.getQty(id) + 1);
  }

  decrementQty(id: number): void {
    const curr = this.getQty(id);
    if (curr > 1) this.quantities.set(id, curr - 1);
  }

  addToCart(product: ApiProduct): void {
    const qty = this.getQty(product.id);
    this.cartService.addItem({
      productId: product.id,
      businessId: this.business?.id ?? 0,
      name: product.name,
      price: Number(product.price),
      priceUnit: this.getDisplayPriceUnit(product),
      img: this.productImage(product.images),
      business: this.business?.name ?? 'Negocio',
      openingHours: this.business?.opening_hours ?? undefined,
    }, qty);
    this.quantities.set(product.id, 1);
    this.cartService.open();
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

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  openReviewForm(): void {
    this.reviewOpen    = true;
    this.reviewRating  = 5;
    this.reviewComment = '';
    this.reviewError   = '';
  }

  closeReviewForm(): void {
    this.reviewOpen = false;
  }

  setReviewRating(n: number): void {
    this.reviewRating = n;
  }

  ratingToLabel(n: number): string {
    if (n >= 5) return 'Excelente';
    if (n >= 4) return 'Bueno';
    if (n >= 3) return 'Regular';
    if (n >= 2) return 'Malo';
    return 'Muy malo';
  }

  submitReview(): void {
    if (!this.business || this.reviewSaving) return;
    this.reviewSaving = true;
    this.reviewError  = '';

    this.http.post(`${this.base}/resenas/negocio`, {
      business_id: this.business.id,
      rating:      this.reviewRating,
      comment:     this.reviewComment || null,
    }).subscribe({
      next: () => {
        this.reviewSaving  = false;
        this.reviewOpen    = false;
        this.reviewSuccess = true;
        this.loadBusiness();
      },
      error: (err) => {
        this.reviewSaving = false;
        this.reviewError  = err?.error?.message ?? 'Error al publicar la reseña.';
      },
    });
  }
}
