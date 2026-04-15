import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { finalize, timeout } from 'rxjs/operators';
import { ApiBusiness, ApiImage } from '../../../core/models/business.model';
import { AuthService } from '../../../core/services/auth.service';
import { BusinessService } from '../../../core/services/business.service';

const BUSINESS_REQUEST_TIMEOUT_MS = 30_000;

@Component({
  selector: 'app-business-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './business-dashboard.html',
  styleUrl: './business-dashboard.css',
})
export class BusinessDashboard implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly businessService = inject(BusinessService);

  activeTab: 'informacion' | 'horarios' | 'imagenes' = 'informacion';
  syncing = false;
  saving = false;
  successMessage = '';
  errorMessage = '';
  syncMessage = '';
  businessId: number | null = null;

  private readonly uploadingMainSubject = new BehaviorSubject<boolean>(false);
  private readonly uploadingGallerySubject = new BehaviorSubject<boolean>(false);
  private readonly mainImageSubject = new BehaviorSubject<ApiImage | null>(null);
  private readonly galleryPreviewSlotsSubject = new BehaviorSubject<Array<ApiImage | null>>([]);

  readonly uploadingMain$ = this.uploadingMainSubject.asObservable();
  readonly uploadingGallery$ = this.uploadingGallerySubject.asObservable();
  readonly mainImage$ = this.mainImageSubject.asObservable();
  readonly galleryPreviewSlots$ = this.galleryPreviewSlotsSubject.asObservable();

  readonly gallerySlots = Array.from({ length: 6 }, (_, index) => index);

  readonly categoryOptions = [
    'Productos Ecológicos',
    'Frutas y Verduras',
    'Pan y Pastelería',
    'Lácteos',
    'Carnes y Embutidos',
    'Bebidas',
    'Artesanal',
    'Local',
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    category_name: ['', [Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(500)]],
    address: ['', [Validators.maxLength(255)]],
    city: ['', [Validators.maxLength(100)]],
    postal_code: ['', [Validators.maxLength(20)]],
    phone: ['', [Validators.maxLength(30)]],
    email: ['', [Validators.required, Validators.email]],
    website: ['', [Validators.maxLength(255)]],
    opening_hours: ['', [Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    this.prefillFromSession();
    this.loadBusiness();
  }

  get businessHeaderName(): string {
    return this.form.value.name?.trim() || this.authService.getUser()?.business_name?.trim() || 'Mi Negocio';
  }

  get contactPersonName(): string {
    const user = this.authService.getUser();
    return [user?.name, user?.last_name].filter(Boolean).join(' ').trim() || 'Sin asignar';
  }

  get descriptionLength(): number {
    return this.form.value.description?.length ?? 0;
  }

  private prefillFromSession(): void {
    const currentUser = this.authService.getUser();

    this.form.patchValue({
      name: currentUser?.business_name ?? '',
      email: currentUser?.email ?? '',
      phone: currentUser?.phone ?? '',
      address: currentUser?.address ?? '',
      city: currentUser?.city ?? '',
      postal_code: currentUser?.postal_code ?? '',
    });
  }

  private applyBusinessData(business: ApiBusiness): void {
    this.businessId = business.id;
    const mainImage = business.images.find((image) => image.type === 'main') ?? null;
    const galleryImages = business.images.filter((image) => image.type !== 'main').slice(0, 6);

    this.mainImageSubject.next(mainImage);
    this.galleryPreviewSlotsSubject.next(this.gallerySlots.map((index) => galleryImages[index] ?? null));

    this.form.patchValue({
      name: business.name ?? this.form.value.name ?? '',
      category_name: business.categories?.[0]?.name ?? '',
      description: business.description ?? '',
      address: business.address ?? '',
      city: business.city ?? '',
      postal_code: business.postal_code ?? '',
      phone: business.phone ?? '',
      email: business.user?.email ?? this.form.value.email ?? '',
      website: business.website ?? '',
      opening_hours: business.opening_hours ?? '',
    });
  }

  private loadBusiness(): void {
    this.syncing = true;
    this.syncMessage = 'Sincronizando la información guardada de tu negocio...';

    this.businessService.getMine().pipe(timeout(BUSINESS_REQUEST_TIMEOUT_MS)).subscribe({
      next: (business) => {
        this.applyBusinessData(business);
        this.syncing = false;
        this.syncMessage = '';
      },
      error: (err) => {
        this.syncing = false;
        this.syncMessage = 'No se pudo sincronizar ahora mismo, pero puedes editar y guardar tus datos.';
        this.errorMessage = err?.error?.message || 'No se pudo cargar la informacion actual del negocio.';
      },
    });
  }

  onSave(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const raw = this.form.getRawValue();

    this.businessService.updateMine({
      name: raw.name?.trim() || this.authService.getUser()?.business_name?.trim() || 'Mi negocio',
      category_name: raw.category_name?.trim() || null,
      description: raw.description?.trim() || null,
      address: raw.address?.trim() || null,
      city: raw.city?.trim() || null,
      postal_code: raw.postal_code?.trim() || null,
      phone: raw.phone?.trim() || null,
      email: raw.email?.trim() || null,
      website: raw.website?.trim() || null,
      opening_hours: raw.opening_hours?.trim() || null,
    }).subscribe({
      next: (response) => {
        this.saving = false;
        this.applyBusinessData(response.business);
        this.authService.patchUser({
          email: raw.email?.trim() || undefined,
          phone: raw.phone?.trim() || undefined,
          address: raw.address?.trim() || undefined,
          city: raw.city?.trim() || undefined,
          postal_code: raw.postal_code?.trim() || undefined,
          business_id: response.business.id,
          business_name: response.business.name,
        });
        this.successMessage = 'Cambios guardados correctamente.';
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'No se pudieron guardar los cambios.';
      },
    });
  }

  onMainImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.uploadImages([file], 'main');
    input.value = '';
  }

  onGalleryImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files?.length) {
      return;
    }

    this.uploadImages(Array.from(files), 'gallery');
    input.value = '';
  }

  private uploadImages(files: File[], type: 'main' | 'gallery'): void {
    this.errorMessage = '';
    this.successMessage = '';

    const isMain = type === 'main';

    if (isMain) {
      this.uploadingMainSubject.next(true);
    } else {
      this.uploadingGallerySubject.next(true);
    }

    this.businessService.uploadImages(files, type).pipe(
      finalize(() => {
        if (isMain) {
          this.uploadingMainSubject.next(false);
        } else {
          this.uploadingGallerySubject.next(false);
        }
      }),
    ).subscribe({
      next: (response) => {
        this.applyBusinessData(response.business);
        this.successMessage = response.message || 'Imágenes actualizadas correctamente.';
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No se pudieron subir las imágenes.';
      },
    });
  }

  onRemoveMainImage(event: Event): void {
    event.stopPropagation();

    const mainImage = this.mainImageSubject.value;

    if (!mainImage?.id) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.uploadingMainSubject.next(true);

    this.businessService.deleteImage(mainImage.id).pipe(
      finalize(() => this.uploadingMainSubject.next(false)),
    ).subscribe({
      next: (response) => {
        this.applyBusinessData(response.business);
        this.successMessage = response.message || 'Imagen eliminada correctamente.';
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No se pudo eliminar la imagen.';
      },
    });
  }

  onRemoveGalleryImage(imageId: number, event: Event): void {
    event.stopPropagation();

    this.errorMessage = '';
    this.successMessage = '';
    this.uploadingGallerySubject.next(true);

    this.businessService.deleteImage(imageId).pipe(
      finalize(() => this.uploadingGallerySubject.next(false)),
    ).subscribe({
      next: (response) => {
        this.applyBusinessData(response.business);
        this.successMessage = response.message || 'Imagen eliminada correctamente.';
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No se pudo eliminar la imagen.';
      },
    });
  }

  viewPublicProfile(): void {
    const publicBusinessId = this.businessId ?? this.authService.getUser()?.business_id ?? null;

    if (publicBusinessId) {
      this.router.navigate(['/negocios', publicBusinessId]);
      return;
    }

    this.router.navigate(['/negocios']);
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
