import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ButtonComponent } from '../../../components/button/button.component';
import { InputFieldComponent } from '../../../components/input-field/input-field.component';
import { JobService } from '../../../services/job.service';

@Component({
  selector: 'app-post-job',
  templateUrl: './post-job.page.html',
  styleUrls: ['./post-job.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    HttpClientModule,        // ← needed for HTTP calls
    ButtonComponent,
    InputFieldComponent
  ]
})
export class PostJobPage {
[x: string]: any;

  jobForm!: FormGroup;
  isLoading = false;
  showContent = true;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private jobService: JobService,
    private toastCtrl: ToastController
  ) {
    this.initForm();
  }

  private initForm() {
    this.jobForm = this.fb.group({
      title:       ['', Validators.required],
      description: ['', Validators.required],
      category:    ['', Validators.required],
      budget:      ['', [Validators.required, Validators.min(1)]],
      experience:  ['', Validators.required],
      deadline:    ['', Validators.required],
    });
  }

  get titleControl()       { return this.jobForm.get('title'); }
  get descriptionControl() { return this.jobForm.get('description'); }
  get categoryControl()    { return this.jobForm.get('category'); }
  get budgetControl()      { return this.jobForm.get('budget'); }
  get experienceControl()  { return this.jobForm.get('experience'); }
  get deadlineControl()    { return this.jobForm.get('deadline'); }

  onSubmit() {
    if (this.jobForm.invalid) {
      this.jobForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    // Map form fields → backend fields
    const jobData = {
      title:            this.jobForm.value.title,
      description:      this.jobForm.value.description,
      category:         this.jobForm.value.category,
      budget_min:       this.jobForm.value.budget,
      budget_max:       this.jobForm.value.budget,
      budget_type:      'fixed',
      experience_level: this.jobForm.value.experience,
      deadline:         this.jobForm.value.deadline,
      client_id:        'user_temp_id',   // ← replace with real user ID from auth later
      skills:           []
    };

    this.jobService.postJob(jobData).subscribe({
      next: async (res) => {
        this.isLoading = false;
        await this.showToast('Job posted successfully! ✅', 'success');
        this.jobForm.reset();
        this.navCtrl.back();
      },
      error: async (err) => {
        this.isLoading = false;
        console.error('Error posting job:', err);
        await this.showToast('Failed to post job. Please try again.', 'danger');
      }
    });
  }

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
}