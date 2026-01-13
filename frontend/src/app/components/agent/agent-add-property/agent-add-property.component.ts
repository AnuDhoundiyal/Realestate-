import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgentService } from '../../../services/agent.service';

@Component({
  selector: 'app-agent-add-property',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-add-property.component.html',
  styleUrl: './agent-add-property.component.scss'
})
export class AgentAddPropertyComponent {
  agentService = inject(AgentService);
  router = inject(Router);

  currentStep = 1;
  totalSteps = 3;
  steps = ['Basic Info', 'Details & Location', 'Media & Amenities'];

  property: any = {
    title: '',
    description: '',
    price: null,
    location: '',
    type: 'Sale',
    category: 'Apartment',
    imageUrl: '',
    galleryUrls: '',
    features: [] as string[],
    bedrooms: null,
    bathrooms: null,
    area: null
  };

  imageMode: 'url' | 'upload' = 'upload';
  selectedFile: File | null = null;
  selectedGalleryFiles: File[] = [];
  showSuccess = false;

  previewUrl: string | null = null;
  galleryPreviews: string[] = [];

  commonFeatures = ['Swimming Pool', 'Gym', 'Parking', 'Garden', 'Balcony', 'Elevator', 'Security', 'Air Conditioning', 'WiFi', 'Fireplace'];
  selectedCommonFeatures: { [key: string]: boolean } = {};
  additionalFeatures = '';

  locations = ['New York, NY', 'Los Angeles, CA', 'Miami, FL', 'Chicago, IL', 'San Francisco, CA', 'Dubai', 'London', 'Toronto'];
  categories = ['Villa', 'Penthouse', 'Residential', 'Apartment', 'Farmhouse', 'Studio', 'Studio Apartment'];

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      if (this.validateStep(this.currentStep)) {
        this.currentStep++;
        window.scrollTo(0, 0);
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo(0, 0);
    }
  }

  validateStep(step: number): boolean {
    if (step === 1) {
      if (!this.property.title || !this.property.description || !this.property.price) {
        alert('Please fill in Title, Description and Price.');
        return false;
      }
    }
    if (step === 2) {
      if (!this.property.location || !this.property.category) {
        alert('Please fill in Location and Category.');
        return false;
      }
    }
    return true;
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const file: File = event.target.files[0];
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onGallerySelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedGalleryFiles = Array.from(event.target.files);
      this.galleryPreviews = [];
      this.selectedGalleryFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.galleryPreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  submit(form: any) {
    const formData = new FormData();

    Object.keys(this.property).forEach(key => {
      const value = (this.property as any)[key];
      if (key !== 'features' && key !== 'imageUrl' && key !== 'galleryUrls' && value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    const featureList = Object.keys(this.selectedCommonFeatures).filter(k => this.selectedCommonFeatures[k]);
    if (this.additionalFeatures.trim()) {
      const extras = this.additionalFeatures.split(',').map(f => f.trim()).filter(f => f);
      featureList.push(...extras);
    }
    formData.append('features', featureList.join(','));

    if (this.imageMode === 'upload' && this.selectedFile) {
      formData.append('image', this.selectedFile);
    } else if (this.property.imageUrl) {
      formData.append('imageUrl', this.property.imageUrl);
    }

    if (this.imageMode === 'upload' && this.selectedGalleryFiles.length > 0) {
      this.selectedGalleryFiles.forEach(file => {
        formData.append('gallery', file);
      });
    } else if (this.property.galleryUrls) {
      formData.append('galleryUrls', this.property.galleryUrls);
    }

    this.agentService.addProperty(formData).subscribe({
      next: (res) => {
        // alert('Property Added Successfully!');
        this.showSuccess = true;
        setTimeout(() => {
          this.router.navigate(['/agent/listings']);
        }, 3000);
      },
      error: (err) => {
        console.error('Submission Error:', err);
        alert('Failed to add property. ' + (err.error?.message || err.message || 'Server Error'));
      }
    });
  }
}
