import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController, AlertController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-gig-order-review',
  templateUrl: './gig-order-review.page.html',
  styleUrls: ['./gig-order-review.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class GigOrderReviewPage implements OnInit {
  orderId = '';
  order: any = null;
  delivery: any = null;
  loading = true;
  isProcessing = false;

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
    this.orderService.getClientOrders('submitted').subscribe({
      next: (res: any) => {
        this.order = res.orders.find((o: any) => o.id === this.orderId);
        if (this.order) {
          // Load delivery details (note/attachments from order.submitted_data or separate endpoint)
          this.delivery = {
            note: this.order.deliveryNote || 'No note provided',
            attachments: this.order.attachments || []
          };
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.navCtrl.back();
      }
    });
  }

  async acceptAndPay() {
    const alert = await this.alertCtrl.create({
      header: 'Accept Delivery & Pay',
      message: `Approve delivery and pay $${this.order?.price || 0}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Accept & Pay',
          handler: () => {
            this.isProcessing = true;
            this.orderService.acceptAndPayGigOrder(this.orderId).subscribe({
              next: () => {
                this.toastCtrl.create({
                  message: 'Order accepted and paid!',
                  color: 'success',
                  duration: 2000
                }).then(toast => toast.present());
                this.navCtrl.navigateBack(['/client-dashboard']);
              },
              error: (err) => {
                this.isProcessing = false;
                this.toastCtrl.create({
                  message: err.error?.error || 'Payment failed',
                  color: 'danger',
                  duration: 3000
                }).then(toast => toast.present());
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async rejectOrder() {
    const alert = await this.alertCtrl.create({
      header: 'Request Changes',
      message: 'Request changes from freelancer?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Request Changes',
          handler: () => {
            // Backend update to 'changes_requested' or notify
            this.toastCtrl.create({
              message: 'Changes requested - freelancer notified',
              color: 'warning',
              duration: 2000
            }).then(toast => toast.present());
            this.navCtrl.back();
          }
        }
      ]
    });
    await alert.present();
  }

  goBack() {
    this.navCtrl.back();
  }
}

