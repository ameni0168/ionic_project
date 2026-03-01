
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ButtonComponent } from '../../../components/button/button.component';
import { InputFieldComponent } from '../../../components/input-field/input-field.component';

@Component({
  selector: 'app-post-job',
  templateUrl: './post-job.page.html',
  styleUrls: ['./post-job.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputFieldComponent
  ]
})
export class PostJobPage {

  jobForm!: FormGroup;
  isLoading = false;
  showContent = true;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController
  ) {
    this.initForm();
  }

  private initForm() {
    this.jobForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      budget: ['', Validators.required],
      experience: ['', Validators.required],
      deadline: ['', Validators.required],
    });
  }

  get titleControl() {
    return this.jobForm.get('title');
  }

  get descriptionControl() {
    return this.jobForm.get('description');
  }

  get categoryControl() {
    return this.jobForm.get('category');
  }

  get budgetControl() {
    return this.jobForm.get('budget');
  }

  get experienceControl() {
    return this.jobForm.get('experience');
  }

  get deadlineControl() {
    return this.jobForm.get('deadline');
  }

  onSubmit() {
    if (this.jobForm.invalid) return;

    this.isLoading = true;

    console.log('Job Data:', this.jobForm.value);

    setTimeout(() => {
      this.isLoading = false;
      this.jobForm.reset();
    }, 1500);
  }

  goBack() {
    this.navCtrl.back();
  }

}