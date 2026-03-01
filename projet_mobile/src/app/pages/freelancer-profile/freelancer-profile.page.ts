import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';

interface ProfileInfo {
  label: string;
  value: string;
  icon: string;
}

interface Skill {
  name: string;
  level: number;
}

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
  profile = {
    name: 'Sarah Johnson',
    title: 'Full Stack Developer',
    location: 'San Francisco, CA',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    hourlyRate: '$85',
    completedProjects: 47,
    rating: 4.9,
    reviews: 38,
    bio: 'Experienced full-stack developer with 5+ years of expertise in web and mobile applications. Specialized in React, Angular, Node.js, and cloud solutions.',
    profileImage: 'assets/avatar.jpg'
  };

  profileInfo: ProfileInfo[] = [
    {
      label: 'Email',
      value: 'sarah.johnson@email.com',
      icon: 'mail-outline'
    },
    {
      label: 'Phone',
      value: '+1 (555) 123-4567',
      icon: 'call-outline'
    },
    {
      label: 'Location',
      value: 'San Francisco, CA',
      icon: 'location-outline'
    },
    {
      label: 'Hourly Rate',
      value: '$85/hour',
      icon: 'cash-outline'
    }
  ];

  skills: Skill[] = [
    { name: 'React', level: 90 },
    { name: 'Angular', level: 85 },
    { name: 'Node.js', level: 88 },
    { name: 'TypeScript', level: 92 },
    { name: 'MongoDB', level: 80 },
    { name: 'AWS', level: 75 }
  ];

  constructor(private navCtrl: NavController) {}

  ngOnInit() {}

  goBack() {
    this.navCtrl.navigateBack(['/freelancer-dashboard']);
  }

  editProfile() {
    // Navigate to edit profile page
    console.log('Edit profile');
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }
}