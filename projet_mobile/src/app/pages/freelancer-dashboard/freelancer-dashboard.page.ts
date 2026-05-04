import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService } from '../../services/api.service';

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

  userName = '';
  currentTab = 'home';
  isLoading = true;

  stats = [
    { icon: 'briefcase',      value: '0',   label: 'Active Gigs',  color: 'primary',  trend: '' },
    { icon: 'cash',           value: '$0',  label: 'This Month',   color: 'success',  trend: '' },
    { icon: 'star',           value: '0',   label: 'Rating',       color: 'warning',  trend: '' },
    { icon: 'checkmark-done', value: '0',   label: 'Completed',    color: 'tertiary', trend: 'All time' }
  ];

  quickActions = [
    { icon: 'search',        title: 'Trouver du Travail', route: '/jobs',      color: 'success' },
    { icon: 'add-circle',    title: 'Créer un Gig',       route: '/my-gigs',  color: 'primary' },
    { icon: 'document-text', title: 'Mes Commandes',      route: '/orders',     color: 'secondary', badge: 0 },
    { icon: 'chatbubbles',   title: 'Messages',           route: '/conversations',   color: 'tertiary',  badge: 0 }
  ];

  recentActivities: any[] = [];

  constructor(
    private navCtrl: NavController,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading = true;
    this.api.getFreelancerDashboard().subscribe({
      next: (data: { userName: string; stats: any; recentActivities: any[]; }) => {
        this.userName = data.userName;

        const s = data.stats;
        this.stats[0].value = String(s.activeGigs);
        this.stats[1].value = `$${s.monthlyEarnings}`;
        this.stats[1].trend = '';
        this.stats[2].value = String(s.rating);
        this.stats[2].trend = `${s.reviews} reviews`;
        this.stats[3].value = String(s.totalCompleted);

        this.recentActivities = data.recentActivities;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Dashboard error:', err);
        this.isLoading = false;
      }
    });
  }

  navigateTo(route: string) {
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

  onActivityClick(activity: any) {
    switch (activity.type) {
      case 'order':   this.navCtrl.navigateForward(['/orders']);   break;
      case 'message': this.navCtrl.navigateForward(['/conversations']); break;
      case 'payment': this.navCtrl.navigateForward(['/wallet']);   break;
      case 'review':  this.navCtrl.navigateForward(['/reviews']);  break;
      default:        this.navCtrl.navigateForward(['/my-gigs']);  break;
    }
  }

  onTabClick(tab: string) {
    this.currentTab = tab;
    switch (tab) {
      case 'home':
        const content = document.querySelector('ion-content');
        if (content) content.scrollToTop(300);
        break;
      case 'gigs':     this.navCtrl.navigateForward(['/my-gigs']);             break;
      case 'orders':   this.navCtrl.navigateForward(['/orders']);              break;
      case 'messages': this.navCtrl.navigateForward(['/conversations']);       break;
      case 'profile':  this.navCtrl.navigateForward(['/freelancer-profile']); break;
    }
  }
}