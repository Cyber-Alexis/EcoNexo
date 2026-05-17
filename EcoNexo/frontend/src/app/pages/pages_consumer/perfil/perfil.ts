import { Component, inject, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ConsumerSidebar } from '../consumer-sidebar/consumer-sidebar';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConsumerSidebar],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit, OnDestroy {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private destroy$ = new Subject<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  userName = '';
  profileImageUrl: string | null = null;
  uploading = false;
  saving = false;
  saveSuccess = false;
  saveError = '';
  savingError = '';

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(30)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[679]\d{8}$/)]],

    address: [''],
    city: [''],
    postal_code: [''],
  });

  ngOnInit(): void {
    // Suscribirse al observable user$ para reactividad
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.ngZone.run(() => {
            this.userName = user.name;
            
            // Solo actualizar el formulario si NO ha sido modificado por el usuario
            // Esto evita sobrescribir lo que el usuario está escribiendo
            if (this.form.pristine) {
              this.form.patchValue({
                name: user.name,
                email: user.email,
                phone: user.phone ?? '',
                address: user.address ?? '',
                city: user.city ?? '',
                postal_code: user.postal_code ?? '',
              }, { emitEvent: false });
            }
            
            // Siempre actualizar el avatar (no interfiere con la edición)
            this.profileImageUrl = user.avatar_url ?? null;
            this.cdr.detectChanges();
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onChangeFoto(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.savingError = 'Solo se permiten imágenes JPG, PNG o WebP.';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.savingError = 'La imagen no puede superar los 2MB.';
      return;
    }

    this.savingError = '';
    this.uploading = true;

    // Subir directamente al backend
    this.authService.uploadAvatar(file).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.profileImageUrl = res.avatar_url;
          this.uploading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.uploading = false;
          this.savingError = err?.error?.message || 'Error al subir la imagen.';
          this.cdr.detectChanges();
        });
      },
    });

    // Resetear el input para permitir subir la misma imagen nuevamente
    input.value = '';
  }

  onGuardar(): void {
    if (this.form.invalid || this.saving) return;

    const raw = this.form.value;
    const payload = {
      name: raw.name ?? undefined,
      email: raw.email ?? undefined,
      phone: raw.phone || undefined,
      address: raw.address || undefined,
      city: raw.city || undefined,
      postal_code: raw.postal_code || undefined,
    };

    this.saving = true;
    this.saveSuccess = false;
    this.saveError = '';

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.saving = false;
          this.saveSuccess = true;
          this.saveError = '';
          // Marcar formulario como pristine para permitir futuras actualizaciones
          this.form.markAsPristine();
          // El estado se actualiza automáticamente vía user$ subscription
          setTimeout(() => (this.saveSuccess = false), 3000);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.saving = false;
          this.saveSuccess = false;
          this.saveError = err?.error?.message || 'Error al guardar los cambios.';
          this.cdr.detectChanges();
        });
      },
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
