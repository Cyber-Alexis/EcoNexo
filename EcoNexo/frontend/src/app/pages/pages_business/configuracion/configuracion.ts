import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BusinessService } from '../../../core/services/business.service';
import { BusinessSidebar } from '../business-sidebar/business-sidebar';

// Declaración global para Google Translate
declare const google: any;

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  const newPwd = parent.get('new_password')?.value;
  return control.value === newPwd ? null : { mismatch: true };
}

@Component({
  selector: 'app-configuracion-business',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BusinessSidebar],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class ConfiguracionBusiness implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private businessService = inject(BusinessService);

  @ViewChild('sidebar') sidebar!: BusinessSidebar;

  // Password form
  pwdSaving = false;
  pwdSuccess = '';
  pwdError = '';

  pwdForm = this.fb.group({
    current_password: ['', [Validators.required]],
    new_password: ['', [Validators.required, Validators.minLength(6)]],
    confirm_password: ['', [Validators.required, passwordsMatch]],
  });

  // Notifications
  notifSaving = false;
  notifSuccess = '';
  notifError = '';

  notifOrderUpdates = true;
  notifPromotions = false;
  notifNewProducts = true;
  notifReviewResponses = true;

  // Business visibility
  businessVisible = true;
  visibilityLoading = false;

  // Account deletion
  showDeleteModal = false;
  deleting = false;
  deleteError = '';

  // Language translation
  currentLanguage = 'es';

  changeLanguage(lang: string): void {
    if (this.currentLanguage === lang) return;
    this.currentLanguage = lang;
    const changeGoogleLanguage = () => {
      try {
        const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (selectElement) {
          selectElement.value = lang;
          selectElement.dispatchEvent(new Event('change'));
        }
      } catch (error) {
        console.error('Error al cambiar idioma:', error);
      }
    };
    if (typeof google !== 'undefined' && google.translate) {
      changeGoogleLanguage();
    } else {
      setTimeout(changeGoogleLanguage, 500);
    }
  }

  ngOnInit(): void {
    const user = this.authService.getUser();

    // Load business visibility
    this.businessService.getMine().subscribe({
      next: (business) => {
        this.businessVisible = business.is_visible ?? true;
      },
      error: () => {
        // Si hay error, asumimos visible por defecto
        this.businessVisible = true;
      }
    });
    if (user) {
      this.notifOrderUpdates    = user.notif_order_updates    ?? true;
      this.notifPromotions      = user.notif_promotions       ?? false;
      this.notifNewProducts     = user.notif_new_products     ?? true;
      this.notifReviewResponses = user.notif_review_responses ?? true;
    }
  }

  get businessName(): string {
    return this.authService.getUser()?.business_name?.trim() || 'Mi Negocio';
  }

  onChangePwd(): void {
    if (this.pwdForm.invalid || this.pwdSaving) return;
    this.pwdSaving = true;
    this.pwdSuccess = '';
    this.pwdError = '';

    const { current_password, new_password } = this.pwdForm.value;

    this.authService.changePassword(current_password!, new_password!).subscribe({
      next: () => {
        this.pwdSaving = false;
        this.pwdSuccess = 'Contraseña actualizada correctamente.';
        this.pwdForm.reset();
        setTimeout(() => (this.pwdSuccess = ''), 4000);
      },
      error: (err) => {
        this.pwdSaving = false;
        this.pwdError = err?.error?.message ?? 'Error al cambiar la contraseña. Inténtalo de nuevo.';
      },
    });
  }

  onSaveNotifications(): void {
    if (this.notifSaving) return;
    this.notifError = '';

    this.authService.patchUser({
      notif_order_updates:    this.notifOrderUpdates,
      notif_promotions:       this.notifPromotions,
      notif_new_products:     this.notifNewProducts,
      notif_review_responses: this.notifReviewResponses,
    });
    this.notifSuccess = 'Preferencias guardadas correctamente.';
    setTimeout(() => (this.notifSuccess = ''), 4000);

    this.notifSaving = true;
    this.authService.updateNotifications({
      notif_order_updates:    this.notifOrderUpdates,
      notif_promotions:       this.notifPromotions,
      notif_new_products:     this.notifNewProducts,
      notif_review_responses: this.notifReviewResponses,
    }).subscribe({
      next: () => { this.notifSaving = false; },
      error: () => {
        this.notifSaving = false;
        this.notifSuccess = '';
        this.notifError = 'Error al guardar las preferencias. Inténtalo de nuevo.';
      },
    });
  }

  onDeleteAccount(): void {
    this.deleting = true;
    this.deleteError = '';
    this.authService.deleteAccount().subscribe({
      next: () => {
        // Usar setTimeout para evitar errores de detección de cambios
        setTimeout(() => {
          this.authService.setSessionNotice('Tu cuenta ha sido eliminada correctamente.');
          this.router.navigate(['/login']);
        }, 0);
      },
      error: (err) => {
        this.deleting = false;
        this.deleteError = err?.error?.message ?? 'Error al eliminar la cuenta. Inténtalo de nuevo.';
      },
    });
  }

  onToggleVisibility(): void {
    if (this.visibilityLoading) return;
    this.visibilityLoading = true;

    // Cambio optimista: actualizar UI inmediatamente
    const previousState = this.businessVisible;
    this.businessVisible = !this.businessVisible;

    this.businessService.toggleVisibility().subscribe({
      next: (response) => {
        this.businessVisible = response.is_visible;
        this.visibilityLoading = false;
      },
      error: (err) => {
        // Revertir el cambio si hay error
        this.businessVisible = previousState;
        this.visibilityLoading = false;
        alert(err?.error?.message ?? 'Error al cambiar la visibilidad del negocio. Inténtalo de nuevo.');
      }
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
