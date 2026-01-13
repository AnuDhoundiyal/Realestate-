import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

@Component({
    selector: 'app-admin-agent-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './admin-agent-detail.component.html',
    styleUrl: './admin-agent-detail.component.scss' // reuse agents css
})
export class AdminAgentDetailComponent implements OnInit {
    adminService = inject(AdminService);
    route = inject(ActivatedRoute);

    agent: any = null;
    loading = true;

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadAgent(id);
        }
    }

    loadAgent(id: string) {
        this.adminService.getUser(id).subscribe({
            next: (data) => {
                this.agent = data;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false; // Add error handling state
            }
        });
    }

    verifyAgent(status: 'VERIFIED' | 'REJECTED') {
        if (!this.agent) return;
        this.adminService.verifyAgent(this.agent._id, status).subscribe((updatedAgent) => {
            this.agent = updatedAgent;
        });
    }
}
