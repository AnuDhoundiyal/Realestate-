import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

import { ChatService } from '../../../services/chat.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-agent-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agent-layout.component.html',
  styleUrl: './agent-layout.component.scss'
})
export class AgentLayoutComponent implements OnInit {
  authService = inject(AuthService);
  chatService = inject(ChatService);
  router = inject(Router);
  unreadCount = 0;

  ngOnInit() {
    this.fetchUnreadCount();
    setInterval(() => this.fetchUnreadCount(), 10000);
  }

  fetchUnreadCount() {
    this.chatService.getUnreadCount().subscribe({
        next: (res: any) => this.unreadCount = res.count,
        error: (err: any) => console.log('Unread count error', err)
    });
  }
  isSidebarCollapsed = false;
  showLogoutModal = false;

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
