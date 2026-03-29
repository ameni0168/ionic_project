import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { trigger, transition, style, animate } from '@angular/animations';


interface Order {
  id: string;
  gigId: string;
  clientId: string;
  title: string;
  price: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  message: string;
  requirements: string;
  clientName: string;
  createdAt: string;
  completedAt: string | null;
}

interface StatusCounts {
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class OrdersPage implements OnInit {

  orders: Order[] = [];
  isLoading = true;
  activeFilter: keyof StatusCounts | '' = '';

  counts: StatusCounts = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  };

  filters: { label: string; value: keyof StatusCounts | ''; color: string }[] = [
    { label: 'All', value: '', color: 'medium' },
    { label: 'Pending', value: 'pending', color: 'warning' },
    { label: 'In Progress', value: 'in_progress', color: 'primary' },
    { label: 'Completed', value: 'completed', color: 'success' },
    { label: 'Cancelled', value: 'cancelled', color: 'danger' }
  ];

  actionMap: Record<string, { label: string; status: string; color: string }[]> = {
    pending: [
      { label: 'Accept', status: 'in_progress', color: 'success' },
      { label: 'Decline', status: 'cancelled', color: 'danger' }
    ],
    in_progress: [
      { label: 'Mark as Completed', status: 'completed', color: 'success' },
      { label: 'Cancel', status: 'cancelled', color: 'danger' }
    ],
    completed: [],
    cancelled: []
  };

  constructor(
    private router: Router,
    private api: ApiService,
    private toast: ToastController,
    private alert: AlertController
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading = true;
    this.api.getFreelancerOrders(this.activeFilter).subscribe({
      next: (data: { orders: Order[]; counts: StatusCounts }) => {
        this.orders = data.orders;
        this.counts = data.counts;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Erreur lors du chargement', 'danger');
      }
    });
  }

  setFilter(value: keyof StatusCounts | '') {
    this.activeFilter = value;
    this.loadOrders();
  }

  changeStatus(order: Order, newStatus: string) {
    this.api.updateOrderStatus(order.id, newStatus).subscribe({
      next: () => {
        const oldStatus = order.status;
        order.status = newStatus as Order['status'];

        this.counts[oldStatus]--;
        this.counts[newStatus as keyof StatusCounts]++;

        if (this.activeFilter && this.activeFilter !== newStatus) {
          this.orders = this.orders.filter(o => o.id !== order.id);
        }

        this.showToast('Statut mis à jour', 'success');
      },
      error: () => this.showToast('Erreur', 'danger')
    });
  }

  goBack() {
    this.router.navigate(['/freelancer-dashboard']);
  }

  getStatusColor(status: string) {
    return {
      pending: 'warning',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'danger'
    }[status] || 'medium';
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString();
  }

  async showToast(msg: string, color: any) {
    const t = await this.toast.create({ message: msg, duration: 2000, color });
    await t.present();
  }
  getCount(value: keyof StatusCounts | ''): number {
    if (value === '') {
      return (
        this.counts.pending +
        this.counts.in_progress +
        this.counts.completed +
        this.counts.cancelled
      );
    }
  
    return this.counts[value];
  }
  getActions(order: Order) {
    return this.actionMap[order.status] || [];
  }
  async confirmAction(
    order: Order,
    action: { label: string; status: string; color: string }
  ) {
    const alertEl = await this.alert.create({
      header: action.label,
      message: `Confirmer l'action "${action.label}" pour "${order.title}" ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: action.label,
          role: action.color === 'danger' ? 'destructive' : 'confirm',
          handler: () => this.changeStatus(order, action.status)
        }
      ]
    });
  
    await alertEl.present();
  }
}
