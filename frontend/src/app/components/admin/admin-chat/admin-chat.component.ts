import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../services/chat.service';
import { AuthService } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-admin-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-chat.component.html',
    styleUrl: './admin-chat.component.scss'
})
export class AdminChatComponent implements OnInit {
    chatService = inject(ChatService);
    authService = inject(AuthService);
    adminService = inject(AdminService);

    conversations: any[] = [];
    messages: any[] = [];
    selectedUser: any = null;
    newMessage = '';
    currentUser: any = null;

    showModal: boolean = false;
    allUsers: any[] = [];
    filteredUsers: any[] = [];
    searchUser: string = '';

    activeTab: 'messages' | 'broadcast' = 'messages';
    broadcastRecipient: 'USERS' | 'AGENTS' | 'ALL' = 'ALL';
    broadcastMessage: string = '';

    ngOnInit() {
        this.currentUser = this.authService.getUserFromStorage();
        this.loadConversations();
    }

    loadConversations() {
        this.chatService.getConversations().subscribe((data) => {
            this.conversations = data;
        });
    }

    selectConversation(chat: any) {
        this.selectedUser = chat;
        // Reset unread count logic here if we tracked per chat unread
        // For now, assume opening chat marks it read (if we implement that)
        this.chatService.markAsRead(chat._id).subscribe(() => {
            // Optionally update local badge count or waiting for poll
        });
        this.loadMessages();
    }

    loadMessages() {
        if (!this.selectedUser) return;
        const otherUserId = this.selectedUser.otherUser._id;
        this.chatService.getMessages(otherUserId).subscribe((data) => {
            this.messages = data;
        });
    }

    sendMessage() {
        if (!this.newMessage.trim() || !this.selectedUser) return;
        const otherUserId = this.selectedUser.otherUser._id;

        this.chatService.sendMessage(otherUserId, this.newMessage).subscribe((msg) => {
            this.messages.push({
                ...msg,
                sender: { _id: this.currentUser.id, name: this.currentUser.name }
            });
            this.newMessage = '';
            this.selectedUser.lastMessage = msg;
            this.scrollToBottom();
        });
    }

    sendBroadcast() {
        if (!this.broadcastMessage.trim()) return;

        if (!confirm(`Are you sure you want to broadcast to ${this.broadcastRecipient}?`)) return;

        this.chatService.broadcastMessage(this.broadcastRecipient, this.broadcastMessage).subscribe({
            next: (res) => {
                alert(`Broadcast sent to ${res.sentCount} recipients.`);
                this.broadcastMessage = '';
            },
            error: (err) => {
                console.error(err);
                alert('Failed to send broadcast.');
            }
        });
    }

    scrollToBottom() {
        setTimeout(() => {
            const el = document.querySelector('.messages-list');
            if (el) el.scrollTop = el.scrollHeight;
        }, 100);
    }

    openNewChatModal() {
        this.showModal = true;
        this.loadAllUsers();
    }

    closeModal() {
        this.showModal = false;
        this.searchUser = '';
    }

    loadAllUsers() {
        forkJoin({
            users: this.adminService.getUsers(),
            agents: this.adminService.getAgents()
        }).subscribe(({ users, agents }) => {
            this.allUsers = [...users, ...agents];
            this.filterUsers();
        });
    }

    filterUsers() {
        if (!this.searchUser) {
            this.filteredUsers = this.allUsers;
        } else {
            const lower = this.searchUser.toLowerCase();
            this.filteredUsers = this.allUsers.filter(u =>
                u.name.toLowerCase().includes(lower) ||
                u.email.toLowerCase().includes(lower)
            );
        }
    }

    startNewChat(user: any) {
        this.chatService.startChat(user._id).subscribe((res: any) => {
            // Updated to handle backend returning { success: true, chat, messages }
            const chatId = res.chat ? res.chat._id : res._id;

            // Reload conversations to ensure we have the full populated object
            this.loadConversations();

            // Wait for reload and select
            setTimeout(() => {
                const chat = this.conversations.find(c => c._id === chatId);
                if (chat) this.selectConversation(chat);
            }, 500);

            this.closeModal();
        });
    }

    deleteMessage(msgId: string) {
        if (!confirm('Are you sure you want to delete this message?')) return;
        this.chatService.deleteMessage(msgId).subscribe({
            next: () => {
                this.messages = this.messages.filter(m => m._id !== msgId);
                // Update last message if needed? For now, keep it simple.
            },
            error: (err) => console.error('Failed to delete message', err)
        });
    }
}
