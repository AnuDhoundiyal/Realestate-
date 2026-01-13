import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private apiUrl = 'http://localhost:5000/api/payment';
    private http = inject(HttpClient);

    activatePlan(planId: string, paymentMeta: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/activate-plan`, { planId, paymentMeta }, this.getHeaders());
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
