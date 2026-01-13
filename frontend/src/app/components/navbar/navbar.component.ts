import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  chatService = inject(ChatService);

  unreadCount: number = 0;
  isDarkMode = false;
  private pollInterval: any;

  ngOnInit() {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();

    if (this.authService.isAuthenticated()) {
      // Welcome check
      this.chatService.checkWelcomeMessage().subscribe({
        next: () => { },
        error: (err) => console.log(err)
      });

      // Initial count
      this.updateUnreadCount();

      // Poll every 10s
      this.pollInterval = setInterval(() => {
        this.updateUnreadCount();
      }, 10000);
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme() {
    document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  updateUnreadCount() {
    if (!this.authService.isAuthenticated()) return;
    this.chatService.getUnreadCount().subscribe({
      next: (res) => this.unreadCount = res.count,
      error: () => { }
    });
  }

  isAgent(): boolean {
    return this.authService.getUserRole() === 'agent';
  }
}
