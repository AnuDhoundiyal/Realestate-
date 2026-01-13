import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

@Component({
    selector: 'app-admin-agents',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './admin-agents.component.html',
    styleUrl: './admin-agents.component.scss'
})
export class AdminAgentsComponent implements OnInit {
    adminService = inject(AdminService);
    agents: any[] = [];
    loading = true;

    ngOnInit() {
        this.loadAgents();
    }

    loadAgents() {
        this.loading = true;
        this.adminService.getAgents().subscribe({
            next: (data) => {
                this.agents = data;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }
}
