import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
  orders_count?: number;
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
  total_orders: number;
  orders_today: number;
  pending_orders: number;
  completed_orders: number;
  confirmed_orders: number;
  cancelled_orders: number;
  total_businesses: number;
  active_businesses: number;
  total_products: number;
  active_products: number;
  products_with_stock: number;
  monthly_revenue: number;
  previous_month_revenue: number;
  recent_users: User[];
  overview_cards: AdminOverviewCard[];
  system_status: AdminSystemStatusItem[];
  recent_activity: AdminRecentActivityItem[];
  last_updated_at: string;
}

export interface AdminOverviewCard {
  key: string;
  label: string;
  value: number;
  format: 'number' | 'currency';
  change_percentage: number;
  comparison_label: string;
}

export interface AdminSystemStatusItem {
  key: string;
  label: string;
  detail: string;
  metric: string;
  status: 'operativo' | 'mantenimiento' | 'alerta';
}

export interface AdminRecentActivityItem {
  type: 'user' | 'order' | 'business' | 'product';
  title: string;
  description: string;
  status: 'info' | 'success' | 'warning';
  occurred_at: string;
}

export interface AdminGeneralSettings {
  platform_name: string;
  contact_email: string;
  sales_commission_percentage: number;
}

export interface AdminNotificationSettings {
  security_alerts: boolean;
  new_registrations: boolean;
  product_reports: boolean;
  backups: boolean;
}

export interface AdminMaintenanceSettings {
  enabled: boolean;
  app_version: string;
  last_platform_update_at: string;
  last_checked_at: string;
  update_status_message: string;
}

export interface AdminSettings {
  general: AdminGeneralSettings;
  notifications: AdminNotificationSettings;
  maintenance: AdminMaintenanceSettings;
}

export interface StatisticsResponse {
  success: boolean;
  data: AdminStatistics;
}

export interface SettingsResponse {
  success: boolean;
  message?: string;
  data: AdminSettings;
}

export interface AnalyticsKpi {
  label: string;
  value: string;
  icon_key: string;
  change_label: string;
  change_positive: boolean;
}

export interface AnalyticsMonthlySale {
  month: string;
  revenue: number;
}

export interface AnalyticsDailyTraffic {
  day: string;
  orders: number;
}

export interface AnalyticsCategoryItem {
  name: string;
  total: number;
  percentage: number;
}

export interface AdminAnalytics {
  kpis: AnalyticsKpi[];
  monthly_sales: AnalyticsMonthlySale[];
  weekly_traffic: AnalyticsDailyTraffic[];
  category_distribution: AnalyticsCategoryItem[];
}

export interface AnalyticsResponse {
  success: boolean;
  data: AdminAnalytics;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  // Estado reactivo con BehaviorSubjects
  private usersSubject = new BehaviorSubject<User[]>([]);
  private statisticsSubject = new BehaviorSubject<AdminStatistics | null>(null);
  private analyticsSubject = new BehaviorSubject<AdminAnalytics | null>(null);
  private settingsSubject = new BehaviorSubject<AdminSettings | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  public users$ = this.usersSubject.asObservable();
  public statistics$ = this.statisticsSubject.asObservable();
  public analytics$ = this.analyticsSubject.asObservable();
  public settings$ = this.settingsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  // Auto-refresh configuration
  private autoRefreshSubscription?: Subscription;
  private autoRefreshInterval = 30000; // 30 segundos por defecto

  constructor(private http: HttpClient) { }

  /**
   * Iniciar auto-refresh de datos
   */
  startAutoRefresh(intervalMs?: number): void {
    if (intervalMs) {
      this.autoRefreshInterval = intervalMs;
    }

    // Detener cualquier auto-refresh previo
    this.stopAutoRefresh();

    // Crear nueva suscripción de auto-refresh
    this.autoRefreshSubscription = interval(this.autoRefreshInterval)
      .pipe(
        switchMap(() => this.refreshAllData())
      )
      .subscribe();
  }

  /**
   * Detener auto-refresh
   */
  stopAutoRefresh(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      this.autoRefreshSubscription = undefined;
    }
  }

  /**
   * Refrescar todos los datos
   */
  refreshAllData(): Observable<any> {
    return new Observable(observer => {
      this.refreshStatistics();
      observer.complete();
    });
  }

  /**
   * Refrescar estadísticas
   */
  refreshStatistics(): void {
    this.getStatistics().subscribe({
      next: (response) => {
        this.statisticsSubject.next(response.data);
        this.errorSubject.next(null);
      },
      error: (error) => {
        console.error('Error refreshing statistics:', error);
        this.errorSubject.next('Error al actualizar estadísticas');
      }
    });
  }

  /**
   * Refrescar analíticas
   */
  refreshAnalytics(): void {
    this.getAnalytics().subscribe({
      next: (response) => {
        this.analyticsSubject.next(response.data);
        this.errorSubject.next(null);
      },
      error: (error) => {
        console.error('Error refreshing analytics:', error);
        this.errorSubject.next('Error al actualizar analíticas');
      }
    });
  }

  /**
   * Refrescar configuración
   */
  refreshSettings(): void {
    this.getSettings().subscribe({
      next: (response) => {
        this.settingsSubject.next(response.data);
        this.errorSubject.next(null);
      },
      error: (error) => {
        console.error('Error refreshing settings:', error);
        this.errorSubject.next('Error al actualizar configuración');
      }
    });
  }

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
    return this.http.get<StatisticsResponse>(`${this.baseUrl}/statistics`).pipe(
      tap(response => {
        this.statisticsSubject.next(response.data);
        this.errorSubject.next(null);
      }),
      catchError(error => {
        this.errorSubject.next('Error al cargar estadísticas');
        throw error;
      })
    );
  }

  getSettings(): Observable<SettingsResponse> {
    return this.http.get<SettingsResponse>(`${this.baseUrl}/settings`);
  }

  updateGeneralSettings(payload: AdminGeneralSettings): Observable<SettingsResponse> {
    return this.http.put<SettingsResponse>(`${this.baseUrl}/settings/general`, payload);
  }

  updateNotificationSettings(payload: AdminNotificationSettings): Observable<SettingsResponse> {
    return this.http.put<SettingsResponse>(`${this.baseUrl}/settings/notifications`, payload);
  }

  updateMaintenanceSettings(payload: Pick<AdminMaintenanceSettings, 'enabled'>): Observable<SettingsResponse> {
    return this.http.put<SettingsResponse>(`${this.baseUrl}/settings/maintenance`, payload);
  }

  checkForUpdates(): Observable<SettingsResponse> {
    return this.http.post<SettingsResponse>(`${this.baseUrl}/settings/check-updates`, {});
  }

  getAnalytics(): Observable<AnalyticsResponse> {
    return this.http.get<AnalyticsResponse>(`${this.baseUrl}/analytics`).pipe(
      tap(response => {
        this.analyticsSubject.next(response.data);
        this.errorSubject.next(null);
      }),
      catchError(error => {
        this.errorSubject.next('Error al cargar analíticas');
        throw error;
      })
    );
  }
}
