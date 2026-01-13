import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-payment-success',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './payment-success.component.html',
    styleUrl: './payment-success.component.scss'
})
export class PaymentSuccessComponent implements OnInit {
    private router = inject(Router);
    private authService = inject(AuthService);

    ngOnInit() {
        setTimeout(() => {
            const role = this.authService.getUserRole();
            if (role === 'agent') {
                this.router.navigate(['/agent/plan']);
            } else if (role === 'user') {
                this.router.navigate(['/user/plan']);
            } else {
                this.router.navigate(['/']);
            }
        }, 3000);
    }
}
