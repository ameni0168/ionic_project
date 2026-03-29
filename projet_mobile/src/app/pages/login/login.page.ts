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
    private navCtrl: NavController,
    private api: ApiService
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

    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;

    this.api.login(this.loginForm.value).subscribe({
      next: (res: any) => {

        this.isLoading = false;

        console.log('Login success:', res);

        // ==============================
        // SAVE AUTH DATA (ONLY REAL FIELDS)
        // ==============================
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('role', res.role);
        localStorage.setItem('user_id', res.user_id);

        const role = res.role;

        // ==============================
        // REDIRECT BY ROLE
        // ==============================
        if (role === 'client') {
          this.navCtrl.navigateRoot(['/client-dashboard']);
        }

        else if (role === 'freelancer') {
          this.navCtrl.navigateRoot(['/freelancer-dashboard']);
        }

        else {
          alert('Rôle inconnu : ' + role);
          console.error('Invalid role:', role);
        }

      },

      error: (err: any) => {
        this.isLoading = false;
        console.error('Login error:', err);
        alert(err.error?.error || 'Erreur serveur');
      }
    });
  }

  goBack() {
    this.navCtrl.navigateBack('/welcome');
  }

  navigateToRegister() {
    this.navCtrl.navigateForward('/auth/client-register');
  }

  navigateToForgotPassword() {
    console.log('Forgot password clicked');
  }
}