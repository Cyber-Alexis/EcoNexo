import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { AdminService, User, AdminStatistics } from '../../services/admin.service';

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
  activeSection = 'usuarios';
  currentUser: any = null;

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

  // Filters
  selectedRole = 'todos';
  searchQuery = '';

  // Modal
  showModal = false;
  isEditMode = false;
  editingUserId: number | null = null;
  formData: UserForm = this.initForm();

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user && user.role !== 'admin') {
        this.router.navigate(['/home']);
        return;
      }

      if (user && user.role === 'admin') {
        this.loadUsers();
        this.loadStatistics();
      }
    });
  }

  setSection(section: string): void {
    this.activeSection = section;
    if (section === 'usuarios') {
      this.loadUsers();
    }
  }

  loadUsers(page = 1): void {
    this.isLoading = true;
    this.loadingSubject.next(true);
    this.error = null;

    this.adminService.getAllUsers(page, this.selectedRole, 'todos', this.searchQuery)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.loadingSubject.next(false);
      }))
      .subscribe({
      next: (res: any) => {
        const pageData = res?.data?.data ? res.data : res?.data ? res : null;

        this.users = Array.isArray(pageData?.data) ? pageData.data : [];
        this.usersSubject.next(this.users);
        this.currentPage = Number(pageData?.current_page ?? 1);
        this.totalPages = Number(pageData?.last_page ?? 1);
        this.totalUsers = Number(pageData?.total ?? this.users.length);
      },
      error: (err) => {
        console.error('Error loading admin users:', err);
        this.usersSubject.next([]);
        this.error = 'Error al cargar los usuarios';
      }
    });
  }

  loadStatistics(): void {
    this.adminService.getStatistics().subscribe({
      next: (res: any) => {
        this.statistics = res?.data ?? res ?? null;
      },
      error: (err) => {
        console.error('Error loading admin statistics:', err);
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

  formatDate(date: string): string {
    return date ? date.split('T')[0] : '-';
  }

  private initForm(): UserForm {
    return { name: '', last_name: '', email: '', password: '', role: 'consumer', status: 'pendiente', phone: '', address: '', city: '', postal_code: '' };
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    this.isLoading = false;
    setTimeout(() => this.successMessage = null, 3000);
  }
}
