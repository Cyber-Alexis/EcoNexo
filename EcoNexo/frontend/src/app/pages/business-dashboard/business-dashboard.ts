import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { timeout } from 'rxjs/operators';
import { ApiBusiness } from '../../core/models/business.model';
import { AuthService } from '../../core/services/auth.service';
import { BusinessService } from '../../core/services/business.service';

@Component({
  selector: 'app-business-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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
  uploadingMain = false;
  uploadingGallery = false;
  successMessage = '';
  errorMessage = '';
  syncMessage = '';
  businessId: number | null = null;
  mainImageUrl: string | null = null;
  galleryImageUrls: string[] = [];

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

  get imagePreview(): string | null {
    return this.mainImageUrl;
  }

  get galleryPreviewSlots(): Array<string | null> {
    return this.gallerySlots.map((index) => this.galleryImageUrls[index] ?? null);
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
    this.mainImageUrl = business.images.find((image) => image.type === 'main')?.path ?? null;
    this.galleryImageUrls = business.images
      .filter((image) => image.type !== 'main')
      .map((image) => image.path)
      .slice(0, 6);

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

    this.businessService.getMine().pipe(timeout(8000)).subscribe({
      next: (business) => {
        this.applyBusinessData(business);
        this.syncing = false;
        this.syncMessage = '';
      },
      error: (err) => {
        this.syncing = false;
        this.syncMessage = 'No se pudo sincronizar ahora mismo, pero puedes editar y guardar tus datos.';
        this.errorMessage = err?.error?.message || '';
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

    if (type === 'main') {
      this.uploadingMain = true;
    } else {
      this.uploadingGallery = true;
    }

    this.businessService.uploadImages(files, type).subscribe({
      next: (response) => {
        this.applyBusinessData(response.business);
        this.uploadingMain = false;
        this.uploadingGallery = false;
        this.successMessage = response.message || 'Imágenes actualizadas correctamente.';
      },
      error: (err) => {
        this.uploadingMain = false;
        this.uploadingGallery = false;
        this.errorMessage = err?.error?.message || 'No se pudieron subir las imágenes.';
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
