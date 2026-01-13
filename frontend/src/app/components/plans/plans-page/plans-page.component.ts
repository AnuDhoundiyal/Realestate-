import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { PlanService } from '../../../services/plan.service';

@Component({
    selector: 'app-plans-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './plans-page.component.html',
    styleUrl: './plans-page.component.scss'
})
export class PlansPageComponent implements OnInit {
    isAgentPlan = false;
    userPlans: any[] = [];
    agentPlans: any[] = [];
    displayPlans: any[] = [];

    private planService = inject(PlanService);
    private router = inject(Router);

    ngOnInit() {
        this.fetchAllPlans();
    }

    fetchAllPlans() {
        this.planService.getPlansByUser().subscribe({
            next: (plans) => {
                this.userPlans = plans;
                if (!this.isAgentPlan) this.updateDisplay();
            },
            error: (err) => console.error('Error fetching user plans', err)
        });

        this.planService.getPlansByAgent().subscribe({
            next: (plans) => {
                this.agentPlans = plans;
                if (this.isAgentPlan) this.updateDisplay();
            },
            error: (err) => console.error('Error fetching agent plans', err)
        });
    }

    updateDisplay() {
        this.displayPlans = this.isAgentPlan ? this.agentPlans : this.userPlans;
    }

    togglePlanType(isAgent: boolean) {
        this.isAgentPlan = isAgent;
        this.updateDisplay();
    }

    currency: 'USD' | 'INR' = 'USD';
    conversionRate = 85; // 1 USD = 85 INR

    setCurrency(curr: 'USD' | 'INR') {
        this.currency = curr;
    }

    getConvertedPrice(price: number): number {
        if (this.currency === 'INR') {
            return Math.floor(price * this.conversionRate);
        }
        return price;
    }

    selectPlan(plan: any) {
        this.router.navigate(['/payment'], { queryParams: { planId: plan._id } });
    }
}
