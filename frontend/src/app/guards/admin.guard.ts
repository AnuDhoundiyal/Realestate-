import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.getUserRole() === 'admin') {
        return true;
    }

    // If authenticated but not admin, maybe go to home or user dashboard?
    // If not authenticated, login.
    if (!authService.isAuthenticated()) {
        return router.createUrlTree(['/login']);
    }

    return router.createUrlTree(['/']);
};
