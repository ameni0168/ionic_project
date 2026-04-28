import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SprintPlanService, SprintPlan } from '../../services/sprint-plan.service';
import { ContractService } from '../../services/contract.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sprint-plan-review',
  templateUrl: './sprint-plan-review.page.html',
  styleUrls: ['./sprint-plan-review.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class SprintPlanReviewPage implements OnInit {
  planId = '';
  plan: SprintPlan | null = null;
  feedback = '';
  reviewing = false;
  userId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private sprintPlanService: SprintPlanService,
    private contractService: ContractService,
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.planId = this.route.snapshot.paramMap.get('planId') || '';
    this.userId = this.apiService.getUserId();
    this.loadPlan();
  }

  loadPlan() {
    this.reviewing = true;
    this.sprintPlanService.getSprintPlanById(this.planId).subscribe({
      next: (res: any) => {
        this.plan = res;
        this.reviewing = false;
      },
      error: () => {
        this.showToast('Failed to load plan', 'danger');
        this.reviewing = false;
      },
    });
  }

  async approvePlan() {
    const alert = await this.alertCtrl.create({
      header: 'Approve Plan',
      message: 'Approve this sprint plan? This will create executable sprints.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Approve',
          handler: () => {
            this.submitReview('approve');
          },
        },
      ],
    });
    await alert.present();
  }

  async requestRevision() {
    if (!this.feedback.trim()) {
      this.showToast('Please provide feedback for revision', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Request Revision',
      message: 'Ask the freelancer to revise this plan?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Request',
          handler: () => {
            this.submitReview('request_revision');
          },
        },
      ],
    });
    await alert.present();
  }

  private submitReview(action: 'approve' | 'request_revision') {
    this.reviewing = true;
    this.sprintPlanService.reviewSprintPlan(this.planId, {
      action,
      feedback: this.feedback || undefined,
      reviewed_by: this.userId || undefined,
    }).subscribe({
      next: () => {
        this.showToast(
          action === 'approve' ? 'Plan approved successfully' : 'Revision requested',
          'success'
        );
        this.reviewing = false;
        this.navCtrl.navigateBack(['/contract-detail', this.plan?.contract_id]);
      },
      error: (err: any) => {
        this.showToast(err.error?.error || 'Review failed', 'danger');
        this.reviewing = false;
      },
    });
  }

  getStatusLabel(status: string): string {
    return SprintPlanService.getStatusLabel(status as any);
  }

  getStatusColor(status: string): string {
    return SprintPlanService.getStatusColor(status as any);
  }

  formatCents(cents: number, currency: string): string {
    return ContractService.formatCents(cents, currency);
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
}

