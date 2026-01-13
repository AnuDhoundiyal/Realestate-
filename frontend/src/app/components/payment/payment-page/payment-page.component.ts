import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PaymentService } from '../../../services/payment.service';
import { PlanService } from '../../../services/plan.service';
import { UserService } from '../../../services/user.service';

@Component({
    selector: 'app-payment-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
    templateUrl: './payment-page.component.html',
    styleUrl: './payment-page.component.scss'
})
export class PaymentPageComponent implements OnInit {
    selectedPlan: any;
    paymentForm!: FormGroup;
    showConfirmation = false;
    isProcessing = false;

    paymentMethods = ['Credit/Debit Card', 'UPI', 'Net Banking'];
    banks = ['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank'];

    private fb = inject(FormBuilder);
    private router = inject(Router);
    private paymentService = inject(PaymentService);
    private planService = inject(PlanService);
    private userService = inject(UserService);

    private routeAddress = inject(ActivatedRoute); // Use ActivatedRoute to get query params

    constructor() {
        // Keep state check as fallback or for optimization
        const nav = this.router.getCurrentNavigation();
        if (nav?.extras.state && nav.extras.state['plan']) {
            this.selectedPlan = nav.extras.state['plan'];
        }
    }

    ngOnInit() {
        this.initForm();

        // If plan is already set from state, no need to fetch
        if (this.selectedPlan) return;

        // Otherwise check query params
        this.routeAddress.queryParams.subscribe((params: any) => {
            const planId = params['planId'];
            if (planId) {
                this.fetchPlan(planId);
            } else {
                this.router.navigate(['/plans']);
            }
        });
    }

    fetchPlan(id: string) {
        this.planService.getPlan(id).subscribe({
            next: (plan: any) => this.selectedPlan = plan,
            error: () => this.router.navigate(['/plans'])
        });
    }


    initForm() {
        this.paymentForm = this.fb.group({
            fullName: ['', Validators.required],
            addressLine: ['', Validators.required],
            city: ['', Validators.required],
            state: ['', Validators.required],
            pincode: ['', [Validators.required, Validators.pattern('^[0-9]{5,6}$')]],
            paymentMethod: ['Credit/Debit Card', Validators.required],
            cardNumber: [''],
            expiryDate: [''],
            cvv: [''],
            upiId: [''],
            bankName: ['']
        });

        // Prefill form
        this.userService.getCurrentUserProfile().subscribe({
            next: (user: any) => {
                if (user && user.billingAddress) {
                    this.paymentForm.patchValue({
                        fullName: user.billingAddress.fullName || user.name,
                        addressLine: user.billingAddress.addressLine || '',
                        city: user.billingAddress.city || '',
                        state: user.billingAddress.state || '',
                        pincode: user.billingAddress.pincode || ''
                    });
                } else if (user) {
                    // Default name
                    this.paymentForm.patchValue({ fullName: user.name });
                }
            }
        });
    }

    get f() { return this.paymentForm ? this.paymentForm.controls : {}; }

    proceedToPay() {
        if (this.paymentForm.invalid) {
            this.paymentForm.markAllAsTouched();
            return;
        }
        this.showConfirmation = true;
    }

    confirmPayment() {
        this.isProcessing = true;
        this.showConfirmation = false;

        // Simulate delay
        setTimeout(() => {
            // Include billing address update
            const billingData = {
                billingAddress: {
                    fullName: this.paymentForm.value.fullName,
                    addressLine: this.paymentForm.value.addressLine,
                    city: this.paymentForm.value.city,
                    state: this.paymentForm.value.state,
                    pincode: this.paymentForm.value.pincode
                }
            };

            // Save billing info first/concurrently
            // Note: In real app, updateProfile might be separate or part of payment init
            this.userService.updateProfile(billingData).subscribe({
                next: () => console.log('Billing info saved'),
                error: (e) => console.error('Failed to save billing info', e)
            });

            this.paymentService.activatePlan(this.selectedPlan._id, this.paymentForm.value).subscribe({
                next: (res) => {
                    this.isProcessing = false;
                    this.router.navigate(['/payment/success']);
                },
                error: (err) => {
                    console.error(err);
                    this.isProcessing = false;
                    alert('Payment Failed. Please try again.');
                }
            });
        }, 2000);
    }

    cancelPayment() {
        this.showConfirmation = false;
    }
}
