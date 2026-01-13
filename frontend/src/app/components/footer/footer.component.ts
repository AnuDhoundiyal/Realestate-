import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();

  onSubscribe(event: Event) {
    event.preventDefault();
    // Add newsletter subscription logic here
    const form = event.target as HTMLFormElement;
    const input = form.querySelector('input') as HTMLInputElement;
    if (input && input.value) {
      alert(`Thank you for subscribing with ${input.value}!`);
      input.value = '';
    }
  }
}
