import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl as baseApiUrl } from '../api.config';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private apiUrl = `${baseApiUrl}/admin`;
    private http = inject(HttpClient);

    constructor() { }

    getDashboardStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/dashboard-stats`, this.getHeaders());
    }

    getUsers(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/users`, this.getHeaders());
    }

    getUser(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/users/${id}`, this.getHeaders());
    }

    getAgents(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/agents`, this.getHeaders());
    }

    verifyAgent(id: string, status: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/verify-agent/${id}`, { status }, this.getHeaders());
    }

    getProperties(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/properties`, this.getHeaders());
    }

    addProperty(property: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/properties`, property, this.getHeaders());
    }

    updateProperty(id: string, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/properties/${id}`, data, this.getHeaders());
    }

    updatePropertyStatus(id: string, status: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/properties/${id}/status`, { status }, this.getHeaders());
    }

    deleteProperty(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/properties/${id}`, this.getHeaders());
    }

    private getHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: {
                'x-auth-token': token || ''
            }
        };
    }
}
