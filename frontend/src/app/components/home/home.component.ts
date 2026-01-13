import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../services/property.service';
import { Property } from '../../models/property.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  propertyService = inject(PropertyService);
  featuredProperties: Property[] = [];

  ngOnInit() {
    this.propertyService.getProperties().subscribe({
      next: (props) => {
        // Take top 3 for featured
        this.featuredProperties = props.slice(0, 3);
      },
      error: (err) => console.error('Failed to fetch properties', err)
    });
  }
}
