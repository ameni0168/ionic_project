// src/app/pages/freelancer-dashboard/freelancer-dashboard.page.ts
// VERSION MODIFIÉE avec intégration API

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, LoadingController, ToastController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService } from '../../services/api.service';  // ← AJOUT

interface StatCard {
  icon: string;
  value: string;
  label: string;
  color: string;
  trend?: string;
}

interface QuickAction {
  icon: string;
  title: string;
  route: string;
  color: string;
  badge?: number;
}

interface RecentActivity {
  type: 'order' | 'message' | 'payment' | 'review';
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-freelancer-dashboard',
  templateUrl: './freelancer-dashboard.page.html',
  styleUrls: ['./freelancer-dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class FreelancerDashboardPage implements OnInit {
  userName = 'Loading...';  // ← MODIFIÉ: Sera chargé depuis l'API
  profileImage = 'assets/avatar.jpg';
  currentTab = 'home';
  isLoading = true;  // ← AJOUT: Pour afficher un loading
  
  stats: StatCard[] = [
    {
      icon: 'briefcase',
      value: '...',  // ← MODIFIÉ: Sera chargé depuis l'API
      label: 'Active Gigs',
      color: 'primary',
      trend: '...'
    },
    {
      icon: 'cash',
      value: '$...',
      label: 'This Month',
      color: 'success',
      trend: '...'
    },
    {
      icon: 'star',
      value: '...',
      label: 'Rating',
      color: 'warning',
      trend: '...'
    },
    {
      icon: 'checkmark-done',
      value: '...',
      label: 'Completed',
      color: 'tertiary',
      trend: '...'
    }
  ];

  quickActions: QuickAction[] = [
    {
      icon: 'add-circle',
      title: 'Create Gig',
      route: '/create-gig',
      color: 'primary'
    },
    {
      icon: 'document-text',
      title: 'My Orders',
      route: '/orders',
      color: 'secondary',
      badge: 0  // ← MODIFIÉ: Sera chargé depuis l'API
    },
    {
      icon: 'chatbubbles',
      title: 'Messages',
      route: '/messages',
      color: 'tertiary',
      badge: 0
    },
    {
      icon: 'wallet',
      title: 'Earnings',
      route: '/wallet',
      color: 'success'
    }
  ];

  recentActivities: RecentActivity[] = [];  // ← MODIFIÉ: Sera chargé depuis l'API

  // ← AJOUT: Injection du service API
  constructor(
    private navCtrl: NavController,
    private api: ApiService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadDashboardData();  // ← AJOUT: Charger les données au démarrage
  }

  // ← AJOUT: Nouvelle fonction pour charger les données
  async loadDashboardData() {
    const loading = await this.loadingCtrl.create({
      message: 'Loading dashboard...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // 1. Charger le compte freelancer
      const accountResponse = await this.api.getFreelancerAccount().toPromise();
      const profile = accountResponse.profile;
      const profileStats = profile.stats;

      // Mettre à jour le nom d'utilisateur
      this.userName = profile.fullName || 'Freelancer';
      
      // 2. Charger les statistiques des gigs
      const gigsStatsResponse = await this.api.getGigsStats().toPromise();

      // 3. Mettre à jour les stats cards
      this.stats[0].value = gigsStatsResponse.activeGigs.toString();
      this.stats[0].trend = `Total: ${gigsStatsResponse.totalGigs}`;

      // Pour le moment, This Month = $0 (à implémenter avec wallet)
      this.stats[1].value = '$0';
      this.stats[1].trend = '+0%';

      this.stats[2].value = profileStats.rating ? profileStats.rating.toFixed(1) : '0.0';
      this.stats[2].trend = `${profileStats.totalReviews || 0} reviews`;

      this.stats[3].value = (profileStats.completedProjects || 0).toString();
      this.stats[3].trend = 'All time';

      // 4. Charger les activités récentes (mock pour l'instant)
      this.loadRecentActivities();

      this.isLoading = false;
      await loading.dismiss();

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      this.isLoading = false;
      await loading.dismiss();

      // Afficher un toast d'erreur
      const toast = await this.toastCtrl.create({
        message: error.error?.error || 'Error loading dashboard data',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();

      // Valeurs par défaut en cas d'erreur
      this.userName = 'Freelancer';
      this.stats[0].value = '0';
      this.stats[1].value = '$0';
      this.stats[2].value = '0.0';
      this.stats[3].value = '0';
    }
  }

  // ← AJOUT: Charger les activités récentes (mock pour l'instant)
  loadRecentActivities() {
    // TODO: Remplacer par un vrai call API quand le backend sera prêt
    this.recentActivities = [
      {
        type: 'order',
        title: 'New Order Received',
        description: 'Logo Design from John Doe',
        time: '2 min ago',
        icon: 'bag-check',
        color: 'success'
      },
      {
        type: 'message',
        title: 'New Message',
        description: 'Jane Smith sent you a message',
        time: '1 hour ago',
        icon: 'chatbubble-ellipses',
        color: 'primary'
      }
    ];
  }

  // ← MODIFIÉ: Refresh manuel
  async doRefresh(event: any) {
    await this.loadDashboardData();
    event.target.complete();
  }

  navigateTo(route: string) {
    console.log('Navigating to:', route);
    this.navCtrl.navigateForward([route]);
  }

  navigateToProfile() {
    this.navCtrl.navigateForward(['/freelancer-profile']);
  }

  navigateToNotifications() {
    this.navCtrl.navigateForward(['/notifications']);
  }

  viewAllActivities() {
    this.navCtrl.navigateForward(['/activities']);
  }

  onActivityClick(activity: RecentActivity) {
    switch(activity.type) {
      case 'order':
        this.navCtrl.navigateForward(['/orders']);
        break;
      case 'message':
        this.navCtrl.navigateForward(['/messages']);
        break;
      case 'payment':
        this.navCtrl.navigateForward(['/wallet']);
        break;
      case 'review':
        this.navCtrl.navigateForward(['/reviews']);
        break;
    }
  }

  onTabClick(tab: string) {
    this.currentTab = tab;
    
    switch(tab) {
      case 'home':
        const content = document.querySelector('ion-content');
        if (content) {
          content.scrollToTop(300);
        }
        break;
      case 'gigs':
        this.navCtrl.navigateForward(['/my-gigs']);
        break;
      case 'orders':
        this.navCtrl.navigateForward(['/orders']);
        break;
      case 'messages':
        this.navCtrl.navigateForward(['/messages']);
        break;
      case 'profile':
        this.navCtrl.navigateForward(['/freelancer-profile']);
        break;
    }
  }
}