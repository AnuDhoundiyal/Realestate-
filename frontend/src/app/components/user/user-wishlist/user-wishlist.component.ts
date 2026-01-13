import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-wishlist.component.html',
  styleUrl: './user-wishlist.component.scss'
})
export class UserWishlistComponent implements OnInit {
  userService = inject(UserService);

  properties: any[] = [];
  loading = true;

  ngOnInit() {
    this.loadProperties();
  }

  loadProperties() {
    this.userService.getSavedProperties().subscribe({
      next: (res) => {
        this.properties = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  removeProperty(id: string) {
    if (!confirm('Remove from saved properties?')) return;

    this.userService.removeSavedProperty(id).subscribe({
      next: (res) => {
        // Backend returns updated list of IDs, but we already have full objects here.
        // Better to overwrite list or filter.
        // Actually, my backend route returns IDs list. So I should filter local list.
        this.properties = this.properties.filter(p => p._id !== id);
      },
      error: (err) => console.error(err)
    });
  }
}
