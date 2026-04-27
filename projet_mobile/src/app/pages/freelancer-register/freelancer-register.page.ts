import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ButtonComponent } from '../../components/button/button.component';
import { InputFieldComponent } from '../../components/input-field/input-field.component';
import { ApiService } from '../../services/api.service';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  data?: string;
}

@Component({
  selector: 'app-freelancer-register',
  templateUrl: './freelancer-register.page.html',
  styleUrls: ['./freelancer-register.page.scss'],
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
export class FreelancerRegisterPage implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  showContent = false;
  redirectTo: string | null = null;

  cvFile: UploadedFile | null = null;
  portfolioFiles: UploadedFile[] = [];

  readonly maxCvSize = 5 * 1024 * 1024;
  readonly maxPortfolioSize = 10 * 1024 * 1024;
  readonly acceptedCvTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  readonly acceptedPortfolioTypes = ['application/pdf', 'application/zip', 'image/jpeg', 'image/png', 'image/jpg'];

  constructor(
    private formBuilder: FormBuilder,
    private navCtrl: NavController,
    private api: ApiService,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      portfolioUrl: ['', [Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)]],
      bio: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(500)]],
      password: ['', [Validators.required, this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
    setTimeout(() => {
      this.showContent = true;
    }, 100);
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const isLengthValid = value.length >= 8;

    return hasUpperCase && hasLowerCase && hasNumeric && isLengthValid ? null : { weakPassword: true };
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  get fullNameControl() { return this.registerForm.get('fullName'); }
  get emailControl() { return this.registerForm.get('email'); }
  get portfolioUrlControl() { return this.registerForm.get('portfolioUrl'); }
  get bioControl() { return this.registerForm.get('bio'); }
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

  getBioCharCount(): number {
    return this.bioControl?.value?.length || 0;
  }

  onCvFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!this.acceptedCvTypes.includes(file.type)) {
        alert('Please upload a PDF or Word document for your CV');
        return;
      }
      if (file.size > this.maxCvSize) {
        alert('CV file size must be less than 5MB');
        return;
      }

      this.cvFile = {
        name: file.name,
        size: file.size,
        type: file.type
      };
    }
  }

  onPortfolioFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];

    for (const file of files) {
      if (!this.acceptedPortfolioTypes.includes(file.type)) {
        alert(`${file.name} is not a supported file type`);
        continue;
      }
      if (file.size > this.maxPortfolioSize) {
        alert(`${file.name} is too large (max 10MB)`);
        continue;
      }

      this.portfolioFiles.push({
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  }

  removeCvFile() {
    this.cvFile = null;
  }

  removePortfolioFile(index: number) {
    this.portfolioFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getFileIcon(type: string): string {
    if (type.includes('pdf')) return 'document-text-outline';
    if (type.includes('zip')) return 'folder-outline';
    if (type.includes('image')) return 'image-outline';
    if (type.includes('word')) return 'document-outline';
    return 'document-outline';
  }

  async onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;

      this.api.registerFreelancer(this.registerForm.value).subscribe({
        next: () => {
          this.isLoading = false;
          this.navCtrl.navigateRoot(['/auth/login'], {
            queryParams: this.redirectTo ? { redirectTo: this.redirectTo } : undefined
          });
        },
        error: (err: any) => {
          this.isLoading = false;
          alert(err.error?.error || 'Erreur serveur');
        }
      });
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  goBack() {
    this.navCtrl.navigateBack(['/welcome']);
  }

  navigateToLogin() {
    this.navCtrl.navigateForward(['/auth/login'], {
      queryParams: this.redirectTo ? { redirectTo: this.redirectTo } : undefined
    });
  }
}
