import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';

interface StatCard {
  icon: string;
  value: string;
  label: string;
  color: string;
}

interface MenuItem {
  icon: string;
  title: string;
  route: string;
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
  userName = 'Sarah Johnson';
  
  stats: StatCard[] = [
    {
      icon: 'briefcase-outline',
      value: '12',
      label: 'Active Gigs',
      color: 'primary'
    },
    {
      icon: 'cash-outline',
      value: '$2.4k',
      label: 'Earnings',
      color: 'success'
    },
    {
      icon: 'star-outline',
      value: '4.9',
      label: 'Reviews',
      color: 'warning'
    }
  ];

  menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      title: 'My Profile',
      route: '/freelancer-profile',
      color: 'danger'
    },
    {
      icon: 'briefcase-outline',
      title: 'My Gigs',
      route: '/my-gigs',
      color: 'primary'
    },
    {
      icon: 'document-text-outline',
      title: 'Browse Offers',
      route: '/browse-offers',
      color: 'secondary'
    },
    {
      icon: 'chatbubble-outline',
      title: 'Messages',
      route: '/messages',
      color: 'tertiary'
    },
    {
      icon: 'storefront-outline',
      title: 'Store',
      route: '/store',
      color: 'warning'
    }
  ];

  constructor(private navCtrl: NavController) {}

  ngOnInit() {}

  navigateToProfile() {
    this.navCtrl.navigateForward(['/freelancer-profile']);
  }

  navigateTo(route: string) {
    this.navCtrl.navigateForward([route]);
  }

  logout() {
    // Implement logout logic
    this.navCtrl.navigateRoot(['/welcome']);
  }
}