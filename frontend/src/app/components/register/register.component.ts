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
