import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms 200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerFade', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class WelcomePage implements OnInit {
  showContent = false;

  constructor(private navCtrl: NavController) {}  // ← Utilisez NavController au lieu de Router

  ngOnInit() {
    setTimeout(() => {
      this.showContent = true;
    }, 100);
  }

  navigateToClientAuth() {
    this.navCtrl.navigateForward(['/auth/client-register']);  // ← navigateForward au lieu de navigate
  }

  navigateToFreelancerAuth() {
    this.navCtrl.navigateForward(['/auth/freelancer-register']);  // ← navigateForward
  }

  navigateToLogin() {
    this.navCtrl.navigateForward(['/auth/login']);  // ← navigateForward
  }
}