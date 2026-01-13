import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentService } from '../../../services/agent.service';

@Component({
  selector: 'app-agent-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-profile.component.html',
  styleUrl: './agent-profile.component.scss'
})
export class AgentProfileComponent implements OnInit {
  agentService = inject(AgentService);
  user: any = null;
  loading = true;
  successMsg = '';

  ngOnInit() {
    this.agentService.getProfile().subscribe({
      next: (data) => {
        this.user = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  updateProfile() {
    this.agentService.updateProfile({ name: this.user.name, phone: this.user.phone }).subscribe({
      next: (res) => {
        this.user = res;
        this.successMsg = 'Profile updated successfully!';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        alert('Update failed');
        console.error(err);
      }
    });
  }
}
