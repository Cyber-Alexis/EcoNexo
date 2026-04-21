import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { finalize, timeout } from 'rxjs/operators';
import { ApiBusiness, ApiImage } from '../../../core/models/business.model';
import { AuthService } from '../../../core/services/auth.service';
import { BusinessService } from '../../../core/services/business.service';
import { BusinessSidebar } from '../business-sidebar/business-sidebar';
import { CanComponentDeactivate } from '../../../core/interfaces/can-component-deactivate.interface';

const BUSINESS_REQUEST_TIMEOUT_MS = 30_000;

// Teléfono español: 9 dígitos empezando por 6, 7 o 9
const SPANISH_PHONE_PATTERN = /^[679]\d{8}$/;

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) return null; // Campo opcional
  const digits = value.replace(/\s/g, '');
  if (!SPANISH_PHONE_PATTERN.test(digits)) {
    return { invalidPhone: true };
  }
  return null;
}

// Código postal español: 5 dígitos (01000-52999)
function postalCodeValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) return null; // Campo opcional
  if (!/^\d{5}$/.test(value)) {
    return { invalidPostalCode: true };
  }
  const num = parseInt(value, 10);
  if (num < 1000 || num > 52999) {
    return { postalCodeRange: true };
  }
  return null;
}

@Component({
  selector: 'app-mi-negocio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BusinessSidebar],
  templateUrl: './mi-negocio.html',
  styleUrl: './mi-negocio.css',
})
export class MiNegocio implements OnInit, CanComponentDeactivate {
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

  // Modo lectura/edición
  editMode = false;
  private originalFormValues: any = null;

  // Modal de confirmación al navegar fuera en modo edición
  showLeaveModal = false;
  private leaveDecision$ = new Subject<boolean>();

