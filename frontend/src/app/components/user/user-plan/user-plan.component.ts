import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { PlanService } from '../../../services/plan.service';

@Component({
  selector: 'app-user-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-plan.component.html',
  styleUrl: './user-plan.component.scss'
})
export class UserPlanComponent implements OnInit {
  userService = inject(UserService);
  router = inject(Router);

  plan: any = null;
  loading = true;

  ngOnInit() {
    this.userService.getPlan().subscribe({
      next: (res) => {
        this.plan = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  planService = inject(PlanService);

  upgradePlan() {
    this.router.navigate(['/plans']); // Redirect to plans page for upgrade
  }

  cancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    this.planService.cancelPlan().subscribe({
      next: () => {
        alert('Subscription cancelled.');
        this.ngOnInit(); // Reload
      },
      error: (err) => console.error(err)
    });
  }
}
