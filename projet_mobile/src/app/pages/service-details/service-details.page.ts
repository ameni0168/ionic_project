// src/app/pages/gig-detail/gig-detail.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { ActivatedRoute }    from '@angular/router';
import { CatalogService }    from 'src/app/services/catalog.service';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector:    'app-gig-detail',
  templateUrl: './service-details.page.html',
  styleUrls:  ['./service-details.page.scss'],
  standalone:  true,
  imports:    [CommonModule, FormsModule, IonicModule],
})
export class ServiceDetailsPage implements OnInit {

  isLoading  = true;
  isOrdering = false;
  gig:    any = null;
  reviews:any[] = [];

  // Modal commande
  showOrderModal = false;
  orderForm = { message: '', requirements: '' };
  orderError = '';

  constructor(
    private route:      ActivatedRoute,
    public navCtrl:    NavController,
    private catalogSvc: CatalogService,
    private toastCtrl:  ToastController,
    private apiService: ApiService,
  ) {}

  ngOnInit() {
    // Données passées via navigation state (instantané)
    const nav = window.history.state;
    if (nav?.gig) {
      this.gig      = nav.gig;
      this.reviews  = nav.gig.reviews || [];
      this.isLoading = false;
      // Charger les détails frais en arrière-plan
      this._loadFresh(nav.gig.id);
    } else {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) this._loadFresh(id);
    }
  }

  private _loadFresh(id: string) {
    this.catalogSvc.getGigDetail(id).subscribe({
      next: (res: any) => {
        this.gig      = res;
        this.reviews  = res.reviews || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        if (!this.gig) this.navCtrl.back();
      },
    });
  }

  // ── ORDER ──────────────────────────────────────────────────────
  async openOrderModal()  {
    const token = this.apiService.getToken();
    const role = this.apiService.getUserRole();

    if (!token) {
      const toast = await this.toastCtrl.create({
        message: 'Connectez-vous pour passer une commande.',
        duration: 2500,
        position: 'top',
        color: 'warning',
      });
      await toast.present();
      this.navCtrl.navigateForward(['/auth/login'], {
        queryParams: { redirectTo: `/service-details/${this.gig?.id || ''}` },
      });
      return;
    }

    if (role !== 'client') {
      const toast = await this.toastCtrl.create({
        message: 'Seul un compte client peut commander un service.',
        duration: 3000,
        position: 'top',
        color: 'warning',
      });
      await toast.present();
      return;
    }

    this.orderForm = { message: '', requirements: '' };
    this.orderError = '';
    this.showOrderModal = true;
  }

  closeOrderModal() { this.showOrderModal = false; }

  submitOrder() {
    const role = this.apiService.getUserRole();
    if (role !== 'client') {
      this.orderError = 'Seul un compte client peut commander un service.';
      return;
    }

    this.orderError = '';
    this.isOrdering = true;
    this.catalogSvc.orderGig(this.gig.id, this.orderForm).subscribe({
      next: async (res: any) => {
        this.isOrdering = false;
        this.closeOrderModal();
        const toast = await this.toastCtrl.create({
          message:  'Commande envoyee avec succes !',
          duration: 3000, position: 'top', color: 'success',
        });
        toast.present();
        this.navCtrl.navigateForward(['/client-dashboard']);
      },
      error: (err: any) => {
        this.isOrdering = false;
        this.orderError = err.error?.error || 'Erreur lors de la commande';
      },
    });
  }

  // ── HELPERS ────────────────────────────────────────────────────
  getStars(r: number): any[] { return Array(Math.min(5, Math.round(r || 0))); }
  getEmptyStars(r: number): any[] { return Array(5 - Math.min(5, Math.round(r || 0))); }
  goBack() { this.navCtrl.back(); }
}
