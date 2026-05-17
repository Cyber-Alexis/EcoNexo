import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CreateOrderItemPayload {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderPayload {
  business_id: number;
  payment_method: string;
  delivery_method: string;
  pickup_date?: string;
  notes?: string;
  items: CreateOrderItemPayload[];
}

export interface OrderResponse {
  id: number;
  code: string;
  status: string;
  total_price: number;
  business_name: string;
}

export interface OrderItem {
  product_id: number;
  product_name: string;
  price: number;
  price_unit: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface CalendarOrder {
  id: number;
  code: string;
  day: number;
  status: string;
  business_name: string;
  business_address: string;
  client_name: string;
  items_count: number;
  total_price: number;
  payment_method: string;
  delivery_method: string;
  created_at: string;
  items: OrderItem[];
  business_id: number;
  pickup_date: string | null;
  user_address: string | null;
  user_city: string | null;
  user_postal_code: string | null;
  review_skipped: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly base = environment.apiUrl;

  // BehaviorSubject para las órdenes del productor
  private businessOrdersSubject = new BehaviorSubject<CalendarOrder[]>([]);
  
  // Observable público para suscripciones
  public businessOrders$ = this.businessOrdersSubject.asObservable();

  // BehaviorSubject para las órdenes del consumidor
  private consumerOrdersSubject = new BehaviorSubject<CalendarOrder[]>([]);
  
  // Observable público para suscripciones del consumidor
  public consumerOrders$ = this.consumerOrdersSubject.asObservable();

  // Control de polling
  private pollingInterval: any;
  private consumerPollingInterval: any;

  constructor(private http: HttpClient) {}

  createOrder(payload: CreateOrderPayload): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.base}/orders`, payload).pipe(
      tap(() => {
        // Cuando se crea una orden, recargar las órdenes del negocio
        // (solo si el usuario es productor y está viendo su calendario)
        this.refreshBusinessOrders();
      })
    );
  }

  /**
   * Cargar órdenes del productor (para calendario)
   * Actualiza el BehaviorSubject automáticamente
   */
  loadBusinessOrders(): Observable<CalendarOrder[]> {
    return this.http.get<CalendarOrder[]>(`${this.base}/mis-pedidos-productor`).pipe(
      tap(orders => {
        // Mapear para asegurar que tienen el campo 'day'
        const mappedOrders = orders.map(order => ({
          ...order,
          day: new Date(order.created_at).getDate(),
        }));
        this.businessOrdersSubject.next(mappedOrders);
      })
    );
  }

  /**
   * Refrescar órdenes del productor sin retornar Observable
   * (para uso interno después de crear órdenes)
   */
  private refreshBusinessOrders(): void {
    this.http.get<CalendarOrder[]>(`${this.base}/mis-pedidos-productor`)
      .subscribe({
        next: (orders) => {
          const mappedOrders = orders.map(order => ({
            ...order,
            day: new Date(order.created_at).getDate(),
          }));
          this.businessOrdersSubject.next(mappedOrders);
        },
        error: (err) => console.error('Error refreshing business orders:', err)
      });
  }

  /**
   * Iniciar polling automático cada X segundos
   * @param intervalMs Intervalo en milisegundos (default: 30000 = 30 segundos)
   */
  startPolling(intervalMs: number = 30000): void {
    if (this.pollingInterval) return; // Ya está corriendo

    // Primera carga inmediata
    this.loadBusinessOrders().subscribe();

    // Polling periódico
    this.pollingInterval = setInterval(() => {
      this.refreshBusinessOrders();
    }, intervalMs);
  }

  /**
   * Detener polling automático
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Obtener el valor actual de las órdenes
   */
  getCurrentBusinessOrders(): CalendarOrder[] {
    return this.businessOrdersSubject.value;
  }

  // ═══════════════════════════════════════════════════════
  // CONSUMER ORDERS (Órdenes del consumidor)
  // ═══════════════════════════════════════════════════════

  /**
   * Cargar órdenes del consumidor
   * Actualiza el BehaviorSubject automáticamente
   */
  loadConsumerOrders(): Observable<CalendarOrder[]> {
    return this.http.get<CalendarOrder[]>(`${this.base}/orders`).pipe(
      tap(orders => {
        this.consumerOrdersSubject.next(orders);
      })
    );
  }

  /**
   * Refrescar órdenes del consumidor sin retornar Observable
   * (para uso interno después de crear órdenes)
   */
  private refreshConsumerOrders(): void {
    this.http.get<CalendarOrder[]>(`${this.base}/orders`)
      .subscribe({
        next: (orders) => {
          this.consumerOrdersSubject.next(orders);
        },
        error: (err) => console.error('Error refreshing consumer orders:', err)
      });
  }

  /**
   * Iniciar polling automático para consumidor cada X segundos
   * @param intervalMs Intervalo en milisegundos (default: 30000 = 30 segundos)
   */
  startConsumerPolling(intervalMs: number = 30000): void {
    if (this.consumerPollingInterval) return; // Ya está corriendo

    // Primera carga inmediata
    this.loadConsumerOrders().subscribe();

    // Polling periódico
    this.consumerPollingInterval = setInterval(() => {
      this.refreshConsumerOrders();
    }, intervalMs);
  }

  /**
   * Detener polling automático del consumidor
   */
  stopConsumerPolling(): void {
    if (this.consumerPollingInterval) {
      clearInterval(this.consumerPollingInterval);
      this.consumerPollingInterval = null;
    }
  }

  /**
   * Obtener el valor actual de las órdenes del consumidor
   */
  getCurrentConsumerOrders(): CalendarOrder[] {
    return this.consumerOrdersSubject.value;
  }
}
