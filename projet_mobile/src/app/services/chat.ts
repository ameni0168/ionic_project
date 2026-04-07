import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:5000');
  }

  joinConversation(conversationId: string) {
    this.socket.emit('join', { conversationId });
  }

  sendMessage(data: any) {
    this.socket.emit('send_message', data);
  }

  onMessage(callback: (msg: any) => void) {
    this.socket.on('receive_message', callback);
  }

  leaveConversation(conversationId: string) {
    this.socket.emit('leave', { conversationId });
  }
}