  // Modal de confirmación de logout + flag anti-spam
  showLogoutModal = false;
  isLoggingOut = false;

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
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    category_name: ['', [Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(500)]],
    address: ['', [Validators.maxLength(255)]],
    city: ['', [Validators.minLength(2), Validators.maxLength(100)]],
    postal_code: ['', [postalCodeValidator, Validators.maxLength(20)]],
    phone: ['', [phoneValidator, Validators.maxLength(30)]],
    contact_person_name: ['', [Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    opening_hours: ['', [Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    this.form.get('category_name')?.disable(); // modo lectura por defecto
    this.prefillFromSession();
    this.loadBusiness();
  }

  get businessHeaderName(): string {
    return this.form.value.name?.trim() || this.authService.getUser()?.business_name?.trim() || 'Mi Negocio';
  }

  get contactPersonName(): string {
    // Prioridad: 1) Valor del formulario, 2) Usuario logueado
    const formValue = this.form.value.contact_person_name?.trim();
    if (formValue) return formValue;
    
    const user = this.authService.getUser();
    return [user?.name, user?.last_name].filter(Boolean).join(' ').trim() || 'Sin asignar';
  }

  get descriptionLength(): number {
    return this.form.value.description?.length ?? 0;
  }

  // ──────────────────────────────────────────────────────────────
  // Validación y comparación de cambios
  // ──────────────────────────────────────────────────────────────

  /**
   * Comprueba si un campo tiene valor (no está vacío)
   */
  private hasValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  }

  /**
   * Normaliza un valor para comparación
   */
  private normalizeValue(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    return String(value).trim();
  }

  /**
   * Compara valor actual con valor original del backend
   * Retorna true si el valor ha cambiado realmente
   */
  isFieldChanged(field: string): boolean {
    if (!this.originalFormValues) return false;
    
    const currentValue = this.form.get(field)?.value;
    const originalValue = this.originalFormValues[field];
    
    // Normalizar ambos valores para comparación sensible
    const currentNormalized = this.normalizeValue(currentValue);
    const originalNormalized = this.normalizeValue(originalValue);
    
    return currentNormalized !== originalNormalized;
  }

  /**
   * Campo inválido: mostrar borde rojo si inválido y (touched o dirty)
   */
  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty));
  }

  /**
   * Campo válido: mostrar borde verde SOLO si:
   * - Está en modo edición
   * - Es válido
   * - Tiene valor (no vacío)
   * - Ha cambiado respecto al valor original del backend
   */
  isFieldValid(field: string): boolean {
    if (!this.editMode) return false; // Nunca verde en modo lectura
    
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.valid) return false;
    
    const currentValue = ctrl.value;
    if (!this.hasValue(currentValue)) return false; // No verde si está vacío
    
    return this.isFieldChanged(field); // Solo verde si cambió realmente
  }

  getErrorMessage(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !(ctrl.touched || ctrl.dirty) || !ctrl.errors) return '';
    const err = ctrl.errors;

    // Errores comunes
    if (err['required']) return 'Este campo es obligatorio';
    if (err['minlength']) return `Mínimo ${err['minlength'].requiredLength} caracteres`;
    if (err['maxlength']) return `Máximo ${err['maxlength'].requiredLength} caracteres`;
    if (err['email']) return 'Formato de email inválido';

    // Errores específicos por campo
    if (err['invalidPhone']) return 'Teléfono debe tener 9 dígitos y empezar por 6, 7 o 9';
    if (err['invalidPostalCode']) return 'Código postal debe tener 5 dígitos';
    if (err['postalCodeRange']) return 'Código postal fuera de rango válido (01000-52999)';

    return 'Campo inválido';
  }

  // ──────────────────────────────────────────────────────────────
  // Ciclo de vida y carga de datos
  // ──────────────────────────────────────────────────────────────

  private prefillFromSession(): void {
    const currentUser = this.authService.getUser();

    this.form.patchValue({
      name: currentUser?.business_name ?? '',
      email: currentUser?.email ?? '',
      phone: '',
      address: currentUser?.address ?? '',
      city: currentUser?.city ?? '',
      postal_code: currentUser?.postal_code ?? '',
    });
  }

  private applyBusinessData(business: ApiBusiness): void {
    this.businessId = business.id;
    const mainImage = business.images.find((image) => image.type === 'main') ?? null;
    const galleryImages = business.images
      .filter((image) => image.type === 'gallery')
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .slice(0, 6);

    this.mainImageSubject.next(mainImage);
    this.galleryPreviewSlotsSubject.next(this.gallerySlots.map((index) => galleryImages[index] ?? null));

    const formData = {
      name: business.name ?? this.form.value.name ?? '',
      category_name: business.categories?.[0]?.name ?? '',
      description: business.description ?? '',
      address: business.address ?? '',
      city: business.city ?? '',
      postal_code: business.postal_code ?? business.user?.postal_code ?? '',
      phone: business.phone ?? business.user?.phone ?? '',
      contact_person_name: business.contact_person_name ?? '',
      email: business.user?.email ?? '',
      opening_hours: business.opening_hours || 'Lun-Vie: 8:30-14:00, 17:00-20:00, Sáb: 8:30-14:00',
    };

    this.form.patchValue(formData);
    // Guardar valores originales para poder cancelar
    this.originalFormValues = { ...formData };
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

  // ──────────────────────────────────────────────────────────────
  // Guardado y persistencia de datos
  // ──────────────────────────────────────────────────────────────

  /**
   * Activar modo edición
   */
  enterEditMode(): void {
    this.editMode = true;
    this.form.get('category_name')?.enable();
    this.successMessage = '';
    this.errorMessage = '';
  }

  /**
   * Cancelar edición: restaurar valores originales y limpiar estados
   */
  cancelEdit(): void {
    if (this.originalFormValues) {
      this.form.patchValue(this.originalFormValues);
    }
    
    // Limpiar todos los estados de validación
    this.form.markAsPristine();
    this.form.markAsUntouched();
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
    });
    
    this.editMode = false;
    this.form.get('category_name')?.disable();
    this.successMessage = '';
    this.errorMessage = '';
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
      contact_person_name: raw.contact_person_name?.trim() || null,
      email: raw.email?.trim() || null,
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
        // Volver a modo lectura después de guardar
        this.editMode = false;
        this.form.get('category_name')?.disable();
        this.form.markAsPristine();
        this.form.markAsUntouched();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'No se pudieron guardar los cambios.';
      },
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Gestión de imágenes (principal y galería)
  // ──────────────────────────────────────────────────────────────

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

  // ──────────────────────────────────────────────────────────────
  // Navegación y acciones de usuario
  // ──────────────────────────────────────────────────────────────

  /**
   * Cambiar de pestaña - Solo permitido fuera de modo edición
   */
  changeTab(newTab: 'informacion' | 'horarios' | 'imagenes'): void {
    // Bloquear navegación si estamos en modo edición
    if (this.editMode) {
      return;
    }

    // Cambiar a la nueva pestaña
    this.activeTab = newTab;
  }

  viewPublicProfile(): void {
    // Navegar a la vista previa privada dentro del dashboard
    this.router.navigate(['/vista-negocio']);
  }

  onLogout(): void {
    if (this.isLoggingOut) return;
    if (this.editMode) {
      // En modo edición mostramos el modal de confirmación
      if (this.showLogoutModal) return;
      this.showLogoutModal = true;
    } else {
      // Fuera de modo edición cerramos sesión directamente
      this.confirmLogout();
    }
  }

  confirmLogout(): void {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;
    this.showLogoutModal = false;
    this.editMode = false; // evitar que CanDeactivate intercepte la navegación siguiente

    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        // 401 o cualquier error: token ya expirado — limpiar sesión igualmente
        this.router.navigate(['/login']);
      },
    });
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }

  // ──────────────────────────────────────────────────────────────
  // Protección contra pérdida de datos (CanDeactivate)
  // ──────────────────────────────────────────────────────────────

  /**
   * Detecta si hay cambios sin guardar en cualquier pestaña
   * Comprueba: formulario modificado o imágenes en proceso de subida
   */
  hasUnsavedChanges(): boolean {
    // Solo bloquear si estamos en modo edición
    if (!this.editMode) {
      return false;
    }

    // Bloquear si el formulario está dirty (Angular detecta cambios)
    if (this.form.dirty) {
      return true;
    }

    // Bloquear si hay imágenes en proceso de subida
    if (this.uploadingMainSubject.value || this.uploadingGallerySubject.value) {
      return true;
    }

    // Comparar con valores originales por si Angular no detectó el cambio
    if (this.originalFormValues) {
      const currentValues = this.form.getRawValue();
      const hasChanges = Object.keys(currentValues).some(key => {
        const fieldKey = key as keyof typeof currentValues;
        const current = this.normalizeValue(currentValues[fieldKey]);
        const original = this.normalizeValue(this.originalFormValues![fieldKey]);
        return current !== original;
      });
      
      if (hasChanges) {
        return true;
      }
    }

    return false;
  }

  /**
   * Método requerido por CanComponentDeactivate.
   * Si estamos en modo edición, muestra un modal de confirmación.
   * Retorna Observable<boolean> para que el guard espere la decisión del usuario.
   */
  canDeactivate(): boolean | Observable<boolean> {
    if (!this.editMode) {
      return true;
    }
    this.showLeaveModal = true;
    this.leaveDecision$ = new Subject<boolean>();
    return this.leaveDecision$.asObservable();
  }

  /**
   * El usuario confirma que quiere salir sin guardar.
   * Permite la navegación y resetea el estado de edición.
   */
  confirmLeave(): void {
    this.editMode = false;
    this.showLeaveModal = false;
    this.leaveDecision$.next(true);
    this.leaveDecision$.complete();
  }

  /**
   * El usuario decide quedarse y guardar los datos.
   * Bloquea la navegación y dispara el guardado.
   */
  saveAndStay(): void {
    this.showLeaveModal = false;
    this.leaveDecision$.next(false);
    this.leaveDecision$.complete();
    this.onSave();
  }

  /**
   * El usuario decide quedarse sin guardar (solo cierra el modal).
   */
  stayWithoutSaving(): void {
    this.showLeaveModal = false;
    this.leaveDecision$.next(false);
    this.leaveDecision$.complete();
  }
}
