import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {
  userService = inject(UserService);

  user: any = {};
  loading = true;
  saving = false;
  selectedFile: File | null = null;
  message = '';

  ngOnInit() {
    this.userService.getProfile().subscribe({
      next: (res) => {
        this.user = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    // Preview logic if needed, but simple file selection is enough for now
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.user.profileImage = e.target.result;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  updateProfile() {
    this.saving = true;
    this.message = '';

    const formData = new FormData();
    if (this.user.name) formData.append('name', this.user.name);
    if (this.user.phone) formData.append('phone', this.user.phone);
    if (this.selectedFile) formData.append('image', this.selectedFile);

    this.userService.updateProfile(formData).subscribe({
      next: (res) => {
        this.user = res; // Update local user data with server response (which contains new image URL)
        this.saving = false;
        this.message = 'Profile updated successfully!';
        setTimeout(() => this.message = '', 3000);
      },
      error: (err) => {
        console.error(err);
        this.saving = false;
        this.message = 'Failed to update profile.';
      }
    });
  }
}
