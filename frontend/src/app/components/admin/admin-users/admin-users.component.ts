import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './admin-users.component.html',
    styleUrl: './admin-users.component.scss' // Reuse or new styles
})
export class AdminUsersComponent implements OnInit {
    adminService = inject(AdminService);
    users: any[] = [];
    loading = true;

    ngOnInit() {
        this.adminService.getUsers().subscribe({
            next: (data) => {
                this.users = data;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }
}
