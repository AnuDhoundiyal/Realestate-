import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../../services/chat.service';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-user-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './user-chat.component.html',
    styleUrl: './user-chat.component.scss' // reusing agent styles or new ones? I'll create a simple one or copy.
})
export class UserChatComponent implements OnInit {
    chatService = inject(ChatService);
    authService = inject(AuthService);
    route = inject(ActivatedRoute);

    conversations: any[] = [];
    selectedChat: any = null;
    messages: any[] = [];
    newMessage = '';
    currentUserId: string | null = null;
    loading = false;

    ngOnInit() {
        const user = this.authService.getUserFromStorage();
        if (user) this.currentUserId = user.id;

        // Check for welcome message first
        this.chatService.checkWelcomeMessage().subscribe({
            next: () => {
                this.checkAutoStart();
            },
            error: () => this.checkAutoStart()
        });
    }

    checkAutoStart() {
        this.route.queryParams.subscribe(params => {
            const agentId = params['agentId'];
            if (agentId) {
                this.startAndSelectChat(agentId);
            } else {
                this.loadConversations();
            }
        });
    }

    startAndSelectChat(agentId: string) {
        this.loading = true;
        this.chatService.startChat(agentId).subscribe({
            next: (res) => {
                const chat = res.chat; // Now supports { chat, messages }

                // We might need to handle if the conversation list doesn't have this chat yet
                // But first update the list
                this.loadConversations(false, () => {
                    // After loading list, ensure we select the chat
                    // We can just use the 'chat' object returned by startChat
                    // But we want it to be linked to the list item if possible
                    const listChat = this.conversations.find(c => c._id === chat._id);
                    if (listChat) {
                        this.selectChat(listChat);
                    } else {
                        // Should not happen if loadConversations works, but safety fallback
                        this.conversations.unshift({
                            _id: chat._id,
                            otherUser: chat.otherUser,
                            lastMessage: chat.lastMessage
                        });
                        this.selectChat(this.conversations[0]);
                    }
                    this.loading = false;
                });
            },
            error: (err) => {
                this.loading = false;
                this.loadConversations();
            }
        });
    }

    loadConversations(forceSelect: boolean = false, callback?: () => void) {
        this.loading = true;
        this.chatService.getConversations().subscribe({
            next: (res) => {
                this.conversations = res;
                this.loading = false;
                if (callback) callback();
            },
            error: (err) => this.loading = false
        });
    }

    selectChatByAgentId(agentId: string) {
        if (!this.conversations.length) {
            // If list empty, wait for load or load?
            // loadConversations handles it.
            return;
        }

        const chat = this.conversations.find(c => c.otherUser && c.otherUser._id === agentId);
        if (chat) {
            this.selectChat(chat);
        } else {
            // Chat might be new and not in list yet?
            // If we just created it via "Contact Agent", it SHOULD be there.
            // But if we navigated here, maybe the list was loaded BEFORE the navigation finished or in parallel?
            // Force reload if not found?
            if (!this.loading) {
                this.loading = true; // Use a different flag to prevent infinite loop?
                // Simple approach: try one reload if not found?
                // Better: In checkAutoStart, call loadConversations directly.
            }
        }
    }

    selectChat(chat: any) {
        this.selectedChat = chat;
        this.loadMessages();
    }

    loadMessages() {
        if (!this.selectedChat) return;
        // Adapt to use generic getMessages or by otherUser
        // The service currently takes 'userId'. My backend update supports finding by participants.
        const otherUserId = this.selectedChat.otherUser._id;
        this.chatService.getMessages(otherUserId).subscribe(res => {
            this.messages = res;
            this.scrollToBottom();
        });
    }

    sendMessage() {
        if (!this.newMessage.trim() || !this.selectedChat) return;

        this.chatService.sendMessage(this.selectedChat.otherUser._id, this.newMessage).subscribe(res => {
            this.messages.push(res);
            this.newMessage = '';
            this.scrollToBottom();
            // Update last message in list
            this.selectedChat.lastMessage = res;
        });
    }

    scrollToBottom() {
        setTimeout(() => {
            const el = document.getElementById('chat-messages');
            if (el) el.scrollTop = el.scrollHeight;
        }, 100);
    }
}
