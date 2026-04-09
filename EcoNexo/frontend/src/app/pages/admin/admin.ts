import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription, interval } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import {
  AdminGeneralSettings,
  AdminMaintenanceSettings,
  AdminOverviewCard,
  AdminNotificationSettings,
  AdminRecentActivityItem,
  AdminService,
  AdminSettings,
  AdminStatistics,
  AdminSystemStatusItem,
  User
} from '../../services/admin.service';

interface UserForm {
  name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'admin' | 'business' | 'consumer';
  status: 'activo' | 'inactivo' | 'bloqueado' | 'pendiente';
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  activeSection = 'dashboard';
  currentUser: AuthUser | null = null;

  // Users data
  users: User[] = [];
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  statistics: AdminStatistics | null = null;
  currentPage = 1;
  totalPages = 1;
  totalUsers = 0;
  isLoading = false;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loadingSubject.asObservable();

  error: string | null = null;
  successMessage: string | null = null;
  lastUpdatedAt: string | null = null;
  settings: AdminSettings | null = null;
  generalSettings: AdminGeneralSettings = this.initGeneralSettings();
  notificationSettings: AdminNotificationSettings = this.initNotificationSettings();
  maintenanceSettings: AdminMaintenanceSettings = this.initMaintenanceSettings();
  isSettingsLoading = false;
  isSavingGeneralSettings = false;
  isSavingNotifications = false;
  isSavingMaintenance = false;
  isCheckingUpdates = false;

  // Filters
  selectedRole = 'todos';
  searchQuery = '';

