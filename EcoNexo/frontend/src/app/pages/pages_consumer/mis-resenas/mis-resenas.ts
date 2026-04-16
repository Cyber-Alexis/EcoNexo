import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, computed, inject, OnInit, signal } from '@angular/core';
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
  readonly avgRating = computed(() => {
    const r = this.reviews();
    if (!r.length) return 0;
    return Math.round(r.reduce((s, rev) => s + rev.rating, 0) / r.length * 10) / 10;
  });

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
      next: (res) => this.ngZone.run(() => {
        this.reviews.set(res.reviews);
        this.loading.set(false);
        this.cdr.markForCheck();
      }),
      error: () => this.ngZone.run(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }),
    });

    this.http.get<{ pending: PendingReview[] }>(`${this.base}/resenas/pendientes`).subscribe({
      next: (res) => this.ngZone.run(() => {
        this.pending.set(res.pending);
        this.cdr.markForCheck();
      }),
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

    const { rating, comment } = this.editForm.value;
    const r = this.editingReview()!;

    // Optimistic: update locally right away
    const updated: Review = { ...r, rating: rating!, comment: comment ?? null };
    this.reviews.update(list => list.map(rev =>
      rev.id === r.id && rev.type === r.type ? updated : rev
    ));
    this.editingReview.set(null);
    this.editError.set('');
    this.cdr.markForCheck();

    const url = r.type === 'product'
      ? `${this.base}/resenas/producto/${r.id}`
      : `${this.base}/resenas/negocio/${r.id}`;

    this.http.put<{ review: any }>(url, { rating, comment }).subscribe({
      error: (err) => {
        // Rollback on failure
        this.reviews.update(list => list.map(rev =>
          rev.id === r.id && rev.type === r.type ? r : rev
        ));
        this.editingReview.set(r);
        this.editError.set(err?.error?.message ?? 'Error al guardar. Los cambios se han revertido.');
        this.cdr.markForCheck();
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

    const r = this.deletingReview()!;

    // Optimistic: remove immediately
    this.reviews.update(list => list.filter(rev =>
      !(rev.id === r.id && rev.type === r.type)
    ));
    this.deletingReview.set(null);
    this.cdr.markForCheck();

    const url = r.type === 'product'
      ? `${this.base}/resenas/producto/${r.id}`
      : `${this.base}/resenas/negocio/${r.id}`;

    this.http.delete(url).subscribe({
      error: () => {
        // Rollback on failure
        this.reviews.update(list =>
          [...list, r].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );
        this.cdr.markForCheck();
      },
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

    const { rating, comment } = this.createForm.value;
    const item = this.creatingReview()!;

    // Optimistic: add new review and remove from pending immediately
    const tempId = -Date.now();
    const optimistic: Review = {
      id: tempId,
      type: item.type,
      rating: rating!,
      comment: comment ?? null,
      created_at: new Date().toISOString(),
      ...(item.type === 'product'
        ? { product_id: item.product_id, product_name: item.product_name }
        : { business_id: item.business_id, business_name: item.business_name }),
    };
    this.reviews.update(list => [optimistic, ...list]);
    this.pending.update(list => list.filter(p =>
      !(p.type === item.type && p.order_id === item.order_id &&
        (item.type === 'product' ? p.product_id === item.product_id : p.business_id === item.business_id))
    ));
    this.creatingReview.set(null);
    this.createError.set('');
    this.activeTab.set('written');
    this.cdr.markForCheck();

    const url  = item.type === 'product'
      ? `${this.base}/resenas/producto`
      : `${this.base}/resenas/negocio`;
    const body = item.type === 'product'
      ? { product_id: item.product_id, rating, comment }
      : { business_id: item.business_id, rating, comment };

    this.http.post<{ review: any }>(url, body).subscribe({
      next: (res) => {
        // Replace temp id with real id from backend
        if (res?.review?.id) {
          this.reviews.update(list => list.map(rev =>
            rev.id === tempId ? { ...rev, id: res.review.id } : rev
          ));
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        // Rollback
        this.reviews.update(list => list.filter(rev => rev.id !== tempId));
        this.pending.update(list => [...list, item]);
        this.creatingReview.set(item);
        this.createError.set(err?.error?.message ?? 'Error al enviar la reseña.');
        this.activeTab.set('pending');
        this.cdr.markForCheck();
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
