import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiProduct } from '../models/business.model';

export interface ProductListParams {
  per_page?: number;
  page?: number;
  category?: string;
  search?: string;
  sort_by?: 'name' | 'price';
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

export interface ApiProductWithBusiness extends ApiProduct {
  business: {
    id: number;
    name: string;
    city: string;
    opening_hours: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<{ categories: string[] }> {
    return this.http.get<{ categories: string[] }>(`${this.base}/categorias`);
  }

  getAll(params?: ProductListParams): Observable<PaginatedResponse<ApiProductWithBusiness>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.category) httpParams = httpParams.set('category', params.category);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
      if (params.sort_order) httpParams = httpParams.set('sort_order', params.sort_order);
    }

    return this.http.get<PaginatedResponse<ApiProductWithBusiness>>(
      `${this.base}/productos`,
      { params: httpParams }
    );
  }
}
