import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanService } from '../../../services/plan.service';

@Component({
    selector: 'app-admin-plans',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-plans.component.html',
    styleUrl: './admin-plans.component.scss'
})
export class AdminPlansComponent implements OnInit {
    planService = inject(PlanService);
    plans: any[] = [];
    loading = true;
    showForm = false;
    editingPlan: any = null;

    planForm = {
        name: '',
        role: 'user',
        price: 0,
        currency: 'USD',
        listingLimit: 0,
        chatLimit: 10,
        features: ''
    };

    ngOnInit() {
        this.loadPlans();
    }

    loadPlans() {
        this.loading = true;
        this.planService.getPlans().subscribe({
            next: (data) => {
                this.plans = data;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    openAddForm() {
        this.editingPlan = null;
        this.planForm = { name: '', role: 'user', price: 0, currency: 'USD', listingLimit: 0, chatLimit: 10, features: '' };
        this.showForm = true;
    }

    openEditForm(plan: any) {
        this.editingPlan = plan;
        this.planForm = {
            name: plan.name,
            role: plan.role,
            price: plan.price,
            currency: plan.currency,
            listingLimit: plan.listingLimit,
            chatLimit: plan.chatLimit,
            features: plan.features.join(', ')
        };
        this.showForm = true;
    }

    closeForm() {
        this.showForm = false;
        this.editingPlan = null;
    }

    submitForm() {
        const planData = {
            ...this.planForm,
            features: this.planForm.features.split(',').map(f => f.trim()).filter(f => f.length > 0)
        };

        if (this.editingPlan) {
            this.planService.updatePlan(this.editingPlan._id, planData).subscribe(() => {
                this.loadPlans();
                this.closeForm();
            });
        } else {
            this.planService.createPlan(planData).subscribe(() => {
                this.loadPlans();
                this.closeForm();
            });
        }
    }
}
