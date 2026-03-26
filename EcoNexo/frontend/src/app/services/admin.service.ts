import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'business' | 'consumer';
  status: 'activo' | 'inactivo' | 'bloqueado' | 'pendiente';
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  created_at: string;
  updated_at: string;
}

export interface UserResponse {
  success: boolean;
  data: User;
  message?: string;
}

export interface UsersListResponse {
  success: boolean;
  data: {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface AdminStatistics {
  total_users: number;
  admin_users: number;
  business_users: number;
  consumer_users: number;
  active_users: number;
  inactive_users: number;
  blocked_users: number;
  pending_users: number;
  recent_users: User[];
}

export interface StatisticsResponse {
  success: boolean;
  data: AdminStatistics;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = 'http://localhost:8000/api/admin';

  constructor(private http: HttpClient) { }

  /**
   * Get all users with optional filters
   */
  getAllUsers(
    page = 1,
    role?: string,
    status?: string,
    search?: string,
    sortBy = 'created_at',
    sortOrder = 'desc'
  ): Observable<UsersListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('sort_by', sortBy)
      .set('sort_order', sortOrder);

    if (role && role !== 'todos') {
      params = params.set('role', role);
    }
    if (status && status !== 'todos') {
      params = params.set('status', status);
    }
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<UsersListResponse>(`${this.baseUrl}/users`, { params });
  }

  /**
   * Get a single user by ID
   */
  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/users/${id}`);
  }

  /**
   * Create a new user
   */
  createUser(userData: Partial<User>): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/users`, userData);
  }

  /**
   * Update user information
   */
  updateUser(id: number, userData: Partial<User>): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/users/${id}`, userData);
  }

  /**
   * Change user status
   */
  changeUserStatus(id: number, status: string): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.baseUrl}/users/${id}/status`, { status });
  }

  /**
   * Delete a user
   */
  deleteUser(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/users/${id}`);
  }

  /**
   * Get admin statistics
   */
  getStatistics(): Observable<StatisticsResponse> {
    return this.http.get<StatisticsResponse>(`${this.baseUrl}/statistics`);
  }
}
