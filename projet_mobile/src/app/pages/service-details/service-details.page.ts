// src/app/pages/gig-detail/gig-detail.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { ActivatedRoute }    from '@angular/router';
import { CatalogService }    from 'src/app/services/catalog.service';

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
  openOrderModal()  { this.orderForm = { message: '', requirements: '' }; this.orderError = ''; this.showOrderModal = true; }
  closeOrderModal() { this.showOrderModal = false; }

  submitOrder() {
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
