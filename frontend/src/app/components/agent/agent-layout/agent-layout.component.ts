import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-agent-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agent-layout.component.html',
  styleUrl: './agent-layout.component.scss'
})
export class AgentLayoutComponent {
  authService = inject(AuthService);
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
