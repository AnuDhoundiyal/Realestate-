import { Component, Input, OnInit, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../services/property.service';
import { Property } from '../../models/property.model';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Fancybox } from '@fancyapps/ui';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss'
})
export class PropertyDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() id!: string;

  propertyService = inject(PropertyService);
  userService = inject(UserService);
  property: any = null;
  activeImage: string = '';
  showLightbox: boolean = false;
  isSaved: boolean = false; // Heart status

  ngOnInit() {
    if (this.id) {
      this.propertyService.getProperty(this.id).subscribe(data => {
        this.property = data;
        this.activeImage = this.property.imageUrl;
      });

      // Track View
      if (this.authService.isAuthenticated()) {
        this.userService.trackView(this.id).subscribe({
          next: () => { },
          error: (err) => console.log('Track view error', err)
        });
        this.checkIfSaved();
      } else {
        // Anonymous view increment
        this.propertyService.incrementView(this.id).subscribe({
          next: () => { },
          error: (err) => console.log('Incr view error', err)
        });
      }
    }
  }

  checkIfSaved() {
    this.userService.getSavedProperties().subscribe({
      next: (savedProps: any[]) => {
        // savedProps is array of properties, we check if current id is in it
        this.isSaved = savedProps.some(p => p._id === this.id);
      }
    });
  }

  toggleSave() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/properties/${this.id}` } });
      return;
    }

    if (this.isSaved) {
      this.userService.removeSavedProperty(this.id).subscribe({
        next: () => this.isSaved = false
      });
    } else {
      this.userService.saveProperty(this.id).subscribe({
        next: () => this.isSaved = true
      });
    }
  }

  setActiveImage(img: string) {
    this.activeImage = img;
  }

  router = inject(Router);
  authService = inject(AuthService);
  chatService = inject(ChatService);

  contactAgent() {
    if (!this.property || !this.property.owner) return;

    if (!this.authService.isAuthenticated()) {
      // Redirect to login with return url properties/:id
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/properties/${this.id}` } });
      return;
    }

    const agentId = this.property.owner._id;
    const propertyId = this.property._id;
    const propertyTitle = this.property.title;

    this.chatService.contactAgent(agentId, propertyId, propertyTitle).subscribe({
      next: (res) => {
        // Redirect to chat with query param to auto-select
        this.router.navigate(['/user/chat'], { queryParams: { agentId } });
      },
      error: (err) => {
        console.error('Failed to start chat', err);
        // Optionally show alert
      }
    });
  }

  openLightbox() {
    this.showLightbox = true;
  }

  closeLightbox() {
    this.showLightbox = false;
  }

  ngAfterViewInit() {
    Fancybox.bind("[data-fancybox]", {
      // Custom options
    });
  }

  ngOnDestroy() {
    Fancybox.destroy();
  }
}
