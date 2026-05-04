import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SprintService, Sprint, SprintAttachment } from '../../services/sprint.service';
import { ContractService } from '../../services/contract.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sprint-workspace',
  templateUrl: './sprint-workspace.page.html',
  styleUrls: ['./sprint-workspace.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class SprintWorkspacePage implements OnInit {
  sprintId = '';
  sprint: Sprint | null = null;
  submissionNote = '';
  attachments: SprintAttachment[] = [];
  submitting = false;

  constructor(
    private route: ActivatedRoute,
    private sprintService: SprintService,
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.sprintId = this.route.snapshot.paramMap.get('sprintId') || '';
    this.loadSprint();
  }

  loadSprint() {
    // We need to fetch sprint details - for now we'll use the contract sprints endpoint
    // In a real app, you'd have a GET /api/sprints/:id endpoint
    this.submitting = true;
    // Mock loading - in production, fetch from API
    this.submitting = false;
  }

  addAttachment() {
    this.attachments.push({ type: 'link', url: '' });
  }

  removeAttachment(index: number) {
    this.attachments.splice(index, 1);
  }

  submitWork() {
    if (!this.submissionNote.trim()) {
      this.showToast('Please enter a submission note', 'warning');
      return;
    }

    const validAttachments = this.attachments.filter(a => a.url.trim());
    
    this.submitting = true;
    this.sprintService.submitSprint(this.sprintId, {
      submission_note: this.submissionNote,
      attachments: validAttachments,
      submitted_by: this.apiService.getUserId() || undefined,
    }).subscribe({
      next: () => {
        this.showToast('Work submitted successfully', 'success');
        this.submitting = false;
        this.navCtrl.navigateBack(['/contract-detail', this.sprint?.contract_id]);
      },
      error: (err: any) => {
        this.showToast(err.error?.error || 'Failed to submit work', 'danger');
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

  formatCents(cents: number, currency: string): string {
    return ContractService.formatCents(cents, currency);
  }
}
