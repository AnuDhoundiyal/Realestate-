import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PlanService {
    private apiUrl = 'http://localhost:5000/api/plans';
    private http = inject(HttpClient);

    constructor() { }

    getPlans(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    getPlansByUser(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/user`);
    }

    getPlansByAgent(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/agent`);
    }

    getPlan(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }


    createPlan(plan: any): Observable<any> {
        return this.http.post(this.apiUrl, plan, this.getHeaders());
    }

    updatePlan(id: string, plan: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, plan, this.getHeaders());
    }

    cancelPlan(): Observable<any> {
        return this.http.post(`${this.apiUrl}/cancel`, {}, this.getHeaders());
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
