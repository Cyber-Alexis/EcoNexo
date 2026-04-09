import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createOrder(payload: CreateOrderPayload): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.base}/orders`, payload);
  }
}
