import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

@Component({
    selector: 'app-admin-properties',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './admin-properties.component.html',
    styleUrl: './admin-properties.component.scss' // reuse agents css or new
})
export class AdminPropertiesComponent implements OnInit {
    adminService = inject(AdminService);
    properties: any[] = [];
    loading = true;

    ngOnInit() {
        this.adminService.getProperties().subscribe({
            next: (data) => {
                this.properties = data;
                this.applyFilter();
                this.loading = false;
                console.log(data);
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    filter: string = 'All';
    filteredProperties: any[] = [];

    setFilter(f: string) {
        this.filter = f;
        this.applyFilter();
    }

    applyFilter() {
        if (this.filter === 'All') {
            this.filteredProperties = this.properties;
        } else {
            this.filteredProperties = this.properties.filter(p => p.status === this.filter);
        }
    }

    updateStatus(id: string, status: string) {
        if (!confirm(`Mark property as ${status}?`)) return;
        this.adminService.updateProperty(id, { status }).subscribe({
            next: () => {
                const p = this.properties.find(x => x._id === id);
                if (p) {
                    p.status = status;
                    this.applyFilter();
                }
            },
            error: () => alert('Error updating status')
        });
    }
}
