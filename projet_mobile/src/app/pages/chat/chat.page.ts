import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonContent } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ChatService } from 'src/app/services/chat.service';
import { PiiService } from 'src/app/services/pii';
import { AlertController } from '@ionic/angular';
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
  isChecking = false; 

  constructor(
    private route: ActivatedRoute,
    public navCtrl: NavController,
    private chatService: ChatService,
    private piiService: PiiService,
    private alertCtrl: AlertController

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
        this.messages = (res.messages || []).map((m: any) => this.normalizeMessage(m));
        this.isLoading = false;
        setTimeout(() => this.content?.scrollToBottom(300), 100);
      },
      error: () => { this.isLoading = false; }
    });

    this.chatService.joinConversation(this.conversationId);

    this.chatService.onMessage((msg: any) => {
      this.appendMessage(msg);
    });
  }

  async sendMessage() {
    const text = this.newMessage.trim();
    if (!text) return;

    this.isChecking = true;
    const result = await this.piiService.validate(text);
    this.isChecking = false;

    if (!result.allowed) {
      await this.showPiiAlert(result.reason!, result.pii_types!);
      return;
    }

    this.chatService.sendMessage({
      conversationId: this.conversationId,
      senderId: this.userId,
      content: text
    });

    this.appendMessage({
      conversation_id: this.conversationId,
      sender_id: this.userId,
      content: text,
      created_at: new Date().toISOString()
    });

    this.newMessage = '';
  }

  private normalizeMessage(msg: any) {
    return {
      ...msg,
      senderId: String(msg.senderId || msg.sender_id || '')
    };
  }

  private appendMessage(msg: any) {
    this.messages = [...this.messages, this.normalizeMessage(msg)];
    setTimeout(() => this.content?.scrollToBottom(300), 100);
  }

  private async showPiiAlert(reason: string, types: string[]) {
    const labels: Record<string, string> = {
      email: 'Adresse email',
      phone: 'Numero de telephone',
      name: 'Nom complet',
      card: 'Numero de carte',
      address: 'Adresse postale',
      social_link: 'Lien reseau social'
    };
    const detected = types.map(t => labels[t] ?? t).join(', ');
    const alert = await this.alertCtrl.create({
      header: 'Information personnelle detectee',
      subHeader: `Detecte : ${detected}`,
      message: reason,
      buttons: [{ text: 'Modifier mon message', role: 'cancel' }]
    });
    await alert.present();
  }


  isMine(msg: any): boolean {
    const currentUserId = String(this.userId || '').trim();
    const senderId = String(msg.senderId || msg.sender_id || '').trim();
    return !!currentUserId && senderId === currentUserId;
  }

  ngOnDestroy() {
    this.chatService.offMessage();
  }
}
