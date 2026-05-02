import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { SprintService, Sprint } from '../../services/sprint.service';

@Component({
  selector: 'app-sprint-review',
  templateUrl: './sprint-review.page.html',
  styleUrls: ['./sprint-review.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class SprintReviewPage implements OnInit {
  sprintId: string = '';
  contractId: string = '';
  sprint: Sprint | null = null;
  feedback: string = '';
  reviewing: boolean = false;
  userId: string | null = null;


  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private sprintService: SprintService,
  ) {}

  ngOnInit() {
    this.userId = localStorage.getItem('user_id');
    this.sprintId = this.route.snapshot.paramMap.get('sprintId') || '';
    this.contractId = this.route.snapshot.queryParamMap.get('contractId') || '';
    if (this.sprintId) {
      this.loadSprint();
    }
  }


  loadSprint() {
    if (!this.contractId) {
      this.showToast('Contract ID is required to load sprint', 'danger');
      return;
    }
    this.reviewing = true;
    this.sprintService.listContractSprints(this.contractId).subscribe({
      next: (res: any) => {
        this.reviewing = false;
        const items = res.items || [];
        const found = items.find((s: Sprint) => s._id === this.sprintId);
        if (found) {
          this.sprint = found;
        } else {
          this.showToast('Sprint not found', 'danger');
        }
      },
      error: (err: any) => {
        this.reviewing = false;
        const msg = err.error?.error || 'Failed to load sprint';
        this.showToast(msg, 'danger');
      },
    });
  }


  async approveSprint() {
    if (!this.sprint) return;
    if (!this.feedback.trim()) {
      this.showToast('Please provide approval feedback', 'warning');
      return;
    }
    this.reviewing = true;
    this.sprintService.reviewSprint(this.sprintId, {
      action: 'approve',
      feedback: this.feedback,
      reviewed_by: this.userId || undefined,
    }).subscribe({
      next: (res: any) => {
        this.reviewing = false;
        this.showToast(res.message || 'Sprint approved successfully', 'success');
        this.navCtrl.navigateBack('/contract-list');
      },
      error: (err: any) => {
        this.reviewing = false;
        const msg = err.error?.error || 'Failed to approve sprint';
        this.showToast(msg, 'danger');
      },
    });
  }

  async requestChanges() {
    if (!this.sprint) return;
    if (!this.feedback.trim()) {
      this.showToast('Please provide change request feedback', 'warning');
      return;
    }
    this.reviewing = true;
    this.sprintService.reviewSprint(this.sprintId, {
      action: 'request_changes',
      feedback: this.feedback,
      reviewed_by: this.userId || undefined,
    }).subscribe({
      next: (res: any) => {
        this.reviewing = false;
        this.showToast(res.message || 'Changes requested', 'success');
        this.navCtrl.navigateBack('/contract-list');
      },
      error: (err: any) => {
        this.reviewing = false;
        const msg = err.error?.error || 'Failed to request changes';
        this.showToast(msg, 'danger');
      },
    });
  }

  formatCents(cents: number, currency: string = 'USD'): string {
    const val = (cents / 100).toFixed(2);
    return currency === 'USD' ? `$${val}` : `${val} ${currency}`;
  }

  goBack() {
    this.navCtrl.back();
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
