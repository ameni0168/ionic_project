import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ButtonComponent } from '../../components/button/button.component';
import { InputFieldComponent } from '../../components/input-field/input-field.component';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputFieldComponent,
  ],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showContent = false;

  constructor(
    private formBuilder: FormBuilder,
    private navCtrl: NavController
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    setTimeout(() => {
      this.showContent = true;
    }, 100);
  }

  get emailControl() { return this.loginForm.get('email'); }
  get passwordControl() { return this.loginForm.get('password'); }

  async onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;

      setTimeout(() => {
        this.isLoading = false;

        // TODO : remplacer par appel API réel
        const role = this.determineRole(email);

        if (role === 'client') {
          this.navCtrl.navigateForward('/client-dashboard');
        } else if (role === 'freelancer') {
          this.navCtrl.navigateForward('/freelancer-dashboard');
        }
      }, 2000);
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  goBack() {
    this.navCtrl.navigateBack('/welcome');
  }

  navigateToRegister() {
    this.navCtrl.navigateForward('/auth/client-register');
  }

  navigateToForgotPassword() {
    // TODO : implémenter la navigation réelle
    console.log('Navigate to forgot password');
  }

  private determineRole(email: string): 'client' | 'freelancer' {
    return email.includes('freelancer') ? 'freelancer' : 'client';
  }
}