import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

import { ChatService } from '../../../services/chat.service';
import { OnInit } from '@angular/core';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
    templateUrl: './admin-layout.component.html',
    styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
    authService = inject(AuthService);
    chatService = inject(ChatService);
    router = inject(Router);
    isSidebarCollapsed = false;
    showLogoutModal = false;
    unreadCount = 0;

    ngOnInit() {
        this.fetchUnreadCount();
        // Poll every 10 seconds
        setInterval(() => this.fetchUnreadCount(), 10000);
    }

    fetchUnreadCount() {
        this.chatService.getUnreadCount().subscribe({
            next: (res: any) => this.unreadCount = res.count,
            error: (err: any) => console.log('Unread count error', err)
        });
    }

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }

    confirmLogout() {
        this.showLogoutModal = true;
    }

    cancelLogout() {
        this.showLogoutModal = false;
    }

    logout() {
        this.authService.logout();
        this.showLogoutModal = false;
    }
}
