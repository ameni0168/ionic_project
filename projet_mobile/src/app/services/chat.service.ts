import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private socket: Socket;
  private readonly API = environment.apiUrl;
  private readonly SOCKET_URL = this.API.replace(/\/api\/?$/, '');

  constructor(private http: HttpClient) {
    this.socket = io(this.SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true
    });
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ Authorization: token ? `Bearer ${token}` : '' });
  }

  createConversation(user1: string, user2: string): Observable<any> {
    return this.http.post(
      `${this.API}/chat/conversation`,
      { user1, user2 },
      { headers: this.getHeaders() }
    );
  }

  getConversations(userId: string): Observable<any> {
    return this.http.get(`${this.API}/chat/conversations/${userId}`, {
      headers: this.getHeaders()
    });
  }

  getCurrentUserId(): string {
    const token = localStorage.getItem('access_token');
    const storedUserId = localStorage.getItem('user_id') || '';
    const fallbackUser = JSON.parse(localStorage.getItem('user') || '{}');
    const fallbackId =
      storedUserId ||
      fallbackUser?._id ||
      fallbackUser?.id ||
      fallbackUser?.user_id ||
      '';

    if (!token) return fallbackId;
    try {
      const base64Url = token.split('.')[1] || '';
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      return String(payload?.sub || fallbackId);
    } catch {
      return String(fallbackId);
    }
  }

  getMessages(conversationId: string): Observable<any> {
    return this.http.get(`${this.API}/chat/messages/${conversationId}`, {
      headers: this.getHeaders()
    });
  }

  joinConversation(conversationId: string) {
    this.ensureConnected();
    this.socket.emit('join', { conversationId });
  }

  sendMessage(data: { conversationId: string; senderId: string; content: string }) {
    this.ensureConnected();
    this.socket.emit('send_message', data);
  }

  onMessage(callback: (msg: any) => void) {
    this.socket.off('receive_message'); // éviter les doublons d'écouteurs
    this.socket.on('receive_message', callback);
  }

  offMessage() {
    this.socket.off('receive_message');
  }

  private ensureConnected() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    this.socket.disconnect();
  }
}
