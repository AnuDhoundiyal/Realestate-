import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

import { ChatService } from '../../../services/chat.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.scss'
})
export class UserLayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  authService = inject(AuthService);
  chatService = inject(ChatService);
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
  router = inject(Router);

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
