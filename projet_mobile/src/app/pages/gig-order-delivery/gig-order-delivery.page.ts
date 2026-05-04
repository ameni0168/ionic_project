import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController, AlertController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ApiService } from '../../services/api.service';

interface Attachment {
  url: string;
}

@Component({
  selector: 'app-gig-order-delivery',
  templateUrl: './gig-order-delivery.page.html',
  styleUrls: ['./gig-order-delivery.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class GigOrderDeliveryPage implements OnInit {
  orderId = '';
  order: any = null;
  deliveryNote = '';
  attachments: Attachment[] = [];
  isSubmitting = false;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private orderService: OrderService,
    private apiService: ApiService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (this.orderId) {
      this.loadOrder();
    }
  }

  loadOrder() {
    this.apiService.getFreelancerOrders('pending,in_progress').subscribe({
      next: (res: any) => {
        this.order = res.orders.find((o: any) => o.id === this.orderId);
        if (!this.order) {
          this.navCtrl.back();
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.navCtrl.back();
      }
    });
  }

  addAttachment() {
    this.attachments.push({ url: '' });
  }

  removeAttachment(index: number) {
    this.attachments.splice(index, 1);
  }

  async submitDelivery() {
    if (!this.deliveryNote.trim()) {
      this.showToast('Delivery note is required', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Submit Delivery',
      message: 'Submit your work for client review? They will accept/pay or request changes.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Submit',
          handler: () => {
            this.isSubmitting = true;
            // For now, just update status to 'submitted' - backend handles storage
            this.orderService.updateOrderStatus(this.orderId, 'submitted').subscribe({
              next: () => {
                this.showToast('Delivery submitted! Waiting for client review.', 'success');
                this.navCtrl.navigateBack(['/freelancer-dashboard']);
              },
              error: (err) => {
                this.isSubmitting = false;
                this.showToast(err.error?.error || 'Submit failed', 'danger');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  goBack() {
    this.navCtrl.back();
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}

