import { WelcomePage } from './../welcome/welcome.page';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.page.html',
  styleUrls: ['./accueil.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
  ]
})
export class AccueilPage {

  showContent = true;

  categories = [
    { icon: '💻', name: 'Development', count: '8,200+' },
    { icon: '🎨', name: 'Design', count: '5,400+' },
    { icon: '📣', name: 'Marketing', count: '3,100+' },
    { icon: '✍️', name: 'Writing', count: '2,800+' },
    { icon: '🎬', name: 'Video', count: '1,900+' },
    { icon: '📊', name: 'Data Science', count: '2,300+' },
    { icon: '💰', name: 'Finance', count: '1,500+' },
    { icon: '📱', name: 'Mobile Apps', count: '3,700+' },
  ];

  freelancers = [
    { avatar: '👩‍💻', name: 'Sarah M.', title: 'Full Stack Developer', tags: ['React', 'Node.js', 'AWS'], rate: '$85', rating: '4.9', reviews: 142 },
    { avatar: '🧑‍🎨', name: 'Carlos R.', title: 'UI/UX Designer', tags: ['Figma', 'Branding', 'Motion'], rate: '$70', rating: '5.0', reviews: 98 },
    { avatar: '👨‍💼', name: 'Ahmed K.', title: 'Data Scientist', tags: ['Python', 'ML', 'SQL'], rate: '$95', rating: '4.8', reviews: 76 },
    { avatar: '👩‍💻', name: 'Léa T.', title: 'Mobile Developer', tags: ['Flutter', 'Ionic', 'Firebase'], rate: '$80', rating: '4.9', reviews: 110 },
  ];

  constructor(private navCtrl: NavController, private router: Router) {}

  goToPostJob() {
    this.router.navigate(['/post-job']);
  }

  goToSignIn() {
    this.router.navigate(['/auth/login']);
  }

  goToSignUp() {
    this.router.navigate(['/welcome']);
  }

  goToFindWork() {
    this.router.navigate(['/find-work']);
  }

  goToHireFreelancer() {
    this.router.navigate(['/hire']);
  }

}