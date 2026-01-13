import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const agentGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.getUserRole() === 'agent') {
        return true;
    }

    // Redirect to login if not authorized
    router.navigate(['/login']);
    return false;
};
