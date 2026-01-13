import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentService } from '../../../services/agent.service';

@Component({
  selector: 'app-agent-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-plan.component.html',
  styleUrl: './agent-plan.component.scss'
})
export class AgentPlanComponent implements OnInit {
  agentService = inject(AgentService);
  planData: any = null;
  loading = true;

  ngOnInit() {
    this.agentService.getPlan().subscribe({
      next: (data) => {
        this.planData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}
