import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Property } from '../models/property.model';
import { apiUrl as baseApiUrl } from '../api.config';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private apiUrl = `${baseApiUrl}/properties`;
  private http = inject(HttpClient);

  getProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(this.apiUrl);
  }

  getProperty(id: string): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`);
  }
}
