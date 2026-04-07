import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
    adminService = inject(AdminService);
    stats: any = null;
    loading = true;

    pieSegments: any[] = [];
    barChartData: any[] = [];
    totalSaves: number = 0;

    ngOnInit() {
        this.adminService.getDashboardStats().subscribe({
            next: (data) => {
                this.stats = data;
                this.loading = false;
                this.prepareStatusChart();
                this.prepareCategoryChart();
            },
            error: (err) => {
                console.error('Failed to load stats', err);
                this.loading = false;
            }
        });
    }

    getTypePercentage(count: number, total: number): number {
        if (!total) return 0;
        return (count / total) * 100;
    }

    // Pie Chart: Wishlists by Property Type
    prepareStatusChart() {
        if (!this.stats?.properties?.wishlistByType) return;

        this.totalSaves = this.stats.properties.wishlistByType.reduce((sum: number, item: any) => sum + item.count, 0);
        if (this.totalSaves === 0) return;

        const colors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

        let cumulativePercent = 0;
        this.pieSegments = this.stats.properties.wishlistByType.map((s: any, i: number) => {
            const percent = s.count / this.totalSaves;
            const startStr = `${cumulativePercent * 100}%`;
            cumulativePercent += percent;
            const endStr = `${cumulativePercent * 100}%`;

            const color = colors[i % colors.length];

            return {
                label: s._id || 'Unknown',
                count: s.count,
                color: color,
                gradient: `${color} ${startStr} ${endStr}`
            };
        });
    }

    // Bar Chart: Top Viewed Properties vs Saves
    prepareCategoryChart() {
        if (!this.stats?.properties?.topInterested) return;

        const topInterested = this.stats.properties.topInterested;
        if (topInterested.length === 0) return;

        const max = Math.max(...topInterested.map((t: any) => t.views), ...topInterested.map((t: any) => t.saves), 1);

        this.barChartData = topInterested.map((t: any) => {
            const displayTitle = t.title.substring(0, 15) + (t.title.length > 15 ? '...' : '');
            return {
                label: displayTitle,
                value: `${t.views} Views | ${t.saves} Saves`,
                height: (t.views / max) * 100, // Primary height dictates bar size
                color: 'var(--primary-color)'
            };
        });
    }

    getGradientString(): string {
        if (!this.pieSegments.length) return 'var(--border-color) 0% 100%';
        return this.pieSegments.map(s => s.gradient).join(', ');
    }
}
