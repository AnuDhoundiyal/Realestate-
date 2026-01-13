import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AgentService } from '../../../services/agent.service';

@Component({
  selector: 'app-agent-listings',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
      next: (data) => {
        this.listings = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
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

  updateStatus(id: string, status: string) {
    if (!confirm(`Are you sure you want to mark this property as ${status}?`)) return;

    this.agentService.updateProperty(id, { status }).subscribe({
      next: (res) => {
        // Update local list
        const idx = this.listings.findIndex(p => p._id === id);
        if (idx !== -1) {
          this.listings[idx].status = status;
          this.applyFilter();
        }
      },
      error: (err) => alert('Failed to update status')
    });
  }
}
