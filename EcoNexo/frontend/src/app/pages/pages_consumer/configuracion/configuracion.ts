import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  const newPwd = parent.get('new_password')?.value;
  return control.value === newPwd ? null : { mismatch: true };
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

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

  // Account deletion
  showDeleteModal = false;
  deleting = false;

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.notifOrderUpdates    = user.notif_order_updates    ?? true;
      this.notifPromotions      = user.notif_promotions       ?? false;
      this.notifNewProducts     = user.notif_new_products     ?? true;
      this.notifReviewResponses = user.notif_review_responses ?? true;
    }
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
    this.notifSaving = true;
    this.notifSuccess = '';
    this.notifError = '';

    this.authService.updateNotifications({
      notif_order_updates:    this.notifOrderUpdates,
      notif_promotions:       this.notifPromotions,
      notif_new_products:     this.notifNewProducts,
      notif_review_responses: this.notifReviewResponses,
    }).subscribe({
      next: () => {
        this.notifSaving = false;
        this.notifSuccess = 'Preferencias guardadas correctamente.';
        setTimeout(() => (this.notifSuccess = ''), 4000);
      },
      error: () => {
        this.notifSaving = false;
        this.notifError = 'Error al guardar las preferencias. Inténtalo de nuevo.';
      },
    });
  }

  onDeleteAccount(): void {
    this.deleting = true;
    this.authService.deleteAccount().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.deleting = false;
        this.showDeleteModal = false;
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
