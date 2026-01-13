import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentService } from '../../../services/agent.service';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.scss'
})
export class AgentDashboardComponent implements OnInit {
  agentService = inject(AgentService);
  stats: any = null;
  loading = true;

  ngOnInit() {
    this.agentService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}