  // Modal
  showModal = false;
  isEditMode = false;
  editingUserId: number | null = null;
  formData: UserForm = this.initForm();
  private refreshSubscription?: Subscription;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.fetchMe().subscribe({
      next: user => this.initializeAdminSession(user),
      error: err => {
        if (this.currentUser?.role === 'admin') {
          this.initializeAdminSession(this.currentUser);
          return;
        }

        console.error('Error verifying admin session:', err);
        this.ngZone.run(() => {
          this.authService.clearAuth();
          this.router.navigate(['/login']);
          this.cdr.detectChanges();
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  setSection(section: string): void {
    if (this.activeSection === section) {
      return;
    }

    this.activeSection = section;
    this.error = null;
    this.successMessage = null;

    if (section === 'dashboard') {
      this.loadStatistics();
      return;
    }

    if (section === 'usuarios') {
      this.loadUsers(1);
      return;
    }

    if (section === 'configuracion') {
      this.loadSettings();
      return;
    }

    this.activeSection = 'dashboard';
    this.loadStatistics();
  }

  loadUsers(page = 1): void {
    this.isLoading = true;
    this.loadingSubject.next(true);
    this.error = null;

    this.adminService.getAllUsers(page, this.selectedRole, 'todos', this.searchQuery)
      .pipe(finalize(() => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.loadingSubject.next(false);
          this.cdr.detectChanges();
        });
      }))
      .subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          const pageData = res?.data?.data ? res.data : res?.data ? res : null;

          this.users = Array.isArray(pageData?.data) ? pageData.data : [];
          this.usersSubject.next(this.users);
          this.currentPage = Number(pageData?.current_page ?? 1);
          this.totalPages = Number(pageData?.last_page ?? 1);
          this.totalUsers = Number(pageData?.total ?? this.users.length);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error loading admin users:', err);
        this.ngZone.run(() => {
          this.usersSubject.next([]);
          this.error = err.status === 403
            ? 'No tienes permisos para consultar usuarios administradores.'
            : 'Error al cargar los usuarios';
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadStatistics(): void {
    this.adminService.getStatistics().subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          this.statistics = res?.data ?? res ?? null;
          this.lastUpdatedAt = this.statistics?.last_updated_at ?? new Date().toISOString();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error loading admin statistics:', err);
        this.ngZone.run(() => {
          this.error = err.status === 403
            ? 'No tienes permisos para acceder al panel de administración.'
            : 'No se pudieron cargar las métricas en tiempo real.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadSettings(): void {
    this.isSettingsLoading = true;

    this.adminService.getSettings()
      .pipe(finalize(() => {
        this.ngZone.run(() => {
          this.isSettingsLoading = false;
          this.cdr.detectChanges();
        });
      }))
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.applySettings(response.data);
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          console.error('Error loading admin settings:', err);
          this.ngZone.run(() => {
            this.error = 'No se pudo cargar la configuración del sistema.';
            this.cdr.detectChanges();
          });
        }
      });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.formData = this.initForm();
    this.showModal = true;
  }

  openEditModal(user: User): void {
    this.isEditMode = true;
    this.editingUserId = user.id;
    this.formData = {
      name: user.name,
      last_name: user.last_name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
      phone: user.phone,
      address: user.address,
      city: user.city,
      postal_code: user.postal_code
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingUserId = null;
    this.error = null;
  }

  saveUser(): void {
    if (!this.formData.name.trim() || !this.formData.last_name.trim() || !this.formData.email.trim()) {
      this.error = 'Nombre, apellido y email son obligatorios';
      return;
    }
    if (!this.isEditMode && !this.formData.password.trim()) {
      this.error = 'La contraseña es obligatoria al crear un usuario';
      return;
    }

    this.isLoading = true;
    const data = { ...this.formData };

    if (this.isEditMode && this.editingUserId) {
      if (!data.password) delete (data as any).password;
      this.adminService.updateUser(this.editingUserId, data).subscribe({
        next: () => {
          this.showSuccess('Usuario actualizado correctamente');
          this.closeModal();
          this.loadUsers(this.currentPage);
          this.loadStatistics();
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al actualizar el usuario';
          this.isLoading = false;
        }
      });
    } else {
      this.adminService.createUser(data).subscribe({
        next: () => {
          this.showSuccess('Usuario creado correctamente');
          this.closeModal();
          this.loadUsers();
          this.loadStatistics();
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al crear el usuario';
          this.isLoading = false;
        }
      });
    }
  }

  changeStatus(user: User, status: string): void {
    if (!confirm(`¿Cambiar el estado de ${user.name} ${user.last_name} a "${status}"?`)) return;

    this.adminService.changeUserStatus(user.id, status).subscribe({
      next: () => {
        this.showSuccess('Estado actualizado correctamente');
        this.loadUsers(this.currentPage);
        this.loadStatistics();
      },
      error: () => { this.error = 'Error al cambiar el estado'; }
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`¿Eliminar a ${user.name} ${user.last_name}? Esta acción no se puede deshacer.`)) return;

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.showSuccess('Usuario eliminado correctamente');
        this.loadUsers(this.currentPage);
        this.loadStatistics();
      },
      error: (err) => { this.error = err.error?.message || 'Error al eliminar el usuario'; }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.authService.clearAuth();
        this.router.navigate(['/login']);
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.loadUsers(page);
  }

  getRoleBadge(role: string): string {
    const map: Record<string, string> = { admin: 'badge-admin', business: 'badge-business', consumer: 'badge-consumer' };
    return map[role] || '';
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = { activo: 'badge-activo', inactivo: 'badge-inactivo', bloqueado: 'badge-bloqueado', pendiente: 'badge-pendiente' };
    return map[status] || '';
  }

  getRoleLabel(role: string): string {
    const map: Record<string, string> = { admin: 'Admin', business: 'Productor', consumer: 'Cliente' };
    return map[role] || role;
  }

  getOverviewCards(): AdminOverviewCard[] {
    return this.statistics?.overview_cards ?? [];
  }

  getSystemStatus(): AdminSystemStatusItem[] {
    return this.statistics?.system_status ?? [];
  }

  getRecentActivity(): AdminRecentActivityItem[] {
    return this.statistics?.recent_activity ?? [];
  }

  formatDate(date: string): string {
    return date ? new Date(date).toLocaleDateString('es-ES') : '-';
  }

  formatDateTime(date: string): string {
    return date ? new Date(date).toLocaleString('es-ES') : '-';
  }

  formatCardValue(card: AdminOverviewCard): string {
    if (card.format === 'currency') {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(card.value);
    }

    return new Intl.NumberFormat('es-ES').format(card.value);
  }

  formatPercent(value: number): string {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  saveGeneralSettings(): void {
    this.isSavingGeneralSettings = true;
    this.error = null;

    this.adminService.updateGeneralSettings(this.generalSettings)
      .pipe(finalize(() => {
        this.ngZone.run(() => {
          this.isSavingGeneralSettings = false;
          this.cdr.detectChanges();
        });
      }))
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.applySettings(response.data);
            this.showSuccess(response.message || 'Configuración general guardada.');
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.error = err.error?.message || 'No se pudo guardar la configuración general.';
            this.cdr.detectChanges();
          });
        }
      });
  }

