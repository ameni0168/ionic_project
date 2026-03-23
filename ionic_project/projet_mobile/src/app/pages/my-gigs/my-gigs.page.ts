import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';

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
export class MyGigsPage implements OnInit {
  gigs: Gig[] = [
    {
      id: '1',
      title: 'Professional Logo Design',
      price: 150,
      status: 'active',
      ordersCompleted: 24,
      category: 'Graphic Design',
      description: 'I will create a professional and unique logo for your business',
      deliveryTime: '3 days',
      colorAccent: '#10b981'
    },
    {
      id: '2',
      title: 'Full Stack Web Development',
      price: 500,
      status: 'pending',
      ordersCompleted: 0,
      category: 'Web Development',
      description: 'Complete full-stack web application development with modern technologies',
      deliveryTime: '7 days',
      colorAccent: '#f59e0b'
    },
    {
      id: '3',
      title: 'SEO Optimization Service',
      price: 200,
      status: 'active',
      ordersCompleted: 12,
      category: 'Digital Marketing',
      description: 'Comprehensive SEO optimization to improve your website ranking',
      deliveryTime: '5 days',
      colorAccent: '#3b82f6'
    }
  ];

  constructor(private navCtrl: NavController) {}

  ngOnInit() {}

  goBack() {
    this.navCtrl.navigateBack(['/freelancer-dashboard']);
  }

  createNewGig() {
    // Navigate to create gig page
    console.log('Create new gig');
    // this.navCtrl.navigateForward(['/create-gig']);
  }

  viewGigDetails(gig: Gig) {
    this.navCtrl.navigateForward(['/gig-details', gig.id], {
      state: { gig }
    });
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'paused': return 'Paused';
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'paused': return 'medium';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'active': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'paused': return 'pause-circle';
      default: return 'ellipse';
    }
  }
}