import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../components/button/button.component';
import { InputFieldComponent } from '../../components/input-field/input-field.component';
import { JobService } from '../../services/job.service';
import { ApiService } from 'src/app/services/api.service';
import { MarketplaceContentService } from 'src/app/services/marketplace-content.service';

@Component({
  selector: 'app-post-job',
  templateUrl: './post-job.page.html',
  styleUrls: ['./post-job.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgForOf,
    IonicModule,
    ReactiveFormsModule,
    HttpClientModule,
    ButtonComponent,
    InputFieldComponent
  ]
})
export class PostJobPage implements OnInit {
  jobForm!: FormGroup;
  isLoading  = false;
  showContent = true;
  categories: string[] = [];

  // Skills chip logic
  skills: string[]  = [];
  skillInput: string = '';

  constructor(
    private fb:        FormBuilder,
    private navCtrl:   NavController,
    private router: Router,
    private jobService: JobService,
    private toastCtrl: ToastController,
    private api: ApiService,
    private marketplaceContent: MarketplaceContentService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  // ── Form init ────────────────────────────────────────────────
  private initForm() {
    this.jobForm = this.fb.group({
      title:            ['', Validators.required],
      description:      ['', Validators.required],
      category:         ['', Validators.required],
      budget_type:      ['fixed', Validators.required],   // default: fixed
      budget_min:       ['', [Validators.required, Validators.min(0)]],
      budget_max:       ['', [Validators.required, Validators.min(0)]],
      deadline:         ['', Validators.required],
      experience_level: ['', Validators.required],
    });
  }

  // ── Getters ──────────────────────────────────────────────────
  get titleControl()          { return this.jobForm.get('title'); }
  get descriptionControl()    { return this.jobForm.get('description'); }
  get categoryControl()       { return this.jobForm.get('category'); }
  get budgetMinControl()      { return this.jobForm.get('budget_min'); }
  get budgetMaxControl()      { return this.jobForm.get('budget_max'); }
  get deadlineControl()       { return this.jobForm.get('deadline'); }
  get experienceLevelControl(){ return this.jobForm.get('experience_level'); }

  // ── Budget type toggle ───────────────────────────────────────
  setBudgetType(type: 'fixed' | 'hourly') {
    this.jobForm.get('budget_type')?.setValue(type);
  }

  // ── Experience level ─────────────────────────────────────────
  setExperience(level: 'beginner' | 'intermediate' | 'expert') {
    this.jobForm.get('experience_level')?.setValue(level);
  }

  // ── Skills chip logic ────────────────────────────────────────
  addSkill(event: Event) {
    event.preventDefault();
    const value = this.skillInput.trim();
    if (value && !this.skills.includes(value)) {
      this.skills.push(value);
    }
    this.skillInput = '';
  }

  removeSkill(skill: string) {
    this.skills = this.skills.filter(s => s !== skill);
  }

  // ── Submit ───────────────────────────────────────────────────
  onSubmit() {
    if (this.jobForm.invalid) {
      this.jobForm.markAllAsTouched();
      return;
    }

    const clientId = this.api.getUserId()?.trim();
    const role = this.api.getUserRole();

    if (!clientId || role !== 'client') {
      void this.showToast('Inscription client obligatoire avant la publication.', 'danger');
      this.router.navigate(['/welcome'], { queryParams: { redirectTo: '/post-job' } });
      return;
    }

    this.isLoading = true;

    const jobData = {
      title:            this.jobForm.value.title,
      description:      this.jobForm.value.description,
      category:         this.jobForm.value.category,
      budget_type:      this.jobForm.value.budget_type,
      budget_min:       Number(this.jobForm.value.budget_min),
      budget_max:       Number(this.jobForm.value.budget_max),
      deadline:         this.jobForm.value.deadline,
      experience_level: this.jobForm.value.experience_level,
      skills:           this.skills,
      client_id:        clientId,
    };

    this.jobService.postJob(jobData).subscribe({
      next: async () => {
        this.isLoading = false;
        await this.showToast('Job envoye. En attente de validation admin.', 'success');
        this.jobForm.reset();
        this.skills = [];
        this.navCtrl.back();
      },
      error: async (err) => {
        this.isLoading = false;
        console.error('Error posting job:', err);
        await this.showToast('Failed to post job. Please try again.', 'danger');
      }
    });
  }

  // ── Toast helper ─────────────────────────────────────────────
  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }

  goBack() {
    this.navCtrl.back();
  }

  private loadCategories() {
    this.marketplaceContent.getDynamicCategories(12).subscribe({
      next: (categories) => {
        this.categories = categories.map((category) => category.name);
      },
      error: () => {
        this.categories = [];
      },
    });
  }
}
