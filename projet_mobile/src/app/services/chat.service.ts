import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private socket: Socket;
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {
    this.socket = io('http://localhost:5000');
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ Authorization: token ? `Bearer ${token}` : '' });
  }

  // ── HTTP ──────────────────────────────────────────────

  createConversation(clientId: string, freelancerId: string): Observable<any> {
    return this.http.post(
      `${this.API}/chat/conversation`,
      { client_id: clientId, freelancer_id: freelancerId },
      { headers: this.getHeaders() }
    );
  }

  getConversations(userId: string): Observable<any> {
    return this.http.get(`${this.API}/chat/conversations/${userId}`, {
      headers: this.getHeaders()
    });
  }

  getMessages(conversationId: string): Observable<any> {
    return this.http.get(`${this.API}/chat/messages/${conversationId}`, {
      headers: this.getHeaders()
    });
  }

  // ── SOCKET ────────────────────────────────────────────

  joinConversation(conversationId: string) {
    this.socket.emit('join', { conversationId });
  }

  sendMessage(data: { conversationId: string; senderId: string; content: string }) {
    this.socket.emit('send_message', data);
  }

  onMessage(callback: (msg: any) => void) {
    this.socket.on('receive_message', callback);
  }

  disconnect() {
    this.socket.disconnect();
  }
}