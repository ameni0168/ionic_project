import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
  imports: [CommonModule, IonicModule, FormsModule],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class OrdersPage implements OnInit {

  // ── Données ────────────────────────────────────────────────────────────────
  allOrders: Order[]  = [];   // toutes les orders chargées depuis l'API
  orders: Order[]     = [];   // orders affichées après filtre + recherche
  isLoading           = true;
  activeFilter: keyof StatusCounts | '' = '';

  counts: StatusCounts = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 };

  // ── Recherche ──────────────────────────────────────────────────────────────
  searchQuery         = '';
  private search$     = new Subject<string>();

  // ── Tri ────────────────────────────────────────────────────────────────────
  sortBy: 'date_desc' | 'date_asc' | 'price_desc' | 'price_asc' = 'date_desc';
  showSortMenu  = false;
  sortMenuY     = 0;
  sortMenuRight = 12;

  sortOptions: { label: string; value: 'date_desc' | 'date_asc' | 'price_desc' | 'price_asc' }[] = [
    { label: 'Newest first',    value: 'date_desc'  },
    { label: 'Oldest first',    value: 'date_asc'   },
    { label: 'Price: High→Low', value: 'price_desc' },
    { label: 'Price: Low→High', value: 'price_asc'  },
  ];

  // ── Config UI ──────────────────────────────────────────────────────────────
  filters: { label: string; value: keyof StatusCounts | ''; color: string; icon: string }[] = [
    { label: 'All',         value: '',            color: 'medium',  icon: 'list'             },
    { label: 'Pending',     value: 'pending',     color: 'warning', icon: 'time'             },
    { label: 'In Progress', value: 'in_progress', color: 'primary', icon: 'sync'             },
    { label: 'Completed',   value: 'completed',   color: 'success', icon: 'checkmark-circle' },
    { label: 'Cancelled',   value: 'cancelled',   color: 'danger',  icon: 'close-circle'     },
  ];

  actionMap: Record<string, { label: string; status: string; color: string; icon: string }[]> = {
    pending: [
      { label: 'Accept',  status: 'in_progress', color: 'success', icon: 'checkmark' },
      { label: 'Decline', status: 'cancelled',   color: 'danger',  icon: 'close'     }
    ],
    in_progress: [
      { label: 'Mark Completed', status: 'completed', color: 'success', icon: 'trophy' },
      { label: 'Cancel',         status: 'cancelled', color: 'danger',  icon: 'close'  }
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

    // Debounce la recherche : 300ms après la dernière frappe
    this.search$.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  // ── Chargement ─────────────────────────────────────────────────────────────

  loadOrders() {
    this.isLoading = true;
    // On charge TOUJOURS sans filtre statut côté API —
    // le filtre + recherche + tri sont faits localement (UX instantanée)
    this.api.getFreelancerOrders('').subscribe({
      next: (data: { orders: Order[]; counts: StatusCounts }) => {
        this.allOrders = data.orders;
        this.counts    = data.counts;
        this.isLoading = false;
        this.applyFilters();
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Erreur lors du chargement', 'danger');
      }
    });
  }

  // ── Recherche + Filtre + Tri (100% local, instantané) ─────────────────────

  applyFilters() {
    let result = [...this.allOrders];

    // 1. Filtre par statut
    if (this.activeFilter) {
      result = result.filter(o => o.status === this.activeFilter);
    }

    // 2. Recherche full-text (titre + nom client + message)
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(o =>
        o.title.toLowerCase().includes(q)       ||
        o.clientName.toLowerCase().includes(q)  ||
        o.message?.toLowerCase().includes(q)
      );
    }

    // 3. Tri
    result.sort((a, b) => {
      switch (this.sortBy) {
        case 'date_desc':  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date_asc':   return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price_desc': return b.price - a.price;
        case 'price_asc':  return a.price - b.price;
      }
    });

    this.orders = result;
  }

  onSearchChange() {
    this.search$.next(this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  setFilter(value: keyof StatusCounts | '') {
    this.activeFilter = value;
    this.applyFilters();
  }

  setSort(value: 'date_desc' | 'date_asc' | 'price_desc' | 'price_asc') {
    this.sortBy       = value;
    this.showSortMenu = false;
    this.applyFilters();
  }

  toggleSort(event: MouseEvent) {
    // Calcule la position du bouton pour placer le menu juste dessous
    const btn  = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    this.sortMenuY     = rect.bottom + 6;                          // 6px sous le bouton
    this.sortMenuRight = window.innerWidth - rect.right;           // aligné à droite du bouton
    this.showSortMenu  = !this.showSortMenu;
  }

  // ── Actions sur commandes ──────────────────────────────────────────────────

  async confirmAction(order: Order, action: { label: string; status: string; color: string; icon: string }) {
    const msgs: Record<string, string> = {
      in_progress: `Accept "${order.title}" and start working?`,
      completed:   `Mark "${order.title}" as delivered?`,
      cancelled:   `Cancel order "${order.title}"?`,
    };
    const alertEl = await this.alert.create({
      header:  action.label,
      message: msgs[action.status] ?? 'Confirm this action?',
      buttons: [
        { text: 'Back', role: 'cancel' },
        {
          text: action.label,
          role: action.color === 'danger' ? 'destructive' : 'confirm',
          handler: () => this.changeStatus(order, action.status)
        }
      ]
    });
    await alertEl.present();
  }

  changeStatus(order: Order, newStatus: string) {
    this.api.updateOrderStatus(order.id, newStatus).subscribe({
      next: () => {
        const old = order.status;
        // Mise à jour locale immédiate
        const idx = this.allOrders.findIndex(o => o.id === order.id);
        if (idx !== -1) this.allOrders[idx].status = newStatus as Order['status'];
        // Corriger les compteurs
        if (this.counts[old as keyof StatusCounts] > 0) this.counts[old as keyof StatusCounts]--;
        this.counts[newStatus as keyof StatusCounts]++;
        this.applyFilters();
        this.showToast(
          newStatus === 'in_progress' ? 'Order accepted !' :
          newStatus === 'completed'   ? 'Order completed !' : 'Order cancelled',
          newStatus === 'cancelled'   ? 'warning' : 'success'
        );
      },
      error: (err: any) => this.showToast(err?.error?.error ?? 'Error', 'danger')
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getCount(value: keyof StatusCounts | ''): number {
    if (value === '') return Object.values(this.counts).reduce((a, b) => a + b, 0);
    return this.counts[value];
  }

  getActions(order: Order) { return this.actionMap[order.status] ?? []; }

  getStatusColor(s: string) {
    return ({ pending:'warning', in_progress:'primary', completed:'success', cancelled:'danger' } as any)[s] ?? 'medium';
  }

  getStatusLabel(s: string) {
    return ({ pending:'Pending', in_progress:'In Progress', completed:'Completed', cancelled:'Cancelled' } as any)[s] ?? s;
  }

  getStatusIcon(s: string) {
    return ({ pending:'time', in_progress:'sync', completed:'checkmark-circle', cancelled:'close-circle' } as any)[s] ?? 'ellipse';
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60)     return 'Just now';
    if (diff < 3600)   return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400)  return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return d.toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' });
  }

  goBack() { this.router.navigate(['/freelancer-dashboard']); }

  async showToast(msg: string, color: 'success'|'danger'|'warning' = 'success') {
    const t = await this.toast.create({ message: msg, duration: 2200, color, position: 'top' });
    await t.present();
  }
}