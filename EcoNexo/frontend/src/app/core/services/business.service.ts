import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiBusiness, ApiBusinessListItem } from '../models/business.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiBusinessListItem[]> {
    return this.http.get<ApiBusinessListItem[]>(`${this.base}/negocios`);
  }

  getById(id: number | string): Observable<ApiBusiness> {
    return this.http.get<ApiBusiness>(`${this.base}/negocios/${id}`);
  }
}
