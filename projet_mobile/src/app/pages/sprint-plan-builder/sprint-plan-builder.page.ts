import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SprintPlanService, SprintPlanItem } from '../../services/sprint-plan.service';
import { ContractService } from '../../services/contract.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sprint-plan-builder',
  templateUrl: './sprint-plan-builder.page.html',
  styleUrls: ['./sprint-plan-builder.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class SprintPlanBuilderPage implements OnInit {
  contractId = '';
  planId: string | null = null;
  summary = '';
  currency = 'USD';
  sprints: SprintPlanItem[] = [];

  loading = false;
  submitting = false;
  userId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private sprintPlanService: SprintPlanService,
    private contractService: ContractService,
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.contractId = this.route.snapshot.paramMap.get('contractId') || '';
    this.planId = this.route.snapshot.paramMap.get('planId') || null;
    this.userId = this.apiService.getUserId();

    if (this.planId) {
      this.loadPlan(this.planId);
    } else {
      this.addSprint();
    }
  }

  loadPlan(planId: string) {
    this.loading = true;
    this.sprintPlanService.getSprintPlanById(planId).subscribe({
      next: (res: any) => {
        this.summary = res.summary;
        this.currency = res.currency;
        this.sprints = res.sprints.map((s: any, index: number) => ({
          ...s,
          sequence: index + 1,
        }));
        this.loading = false;
      },
      error: () => {
        this.showToast('Failed to load plan', 'danger');
        this.loading = false;
      },
    });
  }

  addSprint() {
    this.sprints.push({
      sequence: this.sprints.length + 1,
      title: '',
      description: '',
      goals: [],
      deliverables: [],
      duration_days: 5,
      price_cents: 0,
      max_revisions: 2,
    });
  }

  removeSprint(index: number) {
    this.sprints.splice(index, 1);
    this.reorderSprints();
  }

  reorderSprints() {
    this.sprints.forEach((s, i) => (s.sequence = i + 1));
  }

  moveSprint(index: number, direction: number) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.sprints.length) return;
    const temp = this.sprints[index];
    this.sprints[index] = this.sprints[newIndex];
    this.sprints[newIndex] = temp;
    this.reorderSprints();
  }

  addGoal(sprintIndex: number) {
    if (!this.sprints[sprintIndex].goals) this.sprints[sprintIndex].goals = [];
    this.sprints[sprintIndex].goals!.push('');
  }

  removeGoal(sprintIndex: number, goalIndex: number) {
    this.sprints[sprintIndex].goals!.splice(goalIndex, 1);
  }

  addDeliverable(sprintIndex: number) {
    if (!this.sprints[sprintIndex].deliverables) this.sprints[sprintIndex].deliverables = [];
    this.sprints[sprintIndex].deliverables!.push('');
  }

  removeDeliverable(sprintIndex: number, delivIndex: number) {
    this.sprints[sprintIndex].deliverables!.splice(delivIndex, 1);
  }

  get totalPriceCents(): number {
    return this.sprints.reduce((sum, s) => sum + (Number(s.price_cents) || 0), 0);
  }

  get totalDurationDays(): number {
    return this.sprints.reduce((sum, s) => sum + (Number(s.duration_days) || 0), 0);
  }

  validate(): string | null {
    if (!this.summary.trim()) return 'Summary is required';
    if (this.sprints.length === 0) return 'At least one sprint is required';
    for (let i = 0; i < this.sprints.length; i++) {
      const s = this.sprints[i];
      if (!s.title.trim()) return `Sprint ${i + 1} title is required`;
      if (!s.duration_days || s.duration_days <= 0) return `Sprint ${i + 1} must have a positive duration`;
      if (s.price_cents < 0) return `Sprint ${i + 1} price cannot be negative`;
    }
    return null;
  }

  saveDraft() {
    const error = this.validate();
    if (error) {
      this.showToast(error, 'warning');
      return;
    }

    this.submitting = true;
    const payload = {
      summary: this.summary,
      currency: this.currency,
      sprints: this.sprints.map(s => ({
        ...s,
        price_cents: Number(s.price_cents),
        duration_days: Number(s.duration_days),
        max_revisions: Number(s.max_revisions) || 2,
      })),
      created_by: this.userId || undefined,
    };

    if (this.planId) {
      this.sprintPlanService.updateSprintPlan(this.planId, payload).subscribe({
        next: () => {
          this.showToast('Plan updated', 'success');
          this.submitting = false;
        },
        error: (err: any) => {
          this.showToast(err.error?.error || 'Failed to update plan', 'danger');
          this.submitting = false;
        },
      });
    } else {
      this.sprintPlanService.createSprintPlan(this.contractId, payload).subscribe({
        next: (res: any) => {
          this.planId = res.sprint_plan._id;
          this.showToast('Plan created', 'success');
          this.submitting = false;
        },
        error: (err: any) => {
          this.showToast(err.error?.error || 'Failed to create plan', 'danger');
          this.submitting = false;
        },
      });
    }
  }

  submitPlan() {
    const error = this.validate();
    if (error) {
      this.showToast(error, 'warning');
      return;
    }

    this.saveDraft();

    if (!this.planId) {
      this.showToast('Save the plan first before submitting', 'warning');
      return;
    }

    this.submitting = true;
    this.sprintPlanService.submitSprintPlan(this.planId, this.userId || undefined).subscribe({
      next: () => {
        this.showToast('Plan submitted for review', 'success');
        this.submitting = false;
        this.navCtrl.navigateBack(['/contract-detail', this.contractId]);
      },
      error: (err: any) => {
        this.showToast(err.error?.error || 'Failed to submit plan', 'danger');
        this.submitting = false;
      },
    });
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  goBack() {
    window.history.back();
  }

  formatCents(cents: number): string {
    return ContractService.formatCents(cents, this.currency);
  }
}

