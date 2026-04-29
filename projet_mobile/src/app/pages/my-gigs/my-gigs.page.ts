import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';                      // ← Router Angular, pas NavController
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService } from '../../services/api.service';
import { MarketplaceContentService } from '../../services/marketplace-content.service';

interface Gig {
  id: string;
  title: string;
  price: number;
  status: 'active' | 'pending' | 'paused';
  ordersCompleted: number;
  category: string;
  description: string;
  deliveryTime: string;
  colorAccent: string;
}

@Component({
  selector: 'app-my-gigs',
  templateUrl: './my-gigs.page.html',
  styleUrls: ['./my-gigs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class MyGigsPage implements OnInit {

  gigs: Gig[] = [];
  isLoading = true;

  showCreateModal = false;
  isCreating = false;

  newGig = {
    title: '',
    description: '',
    price: null as number | null,
    category: '',
    deliveryTime: '',
    colorAccent: '#6366f1'
  };

  categories: string[] = [];

  colorOptions = [
    { label: 'Violet',  value: '#6366f1' },
    { label: 'Vert',    value: '#10b981' },
    { label: 'Orange',  value: '#f59e0b' },
    { label: 'Bleu',    value: '#3b82f6' },
    { label: 'Rose',    value: '#ec4899' },
    { label: 'Rouge',   value: '#ef4444' },
  ];

  constructor(
    private router: Router,                // ← Router Angular
    private api: ApiService,
    private marketplaceContent: MarketplaceContentService,
    private toast: ToastController,
    private alert: AlertController
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadGigs();
  }

  loadGigs() {
    this.isLoading = true;
    this.api.getMyGigs().subscribe({
      next: (data: { gigs: Gig[] }) => {
        this.gigs = data.gigs;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Gigs error:', err);
        this.isLoading = false;
        this.showToast('Erreur lors du chargement des gigs', 'danger');
      }
    });
  }

  loadCategories() {
    this.marketplaceContent.getDynamicCategories(10).subscribe({
      next: (categories) => {
        this.categories = categories.map((category) => category.name);
      },
      error: () => {
        this.categories = [];
      },
    });
  }

  // ── Navigation vers détail ─────────────────────────────────────────────────
  viewGigDetails(gig: Gig) {
    // On utilise Router.navigate avec state — c'est la méthode fiable dans Angular/Ionic
    this.router.navigate(['/gig-details', gig.id], {
      state: { gig }          // accessible via Router.getCurrentNavigation() dans GigDetailsPage
    });
  }

  goBack() {
    this.router.navigate(['/freelancer-dashboard']);
  }

  // ── Création ───────────────────────────────────────────────────────────────
  openCreateModal() {
    this.newGig = { title: '', description: '', price: null, category: '', deliveryTime: '', colorAccent: '#6366f1' };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  submitGig(): void {
    if (!this.newGig.title.trim()) {
      this.showToast('Le titre est obligatoire', 'warning');
      return;
    }
    if (!this.newGig.description.trim()) {
      this.showToast('La description est obligatoire', 'warning');
      return;
    }
    if (!this.newGig.price || this.newGig.price <= 0) {
      this.showToast('Le prix doit être positif', 'warning');
      return;
    }
    if (!this.newGig.category) {
      this.showToast('Choisis une catégorie', 'warning');
      return;
    }
    if (!this.newGig.deliveryTime.trim()) {
      this.showToast('Le délai est obligatoire', 'warning');
      return;
    }

    this.isCreating = true;
    this.api.createGig(this.newGig).subscribe({
      next: (res: any) => {
        this.gigs.unshift(res.gig);
        this.showCreateModal = false;
        this.isCreating = false;
        this.showToast('Gig cree. En attente de validation admin.', 'success');
      },
      error: (err: any) => {
        this.isCreating = false;
        this.showToast(err?.error?.error || 'Erreur lors de la création', 'danger');
      }
    });
  }

  // ── Suppression ────────────────────────────────────────────────────────────
  async confirmDelete(event: Event, gig: Gig) {
    event.stopPropagation();
    const alertEl = await this.alert.create({
      header: 'Supprimer ce gig ?',
      message: `"${gig.title}" sera définitivement supprimé.`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Supprimer', role: 'destructive', handler: () => this.deleteGig(gig) }
      ]
    });
    await alertEl.present();
  }

  deleteGig(gig: Gig) {
    this.api.deleteGig(gig.id).subscribe({
      next: () => {
        this.gigs = this.gigs.filter(g => g.id !== gig.id);
        this.showToast('Gig supprimé', 'success');
      },
      error: () => this.showToast('Erreur lors de la suppression', 'danger')
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getStatusLabel(status: string): string {
    return ({ active: 'Active', pending: 'Pending', paused: 'Paused' } as any)[status] ?? status;
  }

  getStatusIcon(status: string): string {
    return ({ active: 'checkmark-circle', pending: 'time', paused: 'pause-circle' } as any)[status] ?? 'ellipse';
  }

  getActiveCount(): number {
    return this.gigs.filter(g => g.status === 'active').length;
  }

  getTotalOrders(): number {
    return this.gigs.reduce((sum, g) => sum + (g.ordersCompleted || 0), 0);
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const t = await this.toast.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
