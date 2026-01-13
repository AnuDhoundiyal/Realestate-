import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Property } from '../../models/property.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './property-list.component.html',
  styleUrl: './property-list.component.scss'
})
export class PropertyListComponent implements OnInit {
  propertyService = inject(PropertyService);
  userService = inject(UserService);
  authService = inject(AuthService);
  router = inject(Router);

  properties: Property[] = [];
  filteredProperties: Property[] = [];
  savedPropertyIds: string[] = [];
  filters = {
    keyword: '',
    minPrice: null,
    maxPrice: null,
    type: ''
  };
  viewMode: 'grid-3' | 'grid-2' = 'grid-3';

  ngOnInit() {
    this.propertyService.getProperties().subscribe(props => {
      this.properties = props;
      this.filteredProperties = props;
    });

    if (this.authService.isAuthenticated()) {
      this.fetchSavedProps();
    }
  }

  applyFilters() {
    this.filteredProperties = this.properties.filter(prop => {
      const matchKeyword = !this.filters.keyword ||
        prop.title.toLowerCase().includes(this.filters.keyword.toLowerCase()) ||
        prop.location.toLowerCase().includes(this.filters.keyword.toLowerCase());

      const matchMinPrice = !this.filters.minPrice || prop.price >= this.filters.minPrice;
      const matchMaxPrice = !this.filters.maxPrice || prop.price <= this.filters.maxPrice;
      const matchType = !this.filters.type || prop.type === this.filters.type;

      return matchKeyword && matchMinPrice && matchMaxPrice && matchType;
    });
  }

  resetFilters() {
    this.filters = { keyword: '', minPrice: null, maxPrice: null, type: '' };
    this.filteredProperties = this.properties;
  }

  fetchSavedProps() {
    this.userService.getSavedProperties().subscribe({
      next: (props: any[]) => {
        this.savedPropertyIds = props.map(p => p._id);
      },
      error: (err) => console.error(err)
    });
  }

  isSaved(id: string): boolean {
    return this.savedPropertyIds.includes(id);
  }

  toggleLike(event: Event, propertyId: string) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/properties' } });
      return;
    }

    if (this.isSaved(propertyId)) {
      this.userService.removeSavedProperty(propertyId).subscribe(() => {
        this.savedPropertyIds = this.savedPropertyIds.filter(id => id !== propertyId);
      });
    } else {
      this.userService.saveProperty(propertyId).subscribe(() => {
        this.savedPropertyIds.push(propertyId);
      });
    }
  }

  currency: 'USD' | 'INR' = 'USD';
  conversionRate = 85;

  setCurrency(curr: 'USD' | 'INR') {
    this.currency = curr;
  }

  getConvertedPrice(price: number): number {
    if (this.currency === 'INR') {
      return Math.floor(price * this.conversionRate);
    }
    return price;
  }
}
