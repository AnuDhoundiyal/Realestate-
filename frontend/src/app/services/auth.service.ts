import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { apiUrl as baseApiUrl } from '../api.config';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${baseApiUrl}/auth`;
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals for reactive state
  currentUserStr = signal<any | null>(this.getUserFromStorage());

  constructor() { }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData).pipe(
      tap((res: any) => this.handleAuthResponse(res))
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => this.handleAuthResponse(res))
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserStr.set(null);
    this.router.navigate(['/login']);
  }

  private handleAuthResponse(res: any) {
    if (res.token && res.user) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      this.currentUserStr.set(res.user);
    }
  }

  getUserFromStorage() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getUserRole(): string | null {
    const user = this.currentUserStr();
    return user ? user.role : null;
  }
}
