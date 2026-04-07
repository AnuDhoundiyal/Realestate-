import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-admin-properties',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './admin-properties.component.html',
    styleUrl: './admin-properties.component.scss'
})
export class AdminPropertiesComponent implements OnInit {
    adminService = inject(AdminService);
    properties: any[] = [];
    loading = true;

    ngOnInit() {
        this.adminService.getProperties().subscribe({
            next: (data: any) => {
                this.properties = data;
                this.applyFilter();
                this.loading = false;
            },
            error: (err: any) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    filter: string = 'All';
    filteredProperties: any[] = [];
    editingId: string | null = null;

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

    toggleEdit(id: string) {
        this.editingId = this.editingId === id ? null : id;
    }

    onFieldChange(id: string, field: string, value: any) {
        const update = { [field]: value };
        this.adminService.updateProperty(id, update).subscribe({
            next: () => {
                console.log(`Admin updated ${field} for ${id}`);
                const p = this.properties.find(x => x._id === id);
                if (p) p[field] = value;
            },
            error: () => alert('Failed to auto-save change')
        });
    }

    updateStatus(id: string, status: string) {
        if (!confirm(`Mark property as ${status}?`)) return;
        this.adminService.updatePropertyStatus(id, status).subscribe({
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

    deleteProperty(id: string) {
        if (!confirm('Are you sure you want to PERMANENTLY delete this property?')) return;
        this.adminService.deleteProperty(id).subscribe({
            next: () => {
                this.properties = this.properties.filter(p => p._id !== id);
                this.applyFilter();
            },
            error: () => alert('Failed to delete property')
        });
    }
}
