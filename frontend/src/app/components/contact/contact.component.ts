import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  formData = {
    name: '',
    email: '',
    message: ''
  };

  onSubmit(event: Event) {
    event.preventDefault();
    console.log('Form Submitted', this.formData);
    // Add logic to send message to backend
    alert('Message sent successfully!');
    this.formData = { name: '', email: '', message: '' };
  }
}
