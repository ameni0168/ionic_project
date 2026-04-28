import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SprintService, Sprint } from '../../services/sprint.service';
import { ContractService } from '../../services/contract.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sprint-review',
  templateUrl: './sprint-review.page.html',
  styleUrls: ['./sprint-review.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class SprintReviewPage implements OnInit {
  sprintId = '';
  sprint: Sprint | null = null;
  feedback = '';
  reviewing = false;
  userId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private sprintService: SprintService,
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.sprintId = this.route.snapshot.paramMap.get('sprintId') || '';
    this.userId = this.apiService.getUserId();
    this.loadSprint();
  }

  loadSprint() {
    this.reviewing = true;
    // In production, fetch sprint details from API
    // For now, we'll navigate with state or use contract detail
    this.reviewing = false;
  }

  async approveSprint() {
    const alert = await this.alertCtrl.create({
      header: 'Approve Sprint',
      message: 'Approve this sprint and release payment?',
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

  async requestChanges() {
    if (!this.feedback.trim()) {
      this.showToast('Please provide feedback for changes', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Request Changes',
      message: 'Ask the freelancer to revise this sprint?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Request',
          handler: () => {
            this.submitReview('request_changes');
          },
        },
      ],
    });
    await alert.present();
  }

  private submitReview(action: 'approve' | 'request_changes') {
    this.reviewing = true;
    this.sprintService.reviewSprint(this.sprintId, {
      action,
      feedback: this.feedback || undefined,
      reviewed_by: this.userId || undefined,
    }).subscribe({
      next: () => {
        this.showToast(
          action === 'approve' ? 'Sprint approved and payment released' : 'Changes requested',
          'success'
        );
        this.reviewing = false;
        this.navCtrl.navigateBack(['/contract-detail', this.sprint?.contract_id]);
      },
      error: (err: any) => {
        this.showToast(err.error?.error || 'Review failed', 'danger');
        this.reviewing = false;
      },
    });
  }

  getStatusLabel(status: string): string {
    return SprintService.getStatusLabel(status as any);
  }

  getStatusColor(status: string): string {
    return SprintService.getStatusColor(status as any);
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
