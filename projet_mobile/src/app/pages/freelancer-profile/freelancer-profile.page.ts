import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-freelancer-profile',
  templateUrl: './freelancer-profile.page.html',
  styleUrls: ['./freelancer-profile.page.scss'],
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
export class FreelancerProfilePage implements OnInit {

  isLoading = true;

  profile = {
    name: '',
    title: '',
    location: '',
    email: '',
    phone: '',
    hourlyRate: '',
    completedProjects: 0,
    rating: 0,
    reviews: 0,
    bio: '',
    portfolioUrl: ''
  };

  profileInfo: { label: string; value: string; icon: string }[] = [];

  // skills : [{ name: string, level: number }]
  skills: { name: string; level: number }[] = [];

  constructor(
    private navCtrl: NavController,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    this.api.getFreelancerProfile().subscribe({
      next: (data: { fullName: any; title: any; location: any; email: any; phone: any; hourlyRate: any; completedProjects: any; rating: any; reviews: any; bio: any; portfolioUrl: any; skills: never[]; }) => {
        this.profile = {
          name: data.fullName,
          title: data.title || 'Freelancer',
          location: data.location || '',
          email: data.email,
          phone: data.phone || '',
          hourlyRate: data.hourlyRate ? `$${data.hourlyRate}` : '',
          completedProjects: data.completedProjects,
          rating: data.rating,
          reviews: data.reviews,
          bio: data.bio,
          portfolioUrl: data.portfolioUrl || ''
        };

        this.profileInfo = [
          { label: 'Email',       value: data.email,                            icon: 'mail-outline'     },
          { label: 'Phone',       value: data.phone || 'Non renseigné',         icon: 'call-outline'     },
          { label: 'Location',    value: data.location || 'Non renseigné',      icon: 'location-outline' },
          { label: 'Hourly Rate', value: data.hourlyRate ? `$${data.hourlyRate}/hour` : 'N/A', icon: 'cash-outline' }
        ];

        // skills stockés en DB : [{ name, level }]
        this.skills = data.skills || [];

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Profile error:', err);
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.navCtrl.navigateBack(['/freelancer-dashboard']);
  }

  editProfile() {
    // À implémenter : ouvrir un modal ou naviguer vers /edit-profile
    console.log('Edit profile');
  }
}