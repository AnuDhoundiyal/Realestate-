import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AgentService } from '../../services/agent.service';
import { PropertyService } from '../../services/property.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-property-edit',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './property-edit.component.html',
    styleUrl: './property-edit.component.scss'
})
export class PropertyEditComponent implements OnInit {
    adminService = inject(AdminService);
    agentService = inject(AgentService);
    propertyService = inject(PropertyService);
    authService = inject(AuthService);
    router = inject(Router);
    route = inject(ActivatedRoute);

    property: any = null;
    loading = true;
    propertyId: string = '';
    userRole: string = '';

    // Image Handling
    imageMode: 'url' | 'upload' = 'upload';
    selectedFile: File | null = null;
    selectedGalleryFiles: File[] = [];
    previewUrl: string | null = null;
    galleryPreviews: string[] = [];
    existingImages: string[] = [];

    // Features
    commonFeatures = ['Swimming Pool', 'Gym', 'Parking', 'Garden', 'Balcony', 'Elevator', 'Security', 'Air Conditioning', 'WiFi', 'Fireplace'];
    selectedCommonFeatures: { [key: string]: boolean } = {};
    additionalFeatures = '';

    // Datalists
    locations = ['New York, NY', 'Los Angeles, CA', 'Miami, FL', 'Chicago, IL', 'San Francisco, CA', 'Dubai', 'London', 'Toronto'];
    categories = ['Villa', 'Penthouse', 'Residential', 'Apartment', 'Farmhouse', 'Studio', 'Studio Apartment'];

    ngOnInit() {
        this.propertyId = this.route.snapshot.paramMap.get('id') || '';
        this.userRole = this.authService.getUserRole() || '';
        
        if (this.propertyId) {
            this.loadProperty();
        }
    }

    loadProperty() {
        this.propertyService.getProperty(this.propertyId).subscribe({
            next: (data: any) => {
                this.property = { ...data };
                this.existingImages = [...(data.images || [])];
                this.previewUrl = data.imageUrl;
                
                // Set features
                if (data.features) {
                    data.features.forEach((f: string) => {
                        if (this.commonFeatures.includes(f)) {
                            this.selectedCommonFeatures[f] = true;
                        } else {
                            this.additionalFeatures += (this.additionalFeatures ? ', ' : '') + f;
                        }
                    });
                }
                this.loading = false;
            },
            error: (err: any) => {
                console.error(err);
                alert('Property not found');
                this.router.navigate(['/']);
            }
        });
    }

    onFileSelected(event: any) {
        if (event.target.files && event.target.files.length > 0) {
            this.selectedFile = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e: any) => this.previewUrl = e.target.result;
            reader.readAsDataURL(this.selectedFile as File);
        }
    }

    onGallerySelected(event: any) {
        if (event.target.files && event.target.files.length > 0) {
            const files = Array.from(event.target.files) as File[];
            this.selectedGalleryFiles.push(...files);
            
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e: any) => this.galleryPreviews.push(e.target.result);
                reader.readAsDataURL(file);
            });
        }
    }

    removeExistingImage(index: number) {
        this.existingImages.splice(index, 1);
    }

    removeNewGalleryImage(index: number) {
        this.selectedGalleryFiles.splice(index, 1);
        this.galleryPreviews.splice(index, 1);
    }

    submit(form: any) {
        if (form.invalid) {
            alert('Please fill in all required fields');
            return;
        }

        const formData = new FormData();
        
        // Basic fields
        const simpleFields = ['title', 'description', 'price', 'location', 'type', 'category', 'bedrooms', 'bathrooms', 'area', 'status'];
        simpleFields.forEach(f => {
            if (this.property[f] !== null && this.property[f] !== undefined) {
                formData.append(f, this.property[f]);
            }
        });

        // Features
        const finalFeatures = Object.keys(this.selectedCommonFeatures).filter(k => this.selectedCommonFeatures[k]);
        if (this.additionalFeatures.trim()) {
            const extras = this.additionalFeatures.split(',').map(f => f.trim()).filter(f => f);
            finalFeatures.push(...extras);
        }
        formData.append('features', finalFeatures.join(','));

        // Images
        if (this.imageMode === 'upload' && this.selectedFile) {
            formData.append('image', this.selectedFile);
        } else if (this.property.imageUrl) {
            formData.append('imageUrl', this.property.imageUrl);
        }

        formData.append('existingImages', JSON.stringify(this.existingImages));
        
        if (this.selectedGalleryFiles.length > 0) {
            this.selectedGalleryFiles.forEach(file => {
                formData.append('gallery', file);
            });
        }

        const saveObs = this.userRole === 'admin' 
            ? this.adminService.updateProperty(this.propertyId, formData)
            : this.agentService.updateProperty(this.propertyId, formData);

        saveObs.subscribe({
            next: () => {
                alert('Property updated successfully!');
                const backUrl = this.userRole === 'admin' ? '/admin/properties' : '/agent/listings';
                this.router.navigate([backUrl]);
            },
            error: (err: any) => {
                console.error(err);
                alert('Update failed: ' + (err.error?.message || 'Server Error'));
            }
        });
    }
}
