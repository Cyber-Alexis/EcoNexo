import { Component, inject, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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
    const user = this.authService.getUser();
    if (user) {
      this.form.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        address: user.address ?? '',
        city: user.city ?? '',
        postal_code: user.postal_code ?? '',
      });
      if (user.avatar_url) {
        this.profileImageUrl = user.avatar_url;
      }
    }
  }

  onChangeFoto(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      this.savingError = 'Solo se permiten imágenes JPG o PNG.';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.savingError = 'La imagen no puede superar los 2MB.';
      return;
    }

    this.savingError = '';
    this.uploading = true;

    // 1. Compress to ~200px JPEG immediately → updates header & persists in localStorage
    this.compressImage(file).then(dataUrl => {
      this.profileImageUrl = dataUrl;
      this.authService.patchUser({ avatar_url: dataUrl });

      // 2. Upload original to backend in background
      this.authService.uploadAvatar(file).subscribe({
        next: (res) => {
          this.profileImageUrl = res.avatar_url;
          // patchUser already called inside uploadAvatar tap → replaces data: URL with real URL
          this.uploading = false;
        },
        error: () => {
          this.uploading = false;
          // Compressed data: URL is already stored in header & localStorage, nothing extra needed
        },
      });
    });
  }

  private compressImage(file: File): Promise<string> {
    return new Promise(resolve => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const maxSize = 200;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = objectUrl;
    });
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

    // Optimistic update: persist locally right away so it feels instant
    this.authService.patchUser(payload);
    this.saveSuccess = true;
    this.saveError = '';
    setTimeout(() => (this.saveSuccess = false), 3000);

    // Sync to backend in background (401 interceptor redirects to login if session expired)
    this.saving = true;
    this.authService.updateProfile(payload).subscribe({
      next: () => { this.saving = false; },
      error: () => { this.saving = false; },
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
