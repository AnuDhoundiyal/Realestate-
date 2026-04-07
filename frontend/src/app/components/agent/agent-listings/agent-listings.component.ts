import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AgentService } from '../../../services/agent.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-agent-listings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './agent-listings.component.html',
  styleUrl: './agent-listings.component.scss'
})
export class AgentListingsComponent implements OnInit {
  agentService = inject(AgentService);
  listings: any[] = [];
  loading = true;

  filter: string = 'All';
  filteredListings: any[] = [];

  ngOnInit() {
    this.agentService.getListings().subscribe({
      next: (data: any) => {
        this.listings = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  setFilter(f: string) {
    this.filter = f;
    this.applyFilter();
  }

  applyFilter() {
    if (this.filter === 'All') {
      this.filteredListings = this.listings;
    } else {
      this.filteredListings = this.listings.filter(p => p.status === this.filter);
    }
  }

  editingId: string | null = null;

  toggleEdit(id: string) {
    if (this.editingId === id) {
      this.editingId = null;
    } else {
      this.editingId = id;
    }
  }

  onFieldChange(id: string, field: string, value: any) {
    const update = { [field]: value };
    this.agentService.updateProperty(id, update).subscribe({
      next: () => {
        console.log(`Updated ${field} for ${id}`);
        const p = this.listings.find(x => x._id === id);
        if (p) p[field] = value;
      },
      error: () => alert('Failed to auto-save change')
    });
  }

  updateStatus(id: string, status: string) {
    if (!confirm(`Are you sure you want to mark this property as ${status}?`)) return;

    this.agentService.updatePropertyStatus(id, status).subscribe({
      next: (res: any) => {
        const idx = this.listings.findIndex(p => p._id === id);
        if (idx !== -1) {
          this.listings[idx].status = status;
          this.applyFilter();
        }
      },
      error: (err: any) => alert('Failed to update status')
    });
  }

  deleteProperty(id: string) {
    if (!confirm('Are you sure you want to PERMANENTLY delete this property?')) return;
    this.agentService.deleteProperty(id).subscribe({
      next: () => {
        this.listings = this.listings.filter(p => p._id !== id);
        this.applyFilter();
      },
      error: () => alert('Failed to delete property')
    });
  }
}
