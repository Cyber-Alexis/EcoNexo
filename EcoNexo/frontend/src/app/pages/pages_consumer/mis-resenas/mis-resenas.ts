import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

export interface Review {
  id: number;
  type: 'product' | 'business';
  rating: number;
  comment: string | null;
  created_at: string;
  product_id?: number;
  product_name?: string;
  business_id?: number;
  business_name?: string;
}

export interface PendingReview {
  type: 'product' | 'business';
  product_id?: number;
  product_name?: string;
  business_id?: number;
  business_name?: string;
  order_id: number;
}

@Component({
  selector: 'app-mis-resenas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './mis-resenas.html',
  styleUrl: './mis-resenas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisResenas implements OnInit {
  private http       = inject(HttpClient);
  private fb         = inject(FormBuilder);
  private router     = inject(Router);
  private authService = inject(AuthService);
  private ngZone     = inject(NgZone);
  private cdr        = inject(ChangeDetectorRef);
  private base = environment.apiUrl;

  activeTab    = signal<'written' | 'pending'>('written');

  reviews   = signal<Review[]>([]);
  pending   = signal<PendingReview[]>([]);
  loading   = signal(true);
  avgRating = signal(0);

  // Edit modal
  editingReview = signal<Review | null>(null);
  editSaving    = signal(false);
  editError     = signal('');
  editForm = this.fb.group({
    rating:  [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(1000)]],
  });

  // New review modal (from pending)
  creatingReview = signal<PendingReview | null>(null);
  createSaving   = signal(false);
  createError    = signal('');
  createForm = this.fb.group({
    rating:  [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(1000)]],
  });

  // Delete confirm
  deletingReview = signal<Review | null>(null);
  deleteLoading  = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.http.get<{ reviews: Review[]; avg_rating: number }>(`${this.base}/resenas`).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.reviews.set(res.reviews);
          this.avgRating.set(res.avg_rating);
          this.loading.set(false);
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        });
      },
    });

    this.http.get<{ pending: PendingReview[] }>(`${this.base}/resenas/pendientes`).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.pending.set(res.pending);
          this.cdr.markForCheck();
        });
      },
    });
  }

  starsArray(n: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  ratingToLabel(n: number): string {
    if (n >= 5) return 'Excelente';
    if (n >= 4) return 'Bueno';
    if (n >= 3) return 'Regular';
    if (n >= 2) return 'Malo';
    return 'Muy malo';
  }

  // ── Edit ──────────────────────────────────────────────
  openEdit(review: Review): void {
    this.editingReview.set(review);
    this.editError.set('');
    this.editForm.patchValue({ rating: review.rating, comment: review.comment ?? '' });
  }

  closeEdit(): void {
    this.editingReview.set(null);
  }

  setEditRating(star: number): void {
    this.editForm.patchValue({ rating: star });
  }

  onSaveEdit(): void {
    if (!this.editingReview() || this.editSaving()) return;
    this.editSaving.set(true);
    this.editError.set('');

    const { rating, comment } = this.editForm.value;
    const r = this.editingReview()!;
    const url = r.type === 'product'
      ? `${this.base}/resenas/producto/${r.id}`
      : `${this.base}/resenas/negocio/${r.id}`;

    this.http.put<{ review: any }>(url, { rating, comment }).subscribe({
      next: () => {
        this.editSaving.set(false);
        this.editingReview.set(null);
        this.load();
      },
      error: (err) => {
        this.editSaving.set(false);
        this.editError.set(err?.error?.message ?? 'Error al guardar.');
      },
    });
  }

  // ── Delete ────────────────────────────────────────────
  openDelete(review: Review): void {
    this.deletingReview.set(review);
  }

  closeDelete(): void {
    this.deletingReview.set(null);
  }

  onConfirmDelete(): void {
    if (!this.deletingReview() || this.deleteLoading()) return;
    this.deleteLoading.set(true);

    const r = this.deletingReview()!;
    const url = r.type === 'product'
      ? `${this.base}/resenas/producto/${r.id}`
      : `${this.base}/resenas/negocio/${r.id}`;

    this.http.delete(url).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.deletingReview.set(null);
        this.load();
      },
      error: () => { this.deleteLoading.set(false); },
    });
  }

  // ── Create (from pending) ─────────────────────────────
  openCreate(item: PendingReview): void {
    this.creatingReview.set(item);
    this.createError.set('');
    this.createForm.reset({ rating: 5, comment: '' });
  }

  closeCreate(): void {
    this.creatingReview.set(null);
  }

  setCreateRating(star: number): void {
    this.createForm.patchValue({ rating: star });
  }

  onSubmitCreate(): void {
    if (!this.creatingReview() || this.createSaving()) return;
    this.createSaving.set(true);
    this.createError.set('');

    const { rating, comment } = this.createForm.value;
    const item = this.creatingReview()!;

    const url  = item.type === 'product'
      ? `${this.base}/resenas/producto`
      : `${this.base}/resenas/negocio`;
    const body = item.type === 'product'
      ? { product_id: item.product_id, rating, comment }
      : { business_id: item.business_id, rating, comment };

    this.http.post(url, body).subscribe({
      next: () => {
        this.createSaving.set(false);
        this.creatingReview.set(null);
        this.load();
        this.activeTab.set('written');
      },
      error: (err) => {
        this.createSaving.set(false);
        this.createError.set(err?.error?.message ?? 'Error al enviar la reseña.');
      },
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
