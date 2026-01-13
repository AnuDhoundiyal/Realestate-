import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../../services/chat.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-agent-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-chat.component.html',
  styleUrl: './agent-chat.component.scss'
})
export class AgentChatComponent implements OnInit {
  chatService = inject(ChatService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);

  conversations: any[] = [];
  selectedUser: any = null; // actually chat object
  messages: any[] = [];
  newMessage = '';
  currentUserId: string | null = null;

  ngOnInit() {
    // Need ID to style outgoing/incoming messages
    const user = this.authService.getUserFromStorage();
    if (user) this.currentUserId = user.id;

    this.checkAutoStart();
    this.loadConversations();
  }

  checkAutoStart() {
    this.route.queryParams.subscribe(params => {
      if (params['contactAdmin']) {
        // Initiate contact with admin
        this.chatService.contactAdmin().subscribe({
          next: (res) => {
            // res contains chat info or just proceed to load
            // If we have chat object, we can select it?
            // But easier to just reload conversations and select admin.
            // The service already called start-or-get.

            // Force reload logic or handle selection here.
            // Let's rely on loadConversations to pick it up or push it manually.
            this.loadConversations(res.adminId);
          }
        });
      }
    });
  }

  loadConversations(autoSelectUserId?: string) {
    this.chatService.getConversations().subscribe(res => {
      this.conversations = res;
      if (autoSelectUserId) {
        const chat = this.conversations.find(c => c.otherUser._id === autoSelectUserId);
        if (chat) {
          this.selectUser(chat);
          this.newMessage = "Hello, I need support."; // Pre-fill requirement
        }
      }
    });
  }

  selectUser(chat: any) {
    this.selectedUser = chat;
    this.loadMessages();
  }

  loadMessages() {
    if (!this.selectedUser) return;
    this.chatService.getMessages(this.selectedUser.otherUser._id).subscribe(res => {
      this.messages = res;
      this.scrollToBottom();
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedUser) return;
    const otherUserId = this.selectedUser.otherUser._id;

    this.chatService.sendMessage(otherUserId, this.newMessage).subscribe(res => {
      this.messages.push(res);
      this.newMessage = '';
      this.scrollToBottom();
      this.selectedUser.lastMessage = res;
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      const el = document.getElementById('chat-messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }
}
