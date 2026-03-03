import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ButtonComponent } from '../../components/button/button.component';
import { InputFieldComponent } from '../../components/input-field/input-field.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-client-register',
  templateUrl: './client-register.page.html',
  styleUrls: ['./client-register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputFieldComponent
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
export class ClientRegisterPage implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  showContent = false;

  constructor(
    private formBuilder: FormBuilder,
    private navCtrl: NavController,  // ← NavController
    private api: ApiService 
  ) {
    this.registerForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)]],
      location: ['', [Validators.required]],
      companyName: [''],
      password: ['', [Validators.required, this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    setTimeout(() => {
      this.showContent = true;
    }, 100);
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const isLengthValid = value.length >= 8;

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && isLengthValid;

    return passwordValid ? null : { weakPassword: true };
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  get fullNameControl() { return this.registerForm.get('fullName'); }
  get emailControl() { return this.registerForm.get('email'); }
  get phoneControl() { return this.registerForm.get('phone'); }
  get locationControl() { return this.registerForm.get('location'); }
  get companyNameControl() { return this.registerForm.get('companyName'); }
  get passwordControl() { return this.registerForm.get('password'); }
  get confirmPasswordControl() { return this.registerForm.get('confirmPassword'); }

  getPasswordStrength(): string {
    const password = this.passwordControl?.value || '';
    if (password.length === 0) return '';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (hasUpperCase) strength++;
    if (hasLowerCase) strength++;
    if (hasNumeric) strength++;
    if (hasSpecial) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
  }

  async onRegister() {

  if (this.registerForm.invalid) {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
    return;
  }

  this.isLoading = true;

  const formData = this.registerForm.value;

  this.api.registerClient(formData).subscribe({
    next: (response: any) => {
      this.isLoading = false;
      console.log("Registration success:", response);

      // Redirection après succès
      this.navCtrl.navigateRoot(['/clientdashboard']);
    },
    error: (error) => {
      this.isLoading = false;
      console.error("Registration error:", error);

      alert(error.error?.error || "Erreur lors de l'inscription");
    }
  });
}

  goBack() {
    this.navCtrl.navigateBack(['/welcome']);  // ← navigateBack
  }

  navigateToLogin() {
    this.navCtrl.navigateForward(['/auth/login']);  // ← navigateForward
  }
}