import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
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
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  statistics: AdminStatistics | null = null;
  currentPage = 1;
  totalPages = 1;
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Filtros
  selectedRole = 'todos';
  selectedStatus = 'todos';
  searchQuery = '';

  // Modal
  showModal = false;
  isEditMode = false;
  editingUserId: number | null = null;
  formData: UserForm = this.initializeForm();

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadStatistics();
  }

  /**
   * Load users list with filters
   */
  loadUsers(page = 1): void {
    this.isLoading = true;
    this.error = null;

    this.adminService
      .getAllUsers(
        page,
        this.selectedRole,
        this.selectedStatus,
        this.searchQuery
      )
      .subscribe({
        next: (response: any) => {
          this.users = response.data.data;
          this.currentPage = response.data.current_page;
          this.totalPages = response.data.last_page;
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading users:', error);
          this.error = 'Error al cargar los usuarios';
          this.isLoading = false;
        }
      });
  }

  /**
   * Load admin statistics
   */
  loadStatistics(): void {
    this.adminService.getStatistics().subscribe({
      next: (response: any) => {
        this.statistics = response.data;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  /**
   * Apply filters and reload users
   */
  applyFilters(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  /**
   * Open create user modal
   */
  openCreateUserModal(): void {
    this.isEditMode = false;
    this.formData = this.initializeForm();
    this.showModal = true;
  }

  /**
   * Open edit user modal
   */
  openEditUserModal(user: User): void {
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

  /**
   * Close modal
   */
  closeModal(): void {
    this.showModal = false;
    this.formData = this.initializeForm();
    this.editingUserId = null;
  }

  /**
   * Save user (create or update)
   */
  saveUser(): void {
    if (!this.validateForm()) {
      this.error = 'Por favor, completa los campos requeridos';
      return;
    }

    this.isLoading = true;
    const userData = { ...this.formData };

    if (this.isEditMode && this.editingUserId) {
      // Update user
      delete (userData as any).password; // Don't send empty password
      this.adminService.updateUser(this.editingUserId, userData).subscribe({
        next: () => {
          this.successMessage = 'Usuario actualizado exitosamente';
          this.closeModal();
          this.loadUsers(this.currentPage);
          this.loadStatistics();
          setTimeout(() => (this.successMessage = null), 3000);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error updating user:', error);
          this.error = error.error?.message || 'Error al actualizar el usuario';
          this.isLoading = false;
        }
      });
    } else {
      // Create new user
      this.adminService.createUser(userData).subscribe({
        next: () => {
          this.successMessage = 'Usuario creado exitosamente';
          this.closeModal();
          this.currentPage = 1;
          this.loadUsers();
          this.loadStatistics();
          setTimeout(() => (this.successMessage = null), 3000);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error creating user:', error);
          this.error = error.error?.message || 'Error al crear el usuario';
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Change user status
   */
  changeUserStatus(user: User, newStatus: string): void {
    if (!confirm(`¿Estás seguro de que deseas cambiar el estado a "${newStatus}"?`)) {
      return;
    }

    this.adminService.changeUserStatus(user.id, newStatus).subscribe({
      next: () => {
        this.successMessage = 'Estado del usuario actualizado';
        this.loadUsers(this.currentPage);
        this.loadStatistics();
        setTimeout(() => (this.successMessage = null), 3000);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error changing status:', error);
        this.error = 'Error al cambiar el estado del usuario';
      }
    });
  }

  /**
   * Delete user
   */
  deleteUser(user: User): void {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${user.name}? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.successMessage = 'Usuario eliminado exitosamente';
        this.loadUsers(this.currentPage);
        this.loadStatistics();
        setTimeout(() => (this.successMessage = null), 3000);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error deleting user:', error);
        this.error = error.error?.message || 'Error al eliminar el usuario';
      }
    });
  }

  /**
   * Format date
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES');
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'activo':
        return 'badge-success';
      case 'inactivo':
        return 'badge-warning';
      case 'bloqueado':
        return 'badge-danger';
      case 'pendiente':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Get role badge color
   */
  getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'admin':
        return 'role-admin';
      case 'business':
        return 'role-business';
      case 'consumer':
        return 'role-consumer';
      default:
        return 'role-default';
    }
  }

  /**
   * Validate form
   */
  private validateForm(): boolean {
    return (
      this.formData.name.trim() !== '' &&
      this.formData.last_name.trim() !== '' &&
      this.formData.email.trim() !== '' &&
      (this.isEditMode || this.formData.password.trim() !== '')
    );
  }

  /**
   * Initialize form
   */
  private initializeForm(): UserForm {
    return {
      name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'consumer',
      status: 'pendiente',
      phone: '',
      address: '',
      city: '',
      postal_code: ''
    };
  }

  /**
   * Pagination
   */
  goToPage(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.loadUsers(page);
    }
  }
}
