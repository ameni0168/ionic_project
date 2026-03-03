// src/app/pages/my-gigs/my-gigs.page.ts
// VERSION MODIFIÉE avec intégration API

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';  // ← AJOUT

@Component({
  selector: 'app-my-gigs',
  templateUrl: './my-gigs.page.html',
  styleUrls: ['./my-gigs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class MyGigsPage implements OnInit {
  gigs: any[] = [];  // ← Les gigs seront chargés depuis l'API
  loading = true;
  selectedFilter: string = 'all';  // ← AJOUT: Filtrer par statut

  // ← AJOUT: Injection des services
  constructor(
    private navCtrl: NavController,
    private api: ApiService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.loadGigs();  // ← Charger les gigs au démarrage
  }

  // ← AJOUT: Charger les gigs depuis l'API
  async loadGigs(status?: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Loading gigs...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const response = await this.api.getMyGigs(status).toPromise();
      this.gigs = response.gigs;
      this.loading = false;
      await loading.dismiss();

      console.log('Gigs loaded:', this.gigs);

      // Si aucun gig
      if (this.gigs.length === 0) {
        const toast = await this.toastCtrl.create({
          message: 'No gigs found. Create your first gig!',
          duration: 2000,
          color: 'warning',
          position: 'top'
        });
        await toast.present();
      }

    } catch (error: any) {
      console.error('Error loading gigs:', error);
      this.loading = false;
      await loading.dismiss();

      const toast = await this.toastCtrl.create({
        message: this.api.getErrorMessage(error),
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  // ← AJOUT: Refresh manuel
  async doRefresh(event: any) {
    await this.loadGigs(this.selectedFilter === 'all' ? undefined : this.selectedFilter);
    event.target.complete();
  }

  // ← AJOUT: Filtrer les gigs
  async filterGigs(filter: string) {
    this.selectedFilter = filter;
    const status = filter === 'all' ? undefined : filter;
    await this.loadGigs(status);
  }

  // ← MODIFIÉ: Voir les détails d'un gig
  viewGigDetails(gig: any) {
    this.navCtrl.navigateForward(['/gig-details', gig._id], {
      state: { gig }
    });
  }

  // ← AJOUT: Changer le statut d'un gig
  async toggleGigStatus(gig: any, event: Event) {
    event.stopPropagation();  // Empêcher la navigation

    const newStatus = gig.status === 'active' ? 'paused' : 'active';
    const statusText = newStatus === 'active' ? 'activate' : 'pause';

    const alert = await this.alertCtrl.create({
      header: `${statusText.charAt(0).toUpperCase() + statusText.slice(1)} Gig?`,
      message: `Are you sure you want to ${statusText} this gig?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: statusText.charAt(0).toUpperCase() + statusText.slice(1),
          handler: async () => {
            await this.changeStatus(gig, newStatus);
          }
        }
      ]
    });

    await alert.present();
  }

  // ← AJOUT: Changer le statut (API)
  async changeStatus(gig: any, newStatus: 'active' | 'paused') {
    const loading = await this.loadingCtrl.create({
      message: 'Updating status...'
    });
    await loading.present();

    try {
      await this.api.changeGigStatus(gig._id, newStatus).toPromise();
      
      // Mettre à jour localement
      gig.status = newStatus;

      await loading.dismiss();

      const toast = await this.toastCtrl.create({
        message: `Gig ${newStatus === 'active' ? 'activated' : 'paused'} successfully`,
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();

    } catch (error: any) {
      await loading.dismiss();

      const toast = await this.toastCtrl.create({
        message: this.api.getErrorMessage(error),
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  // ← AJOUT: Dupliquer un gig
  async duplicateGig(gig: any, event: Event) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Duplicate Gig?',
      message: 'This will create a copy of this gig.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Duplicate',
          handler: async () => {
            await this.performDuplicate(gig);
          }
        }
      ]
    });

    await alert.present();
  }

  // ← AJOUT: Effectuer la duplication (API)
  async performDuplicate(gig: any) {
    const loading = await this.loadingCtrl.create({
      message: 'Duplicating gig...'
    });
    await loading.present();

    try {
      await this.api.duplicateGig(gig._id).toPromise();
      await loading.dismiss();

      const toast = await this.toastCtrl.create({
        message: 'Gig duplicated successfully',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();

      // Recharger la liste
      await this.loadGigs();

    } catch (error: any) {
      await loading.dismiss();

      const toast = await this.toastCtrl.create({
        message: this.api.getErrorMessage(error),
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  // ← AJOUT: Supprimer un gig
  async deleteGig(gig: any, event: Event) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Delete Gig?',
      message: 'Are you sure? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.performDelete(gig);
          }
        }
      ]
    });

    await alert.present();
  }

  // ← AJOUT: Effectuer la suppression (API)
  async performDelete(gig: any) {
    const loading = await this.loadingCtrl.create({
      message: 'Deleting gig...'
    });
    await loading.present();

    try {
      await this.api.deleteGig(gig._id).toPromise();
      await loading.dismiss();

      const toast = await this.toastCtrl.create({
        message: 'Gig deleted successfully',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();

      // Recharger la liste
      await this.loadGigs();

    } catch (error: any) {
      await loading.dismiss();

      const toast = await this.toastCtrl.create({
        message: this.api.getErrorMessage(error),
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  createNewGig() {
    this.navCtrl.navigateForward(['/create-gig']);
  }

  goBack() {
    this.navCtrl.navigateBack(['/freelancer-dashboard']);
  }

  // ← AJOUT: Helpers pour l'affichage
  getStatusLabel(status: string): string {
    const labels: any = {
      'active': 'Active',
      'pending': 'Pending',
      'paused': 'Paused'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'active': 'success',
      'pending': 'warning',
      'paused': 'medium'
    };
    return colors[status] || 'medium';
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      'active': 'checkmark-circle',
      'pending': 'time',
      'paused': 'pause-circle'
    };
    return icons[status] || 'ellipse';
  }
}