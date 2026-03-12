import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BusinessService } from '../../core/services/business.service';
import { ApiBusiness, ApiImage } from '../../core/models/business.model';

@Component({
  selector: 'app-negocio-detalle',
  imports: [CommonModule, RouterLink],
  templateUrl: './negocio-detalle.html',
  styleUrl: './negocio-detalle.css',
})
export class NegocioDetalle implements OnInit {
  business: ApiBusiness | null = null;
  loading = true;
  error = false;
  liked = false;
  showAllPhotos = false;
  activeTab: 'desc' | 'productos' | 'mapa' | 'comentarios' = 'desc';

  constructor(
    private route: ActivatedRoute,
    private businessService: BusinessService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.businessService.getById(id).subscribe({
      next: (data) => {
        this.business = data;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
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
    const r = this.avgRating;
    if (r >= 4.5) return 'Muy positivas';
    if (r >= 3.5) return 'Positivas';
    if (r >= 2.5) return 'Regulares';
    return 'Negativas';
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
    return images?.[0]?.path ?? 'https://placehold.co/80x80?text=Sin+imagen';
  }

  mainGalleryImage(): string {
    return this.business?.images?.[0]?.path ?? 'https://placehold.co/800x450?text=Sin+imagen';
  }
}
