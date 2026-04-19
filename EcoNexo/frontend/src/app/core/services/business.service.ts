import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiBusiness, ApiBusinessListItem } from '../models/business.model';
import { environment } from '../../../environments/environment';

export interface UpdateOwnedBusinessPayload {
  name: string;
  category_name?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  contact_person_name?: string | null;
  email?: string | null;
  opening_hours?: string | null;
  main_image?: string | null;
}

export interface BusinessApiResponse {
  success: boolean;
  message: string;
  business: ApiBusiness;
}

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

  getMine(): Observable<ApiBusiness> {
    return this.http.get<ApiBusiness>(`${this.base}/mi-negocio`);
  }

  updateMine(payload: UpdateOwnedBusinessPayload): Observable<{ message: string; business: ApiBusiness }> {
    return this.http.put<{ message: string; business: ApiBusiness }>(`${this.base}/mi-negocio`, payload);
  }

  uploadImages(files: File[] | FileList, type: 'main' | 'gallery'): Observable<BusinessApiResponse> {
    const formData = new FormData();
    formData.append('type', type);

    Array.from(files).forEach((file) => {
      formData.append('images[]', file);
    });

    return this.http.post<BusinessApiResponse>(`${this.base}/mi-negocio/imagenes`, formData);
  }

  deleteImage(imageId: number): Observable<BusinessApiResponse> {
    return this.http.delete<BusinessApiResponse>(`${this.base}/mi-negocio/imagenes/${imageId}`);
  }
}
