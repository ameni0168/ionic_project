import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonContent } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ChatPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) content!: IonContent;

  messages: any[] = [];
  newMessage = '';
  userId = '';
  conversationId = '';
  otherUser: any = {};
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    public navCtrl: NavController,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.userId = this.chatService.getCurrentUserId();
    this.conversationId = this.route.snapshot.paramMap.get('id') ?? '';
    this.otherUser = window.history.state?.otherUser || {};

    if (!this.conversationId) {
      this.navCtrl.back();
      return;
    }

    // charger historique
    this.chatService.getMessages(this.conversationId).subscribe({
      next: (res: any) => {
        this.messages = (res.messages || []).map((m: any) => ({
          ...m,
          senderId: m.senderId || m.sender_id
        }));
        this.isLoading = false;
        setTimeout(() => this.content?.scrollToBottom(300), 100);
      },
      error: () => { this.isLoading = false; }
    });

    this.chatService.joinConversation(this.conversationId);

    this.chatService.onMessage((msg: any) => {
      this.messages.push(msg);
      setTimeout(() => this.content?.scrollToBottom(300), 100);
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.userId) return;

    const msg = {
      conversationId: this.conversationId,
      senderId: this.userId,
      content: this.newMessage
    };

    this.chatService.sendMessage(msg);
    this.messages.push({ ...msg, created_at: new Date().toISOString() });
    this.newMessage = '';
    setTimeout(() => this.content?.scrollToBottom(300), 100);
  }

  isMine(msg: any): boolean {
    return msg.senderId === this.userId || msg.sender_id === this.userId;
  }

  ngOnDestroy() {
    this.chatService.offMessage();
  }
}