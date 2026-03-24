import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController, AlertController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  isEditing = false;
  isSaving = false;

  // Copie locale pour l'édition
  editData = {
    title: '',
    description: '',
    price: 0,
    category: '',
    deliveryTime: '',
    status: '' as 'active' | 'pending' | 'paused',
    colorAccent: ''
  };

  statusOptions = [
    { value: 'active',  label: 'Active',  icon: 'checkmark-circle' },
    { value: 'pending', label: 'Pending', icon: 'time' },
    { value: 'paused',  label: 'Paused',  icon: 'pause-circle' }
  ];

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private api: ApiService,
    private toast: ToastController,
    private alert: AlertController
  ) {}

  ngOnInit() {
    // Récupérer le gig passé via navigation state
    const nav = this.navCtrl as any;
    const state = history.state;
    if (state?.gig) {
      this.gig = state.gig;
      this.initEditData();
    }
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

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) this.initEditData(); // annuler : reset
  }

  saveChanges(): void {
    if (!this.gig) {
      return;
    }
    if (!this.editData.title.trim()) {
      this.showToast('Le titre est obligatoire', 'warning');
      return;
    }
    if (this.editData.price <= 0) {
      this.showToast('Le prix doit être positif', 'warning');
      return;
    }

    this.isSaving = true;
    this.api.updateGig(this.gig.id, this.editData).subscribe({
      next: () => {
        // Mise à jour locale immédiate
        this.gig = { ...this.gig!, ...this.editData };
        this.isEditing = false;
        this.isSaving = false;
        this.showToast('Gig mis à jour !', 'success');
      },
      error: (err: any) => {
        this.isSaving = false;
        const msg = err?.error?.error || 'Erreur lors de la mise à jour';
        this.showToast(msg, 'danger');
      }
    });
  }

  async confirmDelete() {
    if (!this.gig) return;
    const alertEl = await this.alert.create({
      header: 'Supprimer ce gig ?',
      message: `"${this.gig.title}" sera définitivement supprimé.`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: () => {
            this.api.deleteGig(this.gig!.id).subscribe({
              next: () => {
                this.showToast('Gig supprimé', 'success');
                this.navCtrl.navigateBack(['/my-gigs']);
              },
              error: () => this.showToast('Erreur lors de la suppression', 'danger')
            });
          }
        }
      ]
    });
    await alertEl.present();
  }

  goBack() {
    this.navCtrl.navigateBack(['/my-gigs']);
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = { active: 'success', pending: 'warning', paused: 'medium' };
    return colors[status] ?? 'medium';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = { active: 'checkmark-circle', pending: 'time', paused: 'pause-circle' };
    return icons[status] ?? 'ellipse';
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const t = await this.toast.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}