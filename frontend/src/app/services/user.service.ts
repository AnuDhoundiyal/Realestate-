import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl as baseApiUrl } from '../api.config';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${baseApiUrl}/user`;
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

    getCurrentUserProfile(): Observable<any> {
        return this.http.get(`${this.apiUrl}/me`, this.getHeaders());
    }

    getProfile(): Observable<any> {
        return this.getCurrentUserProfile();
    }

    updateProfile(data: any): Observable<any> {
        return this.http.patch(`${this.apiUrl}/update`, data, this.getHeaders());
    }

    getPlan(): Observable<any> {
        return this.http.get(`${this.apiUrl}/plan`, this.getHeaders());
    }

    getSavedProperties(): Observable<any> {
        return this.http.get(`${this.apiUrl}/saved`, this.getHeaders());
    }

    saveProperty(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/save/${id}`, {}, this.getHeaders());
    }

    removeSavedProperty(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/save/${id}`, this.getHeaders());
    }

    getDashboardData(): Observable<any> {
        return this.http.get(`${this.apiUrl}/dashboard-data`, this.getHeaders());
    }

    trackView(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/track-view/${id}`, {}, this.getHeaders());
    }
}
