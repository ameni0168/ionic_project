import { Component, OnInit } from '@angular/core';
import { ChatService } from 'src/app/services/chat';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrl: './chat.page.scss',
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ChatPage implements OnInit {

  messages: any[] = [];
  newMessage = '';

  userId = 'user2'; // à remplacer par user connecté
  conversationId = 'conv1';

  constructor(private chatService: ChatService) {}

  ngOnInit() {
  const userStr = localStorage.getItem('user');

  if (!userStr) {
    console.error("❌ Aucun utilisateur trouvé dans localStorage");
    return;
  }

  const user = JSON.parse(userStr);
  this.userId = user.username;

  this.chatService.joinConversation(this.conversationId);

  this.chatService.onMessage((msg) => {
    this.messages.push(msg);
  });
}

  sendMessage() {
  if (!this.newMessage) return;

  const msg = {
    conversationId: this.conversationId,
    senderId: this.userId,
    content: this.newMessage
  };

  this.chatService.sendMessage(msg);

  // ✅ afficher direct
  this.messages.push(msg);

  this.newMessage = '';
}
}