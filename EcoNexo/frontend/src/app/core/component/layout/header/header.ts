import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  protected readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly backendOrigin = this.resolveBackendOrigin();

  dropdownOpen = false;
  notificationCount = 0;
  cartCount = 0;

  ngOnInit(): void {
    this.cartService.items$.subscribe(() => {
      this.cartCount = this.cartService.totalCount;
    });

    this.loadNotificationState();
  }

  openCart(): void {
    this.cartService.toggle();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get user() {
    return this.authService.getUser();
  }

  get userDisplayName(): string {
    const user = this.user as Record<string, unknown> | null;
    if (!user) {
      return 'Usuario';
    }

    const firstName = this.pickUserString(user, ['name', 'first_name', 'nombre']);
    const lastName = this.pickUserString(user, ['last_name', 'lastname', 'surname', 'apellidos']);

    if (!firstName && !lastName) {
      return 'Usuario';
    }

    if (!firstName) {
      return lastName as string;
    }

    if (!lastName) {
      return firstName;
    }

    const normalizedFirst = firstName.toLowerCase();
    const normalizedLast = lastName.toLowerCase();

    if (normalizedFirst.includes(normalizedLast)) {
      return firstName;
    }

    return `${firstName} ${lastName}`.trim();
  }

  get userAvatarUrl(): string | null {
    const user = this.user as Record<string, unknown> | null;
    if (!user) {
      return null;
    }

    const candidates = [
      user['avatar_url'],
      user['avatar'],
      user['avatarUrl'],
      user['profile_photo_url'],
      user['profilePhotoUrl'],
      user['profile_image'],
      user['profileImage'],
      user['photo'],
      user['picture'],
      user['image_url'],
      user['image'],
    ];

    for (const value of candidates) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return this.normalizeAvatarUrl(value);
      }
    }

    return null;
  }

  get hasUnreadNotifications(): boolean {
    return this.notificationCount > 0;
  }

  private loadNotificationState(): void {
    const raw = localStorage.getItem('unread_notifications_count');
    const parsed = raw ? Number(raw) : 0;
    this.notificationCount = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  }

  private pickUserString(user: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = user[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return null;
  }

  private normalizeAvatarUrl(rawValue: string): string {
    const value = rawValue.trim();

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
      return value;
    }

    if (value.startsWith('//')) {
      return `https:${value}`;
    }

    if (value.startsWith('/')) {
      return `${this.backendOrigin}${value}`;
    }

    const cleanPath = value.replace(/^\.\//, '');
    return `${this.backendOrigin}/${cleanPath}`;
  }

  private resolveBackendOrigin(): string {
    try {
      return new URL(environment.apiUrl).origin;
    } catch {
      return window.location.origin;
    }
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout(): void {
    this.dropdownOpen = false;
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.dropdownOpen = false;
    }
  }
}
