import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  chatService = inject(ChatService);
  // chatService = inject(ChatService); // No longer used in register logic

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  role = 'user';
  phone = '';
  selectedFile: File | null = null;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  register() {
    this.errorMessage = '';

    // Simple Validation
    if (!this.name.trim() || !this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (this.role === 'agent' && (!this.phone || !this.phone.trim())) {
      this.errorMessage = 'Phone number is required for agents.';
      return;
    }

    const formData = new FormData();
    formData.append('name', this.name);
    formData.append('email', this.email);
    formData.append('password', this.password);
    formData.append('role', this.role);
    if (this.phone) formData.append('phone', this.phone);
    if (this.selectedFile) formData.append('image', this.selectedFile);

    this.authService.register(formData).subscribe({
      next: (res) => {
        // Redirect based on role
        if (this.role === 'admin') this.router.navigate(['/admin/dashboard']);
        else if (this.role === 'agent') this.router.navigate(['/agent/dashboard']);
        else this.router.navigate(['/user/dashboard']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed';
      }
    });
  }
}
