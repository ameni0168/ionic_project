import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';

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
  userName = 'Sarah Johnson';
  profileImage = 'assets/avatar.jpg';
  currentTab = 'home'; // Track current tab
  
  stats: StatCard[] = [
    {
      icon: 'briefcase',
      value: '12',
      label: 'Active Gigs',
      color: 'primary',
      trend: '+2'
    },
    {
      icon: 'cash',
      value: '$2.4k',
      label: 'This Month',
      color: 'success',
      trend: '+15%'
    },
    {
      icon: 'star',
      value: '4.9',
      label: 'Rating',
      color: 'warning',
      trend: '38 reviews'
    },
    {
      icon: 'checkmark-done',
      value: '47',
      label: 'Completed',
      color: 'tertiary',
      trend: 'All time'
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
      badge: 3
    },
    {
      icon: 'chatbubbles',
      title: 'Messages',
      route: '/messages',
      color: 'tertiary',
      badge: 5
    },
    {
      icon: 'wallet',
      title: 'Earnings',
      route: '/wallet',
      color: 'success'
    }
  ];

  recentActivities: RecentActivity[] = [
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
    },
    {
      type: 'payment',
      title: 'Payment Received',
      description: '$150 for Web Development',
      time: '3 hours ago',
      icon: 'cash',
      color: 'success'
    },
    {
      type: 'review',
      title: 'New Review',
      description: '5 stars from Mike Johnson',
      time: '1 day ago',
      icon: 'star',
      color: 'warning'
    }
  ];

  constructor(private navCtrl: NavController) {}

  ngOnInit() {
    console.log('Dashboard loaded');
  }

  navigateTo(route: string) {
    console.log('Navigating to:', route);
    this.navCtrl.navigateForward([route]);
  }

  navigateToProfile() {
    console.log('Navigate to profile');
    this.navCtrl.navigateForward(['/freelancer-profile']);
  }

  navigateToNotifications() {
    console.log('Navigate to notifications');
    this.navCtrl.navigateForward(['/notifications']);
  }

  viewAllActivities() {
    console.log('View all activities');
    this.navCtrl.navigateForward(['/activities']);
  }

  onActivityClick(activity: RecentActivity) {
    console.log('Activity clicked:', activity);
    // Navigate based on activity type
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
    console.log('Tab clicked:', tab);
    this.currentTab = tab;
    
    // Navigation based on tab
    switch(tab) {
      case 'home':
        // Already on home, scroll to top
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