import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController, RefresherCustomEvent } from '@ionic/angular';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class OrdersPage implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  counts: any = {};
  loading = true;

  activeFilter = 'all';
  filters = ['all', 'pending', 'in_progress', 'submitted', 'completed', 'cancelled'];

  constructor(
    private orderService: OrderService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  doRefresh(event: RefresherCustomEvent) {
    this.loadOrders();
    event.target.complete();
  }

  goToGigs() {
    this.navCtrl.navigateForward(['/my-gigs']);
  }

  openMenu() {}

  loadOrders() {
    this.loading = true;

    this.orderService.getFreelancerOrders().subscribe({
      next: (res: any) => {
        this.orders = res.orders || [];
        this.counts = res.counts || {};
        this.filterOrders(); 
        this.loading = false
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // 🔥 FILTRAGE PRINCIPAL
  filterOrders() {
    if (this.activeFilter === 'all') {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(
        order => order.status === this.activeFilter
      );
    }
  }

  // 🔥 appelé par cards + segment
  setFilter(filter: string) {
    this.activeFilter = filter;
    this.filterOrders();
  }

  getCount(status: string) {
    return this.counts[status] || 0;
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      pending: 'Pending',
      in_progress: 'In Progress',
      submitted: 'Submitted',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: any = {
      pending: 'warning',
      in_progress: 'primary',
      submitted: 'success',
      completed: 'medium',
      cancelled: 'danger'
    };
    return colors[status] || 'medium';
  }

  startOrder(order: any) {
    this.orderService.updateOrderStatus(order.id, 'in_progress').subscribe({
      next: () => {
        this.showToast('Order started');
        this.loadOrders();
      },
      error: () => this.showToast('Failed to start order', 'danger')
    });
  }

  deliverOrder(order: any) {
    this.navCtrl.navigateForward(['/gig-order-delivery', order.id]);
  }

  viewOrder(order: any) {
    console.log('View order', order);
  }

  goBack() {
    this.navCtrl.back();
  }

  private showToast(message: string, color: string = 'success') {
    this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    }).then(toast => toast.present());
  }
  
getStatusIcon(status: string): string {
  const icons: { [key: string]: string } = {
    'pending': 'hourglass-outline',
    'in_progress': 'play-circle-outline',
    'submitted': 'eye-outline',
    'completed': 'checkmark-circle-outline'
  };
  return icons[status] || 'help-circle-outline';
}
}