  saveNotificationSettings(): void {
    this.isSavingNotifications = true;

    this.adminService.updateNotificationSettings(this.notificationSettings)
      .pipe(finalize(() => {
        this.ngZone.run(() => {
          this.isSavingNotifications = false;
          this.cdr.detectChanges();
        });
      }))
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.applySettings(response.data);
            this.showSuccess(response.message || 'Notificaciones actualizadas.');
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.error = err.error?.message || 'No se pudieron actualizar las notificaciones.';
            this.loadSettings();
          });
        }
      });
  }

  saveMaintenanceSettings(): void {
    this.isSavingMaintenance = true;

    this.adminService.updateMaintenanceSettings({ enabled: this.maintenanceSettings.enabled })
      .pipe(finalize(() => {
        this.ngZone.run(() => {
          this.isSavingMaintenance = false;
          this.cdr.detectChanges();
        });
      }))
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.applySettings(response.data);
            this.showSuccess(response.message || 'Modo mantenimiento actualizado.');
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.error = err.error?.message || 'No se pudo actualizar el modo mantenimiento.';
            this.loadSettings();
          });
        }
      });
  }

  checkForUpdates(): void {
    this.isCheckingUpdates = true;

    this.adminService.checkForUpdates()
      .pipe(finalize(() => {
        this.ngZone.run(() => {
          this.isCheckingUpdates = false;
          this.cdr.detectChanges();
        });
      }))
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.applySettings(response.data);
            this.showSuccess(response.message || 'Comprobación completada.');
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.error = err.error?.message || 'No se pudo comprobar si hay actualizaciones.';
            this.cdr.detectChanges();
          });
        }
      });
  }

  formatSettingsTimestamp(date: string): string {
    if (!date) {
      return '-';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  }

  getChangeClass(value: number): string {
    if (value > 0) {
      return 'trend-positive';
    }

    if (value < 0) {
      return 'trend-negative';
    }

    return 'trend-neutral';
  }

  getSystemStatusClass(status: string): string {
    const map: Record<string, string> = {
      operativo: 'status-operativo',
      mantenimiento: 'status-mantenimiento',
      alerta: 'status-alerta',
    };

    return map[status] || 'status-mantenimiento';
  }

  getActivityStatusClass(status: string): string {
    const map: Record<string, string> = {
      info: 'activity-info',
      success: 'activity-success',
      warning: 'activity-warning',
    };

    return map[status] || 'activity-info';
  }

  getRelativeTime(date: string): string {
    if (!date) {
      return '-';
    }

    const now = Date.now();
    const then = new Date(date).getTime();
    const diffMinutes = Math.max(0, Math.floor((now - then) / 60000));

    if (diffMinutes < 1) {
      return 'Hace unos segundos';
    }

    if (diffMinutes < 60) {
      return `Hace ${diffMinutes} min`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `Hace ${diffHours} h`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} d`;
  }

  getLastUpdatedLabel(): string {
    return this.lastUpdatedAt ? this.formatDateTime(this.lastUpdatedAt) : 'Sin sincronizar';
  }

  private applySettings(settings: AdminSettings): void {
    this.settings = settings;
    this.generalSettings = { ...settings.general };
    this.notificationSettings = { ...settings.notifications };
    this.maintenanceSettings = { ...settings.maintenance };
  }

  private initGeneralSettings(): AdminGeneralSettings {
    return {
      platform_name: 'EcoNexo',
      contact_email: 'admin@econexo.com',
      sales_commission_percentage: 5,
    };
  }

  private initNotificationSettings(): AdminNotificationSettings {
    return {
      security_alerts: true,
      new_registrations: true,
      product_reports: true,
      backups: false,
    };
  }

  private initMaintenanceSettings(): AdminMaintenanceSettings {
    return {
      enabled: false,
      app_version: 'v1.0.0',
      last_platform_update_at: '',
      last_checked_at: '',
      update_status_message: '',
    };
  }

  private initForm(): UserForm {
    return { name: '', last_name: '', email: '', password: '', role: 'consumer', status: 'pendiente', phone: '', address: '', city: '', postal_code: '' };
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    this.isLoading = false;
    setTimeout(() => this.successMessage = null, 3000);
  }

  private initializeAdminSession(user: AuthUser): void {
    this.ngZone.run(() => {
      this.currentUser = user;

      if (user.role !== 'admin') {
        this.router.navigate(['/home']);
        this.cdr.detectChanges();
        return;
      }

      this.error = null;
      this.loadStatistics();

      if (this.activeSection === 'usuarios') {
        this.loadUsers();
      } else if (this.activeSection === 'configuracion') {
        this.loadSettings();
      }

      this.startAutoRefresh();
      this.cdr.detectChanges();
    });
  }

  private startAutoRefresh(): void {
    if (this.refreshSubscription) {
      return;
    }

    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadStatistics();

      if (this.activeSection === 'usuarios') {
        this.loadUsers(this.currentPage);
      }
    });
  }
}
