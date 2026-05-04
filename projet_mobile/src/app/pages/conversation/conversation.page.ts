import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-conversations',
  templateUrl: './conversation.page.html',
  styleUrls: ['./conversation.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ConversationsPage implements OnInit {
  conversations: any[] = [];
  isLoading = true;
  currentUserId = '';

  constructor(private chatService: ChatService, private router: Router) {}

  ngOnInit() {
    this.loadConversations();
  }

  ionViewWillEnter() {
    this.loadConversations();
  }

  private loadConversations() {
    this.currentUserId = this.chatService.getCurrentUserId();
    if (!this.currentUserId) {
      this.conversations = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.chatService.getConversations(this.currentUserId).subscribe({
      next: (res: any) => {
        this.conversations = (res.conversations || []).filter((c: any) => {
          if (!Array.isArray(c.participants)) return true;
          return c.participants.map((p: any) => String(p)).includes(String(this.currentUserId));
        });
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  openChat(conv: any) {
    this.router.navigate(['/chat', conv._id], {
      state: { otherUser: conv.other_user }
    });
  }
}