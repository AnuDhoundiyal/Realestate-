import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

@Component({
    selector: 'app-admin-add-property',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-add-property.component.html',
    styleUrl: './admin-add-property.component.scss'
})
export class AdminAddPropertyComponent {
    adminService = inject(AdminService);
    router = inject(Router);

    // Initialize with null/undefined for numeric fields to avoid "0" default
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

    // Image Handling
    imageMode: 'url' | 'upload' = 'upload';
    selectedFile: File | null = null;
    selectedGalleryFiles: File[] = [];

    previewUrl: string | null = null;
    galleryPreviews: string[] = [];

    // Features Config
    commonFeatures = ['Swimming Pool', 'Gym', 'Parking', 'Garden', 'Balcony', 'Elevator', 'Security', 'Air Conditioning', 'WiFi', 'Fireplace'];
    selectedCommonFeatures: { [key: string]: boolean } = {};
    additionalFeatures = '';

    // Datalists
    locations = ['New York, NY', 'Los Angeles, CA', 'Miami, FL', 'Chicago, IL', 'San Francisco, CA', 'Dubai', 'London', 'Toronto'];
    categories = ['Villa', 'Penthouse', 'Residential', 'Apartment', 'Farmhouse', 'Studio', 'Studio Apartment'];

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

            this.galleryPreviews = []; // clear previous
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
        if (form.invalid) {
            alert('Please fill in all required fields marked with *');
            return;
        }

        const formData = new FormData();

        // Append basic fields
        Object.keys(this.property).forEach(key => {
            const value = (this.property as any)[key];
            // Only append if value is not null/undefined/empty string
            if (key !== 'features' && key !== 'imageUrl' && key !== 'galleryUrls' && value !== null && value !== undefined && value !== '') {
                formData.append(key, value);
            }
        });

        // Handle Features
        const featureList = Object.keys(this.selectedCommonFeatures).filter(k => this.selectedCommonFeatures[k]);
        if (this.additionalFeatures.trim()) {
            const extras = this.additionalFeatures.split(',').map(f => f.trim()).filter(f => f);
            featureList.push(...extras);
        }
        formData.append('features', featureList.join(','));

        // Handle Main Image
        if (this.imageMode === 'upload' && this.selectedFile) {
            formData.append('image', this.selectedFile);
        } else if (this.property.imageUrl) {
            formData.append('imageUrl', this.property.imageUrl);
        }

        // Handle Gallery
        if (this.imageMode === 'upload' && this.selectedGalleryFiles.length > 0) {
            this.selectedGalleryFiles.forEach(file => {
                formData.append('gallery', file);
            });
        } else if (this.property.galleryUrls) {
            formData.append('galleryUrls', this.property.galleryUrls);
        }

        this.adminService.addProperty(formData).subscribe({
            next: (res) => {
                alert('Property Added Successfully!');
                this.router.navigate(['/admin/properties']);
            },
            error: (err) => {
                console.error('Submission Error:', err);
                alert('Failed to add property. ' + (err.error?.message || err.message || 'Server Error'));
            }
        });
    }
}
