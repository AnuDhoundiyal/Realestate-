import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { PropertyListComponent } from './components/property-list/property-list.component';
import { PropertyDetailComponent } from './components/property-detail/property-detail.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';

// Admin Components
import { AdminLayoutComponent } from './components/admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminAgentsComponent } from './components/admin/admin-agents/admin-agents.component';
import { AdminAgentDetailComponent } from './components/admin/admin-agent-detail/admin-agent-detail.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminPlansComponent } from './components/admin/admin-plans/admin-plans.component';
import { AdminChatComponent } from './components/admin/admin-chat/admin-chat.component';
import { AdminPropertiesComponent } from './components/admin/admin-properties/admin-properties.component';
import { AdminAddPropertyComponent } from './components/admin/admin-add-property/admin-add-property.component';
import { AdminProfileComponent } from './components/admin/admin-profile/admin-profile.component';

// Agent Components
import { AgentLayoutComponent } from './components/agent/agent-layout/agent-layout.component';
import { AgentDashboardComponent } from './components/agent/agent-dashboard/agent-dashboard.component';
import { AgentListingsComponent } from './components/agent/agent-listings/agent-listings.component';
import { AgentAddPropertyComponent } from './components/agent/agent-add-property/agent-add-property.component';
import { AgentChatComponent } from './components/agent/agent-chat/agent-chat.component';
import { AgentProfileComponent } from './components/agent/agent-profile/agent-profile.component';
import { AgentPlanComponent } from './components/agent/agent-plan/agent-plan.component';
import { agentGuard } from './guards/agent.guard';
// User Components
import { UserLayoutComponent } from './components/user/user-layout/user-layout.component';
import { UserDashboardComponent } from './components/user/user-dashboard/user-dashboard.component';
import { UserProfileComponent } from './components/user/user-profile/user-profile.component';
import { UserPlanComponent } from './components/user/user-plan/user-plan.component';
import { UserWishlistComponent } from './components/user/user-wishlist/user-wishlist.component';
import { UserChatComponent } from './components/user/user-chat/user-chat.component';

// Plan & Payment Components
import { PlansPageComponent } from './components/plans/plans-page/plans-page.component';
import { PaymentPageComponent } from './components/payment/payment-page/payment-page.component';
import { PaymentSuccessComponent } from './components/payment/payment-success/payment-success.component';

import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'properties', component: PropertyListComponent },
    { path: 'properties/:id', component: PropertyDetailComponent },
    { path: 'about', component: AboutComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'plans', component: PlansPageComponent },
    {
        path: 'payment',
        component: PaymentPageComponent,
        canActivate: [authGuard]
    },
    {
        path: 'payment/success',
        component: PaymentSuccessComponent,
        canActivate: [authGuard]
    },

    // User Routes
    {
        path: 'user',
        component: UserLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: UserDashboardComponent },
            { path: 'profile', component: UserProfileComponent },
            { path: 'plan', component: UserPlanComponent },
            { path: 'wishlist', component: UserWishlistComponent },
            { path: 'chat', component: UserChatComponent }
        ]
    },

    // Admin Routes
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [adminGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: AdminDashboardComponent },
            { path: 'agents', component: AdminAgentsComponent },
            { path: 'agents/:id', component: AdminAgentDetailComponent },
            { path: 'users', component: AdminUsersComponent },
            { path: 'plans', component: AdminPlansComponent },
            { path: 'chat', component: AdminChatComponent },
            { path: 'properties', component: AdminPropertiesComponent },
            { path: 'properties/add', component: AdminAddPropertyComponent },
            { path: 'profile', component: AdminProfileComponent }
        ]
    },

    // Agent Routes
    {
        path: 'agent',
        component: AgentLayoutComponent,
        canActivate: [agentGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: AgentDashboardComponent },
            { path: 'listings', component: AgentListingsComponent },
            { path: 'properties/add', component: AgentAddPropertyComponent },
            { path: 'chat', component: AgentChatComponent },
            { path: 'profile', component: AgentProfileComponent },
            { path: 'plan', component: AgentPlanComponent }
        ]
    },

    { path: '**', redirectTo: '' }
];
