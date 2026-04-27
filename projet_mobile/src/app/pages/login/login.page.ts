import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  redirectTo: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private navCtrl: NavController,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
    setTimeout(() => {
      this.showContent = true;
    }, 100);
  }

  get emailControl() { return this.loginForm.get('email'); }
  get passwordControl() { return this.loginForm.get('password'); }

  async onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const formData = this.loginForm.value;

      this.api.login(formData).subscribe({
        next: (res: any) => {
          this.isLoading = false;

          const target = this.getRedirectUrl(res.role);
          if (target) {
            this.router.navigateByUrl(target);
            return;
          }

          if (res.role === 'client') {
            this.navCtrl.navigateRoot(['/client-dashboard']);
          } else if (res.role === 'freelancer') {
            this.navCtrl.navigateRoot(['/freelancer-dashboard']);
          } else {
            alert('Role inconnu');
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          alert(err.error?.error || 'Erreur serveur');
        }
      });
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  goBack() {
    this.navCtrl.navigateBack('/welcome');
  }

  navigateToWelcome() {
    this.navCtrl.navigateForward('/welcome', {
      queryParams: this.redirectTo ? { redirectTo: this.redirectTo } : undefined
    });
  }

  navigateToForgotPassword() {
    console.log('Navigate to forgot password');
  }

  private getRedirectUrl(role: string): string | null {
    if (!this.redirectTo) {
      return null;
    }

    const allowedByRole: Record<string, string[]> = {
      client: ['/post-job', '/hire-freelancers'],
      freelancer: ['/jobs'],
    };

    return allowedByRole[role]?.includes(this.redirectTo) ? this.redirectTo : null;
  }
}
