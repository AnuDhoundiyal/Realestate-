import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private apiUrl = 'http://localhost:5000/api/agent';
  private http = inject(HttpClient);

  constructor() { }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'x-auth-token': token || ''
      }
    };
  }

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard-stats`, this.getHeaders());
  }

  getListings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/listings`, this.getHeaders());
  }

  getPlan(): Observable<any> {
    return this.http.get(`${this.apiUrl}/plan`, this.getHeaders());
  }

  addProperty(propertyData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/properties`, propertyData, this.getHeaders());
  }

  updateProperty(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/properties/${id}`, data, this.getHeaders());
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, this.getHeaders());
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, data, this.getHeaders());
  }
}
