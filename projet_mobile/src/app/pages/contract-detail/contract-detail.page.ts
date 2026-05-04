import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController, AlertController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ContractService, Contract } from '../../services/contract.service';
import { SprintService, Sprint } from '../../services/sprint.service';
import { SprintPlanService, SprintPlan } from '../../services/sprint-plan.service';
import { PaymentService, Payment } from '../../services/payment.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-contract-detail',
  templateUrl: './contract-detail.page.html',
  styleUrls: ['./contract-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ContractDetailPage implements OnInit {
  contractId = '';
  contract: Contract | null = null;
  sprints: Sprint[] = [];
  sprintPlans: SprintPlan[] = [];
  payments: Payment[] = [];
  paymentSummary: any = null;

  loading = true;
  userId: string | null = null;
  userRole: string | null = null;
  isClient = false;
  isFreelancer = false;

  constructor(
    private route: ActivatedRoute,
    private contractService: ContractService,
    private sprintService: SprintService,
    private sprintPlanService: SprintPlanService,
    private paymentService: PaymentService,
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.contractId = this.route.snapshot.paramMap.get('id') || '';
    this.userId = this.apiService.getUserId();
    this.userRole = this.apiService.getUserRole();
    this.isClient = this.userRole === 'client';
    this.isFreelancer = this.userRole === 'freelancer';
    this.loadContractData();
  }

  loadContractData() {
    this.loading = true;
    this.contractService.getContractById(this.contractId).subscribe({
      next: (res: any) => {
        this.contract = res;
        this.loadSprints();
        this.loadSprintPlans();
        this.loadPayments();
      },
      error: (err: any) => {
        console.error('Error loading contract:', err);
        this.showToast('Failed to load contract', 'danger');
        this.loading = false;
      },
    });
  }

  loadSprints() {
    this.sprintService.listContractSprints(this.contractId).subscribe({
      next: (res: any) => {
        this.sprints = res.items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadSprintPlans() {
    this.sprintPlanService.listContractSprintPlans(this.contractId).subscribe({
      next: (res: any) => {
        this.sprintPlans = res.items || [];
      },
      error: () => {},
    });
  }

  loadPayments() {
    this.paymentService.listContractPayments(this.contractId).subscribe({
      next: (res: any) => {
        this.payments = res.items || [];
        this.paymentSummary = res.summary || null;
      },
      error: () => {},
    });
  }

  // ─── Actions ───────────────────────────

  goToSprintPlanBuilder() {
    this.navCtrl.navigateForward(['/sprint-plan-builder', this.contractId]);
  }

  goToSprintPlanReview(planId: string) {
    this.navCtrl.navigateForward(['/sprint-plan-review', planId]);
  }

  goToSprintWorkspace(sprintId: string) {
    this.navCtrl.navigateForward(['/sprint-workspace', sprintId]);
  }

  goToSprintReview(sprintId: string) {
    this.navCtrl.navigateForward(['/sprint-review', sprintId]);
  }

  async startSprint(sprint: Sprint) {
    const alert = await this.alertCtrl.create({
      header: 'Start Sprint',
      message: `Start "${sprint.title}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Start',
          handler: () => {
            this.sprintService.startSprint(sprint._id, this.userId || undefined).subscribe({
              next: () => {
                this.showToast('Sprint started', 'success');
                this.loadSprints();
                this.loadContractData();
              },
              error: (err: any) => {
                this.showToast(err.error?.error || 'Failed to start sprint', 'danger');
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async fundSprint(sprint: Sprint) {
    const alert = await this.alertCtrl.create({
      header: 'Fund Sprint',
      message: `Fund "${sprint.title}" for ${this.formatCents(sprint.price_cents, sprint.currency)}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Fund',
          handler: () => {
            this.paymentService.fundSprint(sprint._id, {
              client_id: this.userId!,
              amount_cents: sprint.price_cents,
            }).subscribe({
              next: () => {
                this.showToast('Sprint funded successfully', 'success');
                this.loadSprints();
                this.loadPayments();
              },
              error: (err: any) => {
                this.showToast(err.error?.error || 'Failed to fund sprint', 'danger');
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  // ─── Helpers ───────────────────────────

  getCurrentSprint(): Sprint | null {
    if (!this.sprints.length) return null;
    return (
      this.sprints.find((s) =>
        ['ready', 'in_progress', 'submitted', 'changes_requested'].includes(s.status)
      ) || null
    );
  }

  getLatestPlan(): SprintPlan | null {
    if (!this.sprintPlans.length) return null;
    return this.sprintPlans[0];
  }

  getPendingPlan(): SprintPlan | null {
    return (
      this.sprintPlans.find((p) =>
        ['draft', 'submitted', 'revision_requested'].includes(p.status)
      ) || null
    );
  }

  canCreatePlan(): boolean {
    if (!this.isFreelancer || !this.contract) return false;
    const pending = this.getPendingPlan();
    return (
      !pending &&
      ['awaiting_sprint_plan', 'active'].includes(this.contract.status)
    );
  }

  showPlanReviewButton(): boolean {
    if (!this.isClient) return false;
    const pending = this.getPendingPlan();
    return pending?.status === 'submitted' || false;
  }

  getSprintAction(sprint: Sprint): { label: string; action: () => void; color: string } | null {
    if (this.isFreelancer) {
      if (sprint.status === 'ready') {
        return { label: 'Start', action: () => this.startSprint(sprint), color: 'primary' };
      }
      if (['in_progress', 'changes_requested'].includes(sprint.status)) {
        return { label: 'Submit Work', action: () => this.goToSprintWorkspace(sprint._id), color: 'primary' };
      }
    }
    if (this.isClient) {
      if (sprint.status === 'pending_funding') {
        return { label: 'Fund', action: () => this.fundSprint(sprint), color: 'success' };
      }
      if (sprint.status === 'submitted') {
        return { label: 'Review', action: () => this.goToSprintReview(sprint._id), color: 'primary' };
      }
    }
    return null;
  }

  getStatusLabel(status: string): string {
    return ContractService.getStatusLabel(status as any);
  }

  getStatusColor(status: string): string {
    return ContractService.getStatusColor(status as any);
  }

  getSprintStatusLabel(status: string): string {
    return SprintService.getStatusLabel(status as any);
  }

  getSprintStatusColor(status: string): string {
    return SprintService.getStatusColor(status as any);
  }

  getPlanStatusLabel(status: string): string {
    return SprintPlanService.getStatusLabel(status as any);
  }

  getPlanStatusColor(status: string): string {
    return SprintPlanService.getStatusColor(status as any);
  }

  isSprintCompleted(status: string): boolean {
    return SprintService.isCompleted(status as any);
  }

  formatCents(cents: number, currency: string): string {
    return ContractService.formatCents(cents, currency);
  }

  getProgressPercent(): number {
    if (!this.contract || !this.contract.total_sprints_count) return 0;
    return Math.round(
      (this.contract.completed_sprints_count / this.contract.total_sprints_count) * 100
    );
  }

  getNextAction(): { title: string; description: string; buttonText: string; icon: string; color: string; action: () => void } | null {
    if (!this.contract) return null;
    const status = this.contract.status;

    if (status === 'awaiting_sprint_plan') {
      if (this.isFreelancer) {
        return {
          title: 'Create Sprint Plan',
          description: 'Break the project into sprints with deliverables and pricing.',
          buttonText: 'Create Plan',
          icon: 'add-circle-outline',
          color: 'primary',
          action: () => this.goToSprintPlanBuilder(),
        };
      } else {
        return {
          title: 'Waiting for Sprint Plan',
          description: 'The freelancer is preparing the sprint breakdown.',
          buttonText: 'View Details',
          icon: 'time-outline',
          color: 'warning',
          action: () => {},
        };
      }
    }

    if (status === 'sprint_plan_under_review') {
      if (this.isClient) {
        const plan = this.getLatestPlan();
        return {
          title: 'Review Sprint Plan',
          description: 'Approve or request changes to the proposed sprints.',
          buttonText: 'Review Plan',
          icon: 'eye-outline',
          color: 'primary',
          action: () => this.goToSprintPlanReview(plan?._id || ''),
        };
      } else {
        return {
          title: 'Plan Under Review',
          description: 'The client is reviewing your sprint plan.',
          buttonText: 'View Details',
          icon: 'time-outline',
          color: 'warning',
          action: () => {},
        };
      }
    }

    if (status === 'active') {
      const current = this.sprints.find(s => s._id === this.contract!.current_sprint_id);
      if (!current) return null;

      if (current.status === 'pending_funding') {
        if (this.isClient) {
          return {
            title: 'Fund Sprint',
            description: `Fund Sprint ${current.sequence} to unlock work.`,
            buttonText: 'Fund Now',
            icon: 'card-outline',
            color: 'success',
            action: () => this.fundSprint(current),
          };
        } else {
          return {
            title: 'Waiting for Funding',
            description: 'The client needs to fund the sprint before work begins.',
            buttonText: 'View Details',
            icon: 'time-outline',
            color: 'warning',
            action: () => {},
          };
        }
      }

      if (current.status === 'ready' && this.isFreelancer) {
        return {
          title: 'Start Sprint',
          description: `Sprint ${current.sequence} is funded and ready to start.`,
          buttonText: 'Start Sprint',
          icon: 'play-outline',
          color: 'primary',
          action: () => this.startSprint(current),
        };
      }

      if (current.status === 'in_progress' && this.isFreelancer) {
        return {
          title: 'Submit Sprint Work',
          description: `Submit your deliverables for Sprint ${current.sequence}.`,
          buttonText: 'Submit Work',
          icon: 'cloud-upload-outline',
          color: 'primary',
          action: () => this.goToSprintWorkspace(current._id),
        };
      }

      if (current.status === 'submitted' && this.isClient) {
        return {
          title: 'Review Submission',
          description: `Freelancer submitted Sprint ${current.sequence} for review.`,
          buttonText: 'Review',
          icon: 'checkmark-done-outline',
          color: 'success',
          action: () => this.goToSprintReview(current._id),
        };
      }

      if (current.status === 'changes_requested' && this.isFreelancer) {
        return {
          title: 'Revise Sprint',
          description: `Client requested changes for Sprint ${current.sequence}.`,
          buttonText: 'Revise',
          icon: 'refresh-outline',
          color: 'warning',
          action: () => this.goToSprintWorkspace(current._id),
        };
      }
    }

    return null;
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
