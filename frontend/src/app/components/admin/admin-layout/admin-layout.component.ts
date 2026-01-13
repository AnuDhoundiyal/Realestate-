import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
    templateUrl: './admin-layout.component.html',
    styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
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
