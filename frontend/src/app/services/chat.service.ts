import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl as baseApiUrl } from '../api.config';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private apiUrl = `${baseApiUrl}/chat`;
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

    getConversations(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/conversations`, this.getHeaders());
    }

    getMessages(userId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/messages/${userId}`, this.getHeaders());
    }

    sendMessage(recipientId: string, content: string, metadata?: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/send`, { recipientId, content, metadata }, this.getHeaders());
    }

    // Start or get chat
    startChat(recipientId: string, message?: string, metadata?: any, isSystemMessage: boolean = false): Observable<any> {
        return this.http.post(`${this.apiUrl}/start-or-get`, { recipientId, message, metadata, isSystemMessage }, this.getHeaders());
    }

    // Explicit method for user contacting agent
    contactAgent(agentId: string, propertyId: string, propertyTitle: string): Observable<any> {
        const message = `Hi, I’m interested in the property: ${propertyTitle}`;
        const metadata = { propertyId, propertyTitle };
        return this.startChat(agentId, message, metadata, true);
    }

    // Explicit method for agent contacting admin
    contactAdmin(): Observable<any> {
        // First get admin ID
        return new Observable(observer => {
            this.getAdmin().subscribe({
                next: (admin) => {
                    // Just start chat, don't send message yet as we want to pre-fill
                    this.startChat(admin._id).subscribe({
                        next: (res) => {
                            observer.next({ ...res, adminId: admin._id });
                            observer.complete();
                        },
                        error: (err) => observer.error(err)
                    });
                },
                error: (err) => observer.error(err)
            });
        });
    }

    checkWelcomeMessage(): Observable<any> {
        return this.http.post(`${this.apiUrl}/welcome-check`, {}, this.getHeaders());
    }

    getAdmin(): Observable<any> {
        return this.http.get(`${this.apiUrl}/get-admin`, this.getHeaders());
    }

    broadcastMessage(recipientType: string, message: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/broadcast`, { recipientType, message }, this.getHeaders());
    }

    getUnreadCount(): Observable<any> {
        return this.http.get(`${this.apiUrl}/unread-count`, this.getHeaders());
    }

    markAsRead(chatId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/mark-read/${chatId}`, {}, this.getHeaders());
    }

    deleteMessage(msgId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/messages/${msgId}`, this.getHeaders());
    }
}
