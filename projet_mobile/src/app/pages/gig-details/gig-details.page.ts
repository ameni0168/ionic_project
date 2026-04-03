import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

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
  selector: 'app-gig-details',
  templateUrl: './gig-details.page.html',
  styleUrls: ['./gig-details.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class GigDetailsPage implements OnInit {

  gig: Gig | null = null;
  isLoading = true;
  isEditing = false;
  isSaving  = false;

  editData = {
    title: '', description: '', price: 0,
    category: '', deliveryTime: '',
    status: 'pending' as 'active' | 'pending' | 'paused',
    colorAccent: ''
  };

  statusOptions = [
    { value: 'active',  label: 'Active',  icon: 'checkmark-circle' },
    { value: 'pending', label: 'Pending', icon: 'time'             },
    { value: 'paused',  label: 'Paused',  icon: 'pause-circle'     }
  ];

  colorOptions = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#ef4444'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,           // ← Router (pas juste NavController)
    private navCtrl: NavController,
    private api: ApiService,
    private toast: ToastController,
    private alert: AlertController
  ) {}

  ngOnInit() {
    /**
     * Dans Ionic avec standalone + NavController.navigateForward(),
     * le state est accessible via this.router.getCurrentNavigation()
     * UNIQUEMENT pendant la navigation (dans le constructeur ou ngOnInit immédiat).
     *
     * Si getCurrentNavigation() est null (reload / accès direct),
     * on charge via l'API avec l'id de l'URL.
     */
    const nav = this.router.getCurrentNavigation();
    const stateGig = nav?.extras?.state?.['gig'] as Gig | undefined;

    if (stateGig && stateGig.id) {
      // Cas nominal : navigation depuis my-gigs
      console.log('Gig reçu via state:', stateGig);
      this.gig = stateGig;
      this.initEditData();
      this.isLoading = false;
    } else {
      // Cas fallback : reload ou accès direct /gig-details/XXXX
      console.log('State vide → chargement via API');
      this.loadFromApi();
    }
  }

  loadFromApi() {
    const gigId = this.route.snapshot.paramMap.get('id');
    console.log('ID depuis URL:', gigId);

    if (!gigId) {
      this.isLoading = false;
      return;
    }

    this.api.getMyGigs().subscribe({
      next: (data: { gigs: Gig[] }) => {
        this.gig = data.gigs.find(g => g.id === gigId) ?? null;
        console.log('Gig trouvé via API:', this.gig);
        if (this.gig) this.initEditData();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Impossible de charger le gig', 'danger');
      }
    });
  }

  initEditData() {
    if (!this.gig) return;
    this.editData = {
      title:        this.gig.title,
      description:  this.gig.description,
      price:        this.gig.price,
      category:     this.gig.category,
      deliveryTime: this.gig.deliveryTime,
      status:       this.gig.status,
      colorAccent:  this.gig.colorAccent
    };
  }

  // ── Édition ────────────────────────────────────────────────────────────────

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) this.initEditData();
  }

  saveChanges(): void {
    if (!this.gig) { this.showToast('Gig non trouvé', 'warning'); return; }
    if (!this.editData.title.trim()) { this.showToast('Le titre est obligatoire', 'warning'); return; }
    if (this.editData.price <= 0) { this.showToast('Le prix doit être positif', 'warning'); return; }

    this.isSaving = true;
    this.api.updateGig(this.gig.id, this.editData).subscribe({
      next: () => {
        this.gig      = { ...this.gig!, ...this.editData };
        this.isEditing = false;
        this.isSaving  = false;
        this.showToast('Gig mis à jour !', 'success');
      },
      error: (err: any) => {
        this.isSaving = false;
        this.showToast(err?.error?.error || 'Erreur lors de la mise à jour', 'danger');
      }
    });
  }

  // ── Suppression ────────────────────────────────────────────────────────────

  async confirmDelete() {
    if (!this.gig) return;
    const a = await this.alert.create({
      header:  'Supprimer ce gig ?',
      message: `"${this.gig.title}" sera définitivement supprimé.`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Supprimer', role: 'destructive', handler: () => {
          this.api.deleteGig(this.gig!.id).subscribe({
            next: () => { this.showToast('Gig supprimé', 'success'); this.goBack(); },
            error: () => this.showToast('Erreur suppression', 'danger')
          });
        }}
      ]
    });
    await a.present();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  goBack() { this.navCtrl.navigateBack(['/my-gigs']); }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getStatusColor(s: string) {
    return ({ active:'success', pending:'warning', paused:'medium' } as any)[s] ?? 'medium';
  }
  getStatusIcon(s: string) {
    return ({ active:'checkmark-circle', pending:'time', paused:'pause-circle' } as any)[s] ?? 'ellipse';
  }

  async showToast(message: string, color: 'success'|'danger'|'warning' = 'success') {
    const t = await this.toast.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}