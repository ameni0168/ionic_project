import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from 'src/app/services/chat.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ChatPage implements OnInit, OnDestroy {
  messages: any[] = [];
  newMessage = '';
  userId = '';
  conversationId = '';

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService
  ) {}

  ngOnInit() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return;

  const user = JSON.parse(userStr);
  this.userId = user._id || user.id || user.username;

  // ← récupérer le conversationId depuis l'URL
  this.conversationId = this.route.snapshot.paramMap.get('id') ?? '';
  
  console.log('🔑 conversationId:', this.conversationId);  // doit être non-vide
  console.log('👤 userId:', this.userId);

  if (!this.conversationId) {
    console.error('❌ conversationId manquant dans l URL');
    return;
  }

  // charger historique
  this.chatService.getMessages(this.conversationId).subscribe((res: any) => {
    this.messages = res.messages;
  });

  this.chatService.joinConversation(this.conversationId);

  this.chatService.onMessage((msg: any) => {
    this.messages.push(msg);
  });
}
  sendMessage() {
    if (!this.newMessage.trim()) return;

    const msg = {
      conversationId: this.conversationId,
      senderId: this.userId,
      content: this.newMessage
    };

    this.chatService.sendMessage(msg);

    // afficher immédiatement côté émetteur
    this.messages.push({ ...msg, created_at: new Date().toISOString() });
    this.newMessage = '';
  }

  ngOnDestroy() {
    this.chatService.disconnect();
  }
}