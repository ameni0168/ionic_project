import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { ContractService, Contract } from '../../services/contract.service';
import { SprintService, Sprint } from '../../services/sprint.service';
import { ApiService } from '../../services/api.service';

interface ProjectWithSprints {
  contract: Contract;
  sprints: Sprint[];
  expanded: boolean;
  loadingSprints: boolean;
}

@Component({
  selector: 'app-project-progress',
  templateUrl: './project-progress.page.html',
  styleUrls: ['./project-progress.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ProjectProgressPage implements OnInit {
  isLoading = true;
  projects: ProjectWithSprints[] = [];

  constructor(
    private contractService: ContractService,
    private sprintService: SprintService,
    private apiService: ApiService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.isLoading = true;
    const clientId = this.apiService.getUserId() || undefined;
    console.log('clientId:', clientId);
    this.contractService.listContracts({ client_id: clientId }).subscribe({
      next: (res: any) => {
        console.log('API response:', res);         // 👈 add this
        console.log('contracts:', res.items);
        const contracts: Contract[] = res.items || res.contracts || [];
        this.projects = contracts.map(contract => ({
          contract,
          sprints: [],
          expanded: false,
          loadingSprints: false,
        }));
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load contracts:', err);
        this.isLoading = false;
      },
    });
  }

  toggleExpand(project: ProjectWithSprints) {
    if (project.expanded) {
      project.expanded = false;
      return;
    }
    project.expanded = true;
    if (project.sprints.length === 0) {
      this.loadSprints(project);
    }
  }

  loadSprints(project: ProjectWithSprints) {
    project.loadingSprints = true;
    this.sprintService.listContractSprints(project.contract._id).subscribe({
      next: (res: any) => {
        project.sprints = res.items || res.sprints || [];
        project.loadingSprints = false;
      },
      error: () => {
        project.loadingSprints = false;
      },
    });
  }

  getProgressPercent(contract: Contract): number {
    if (!contract.total_sprints_count) return 0;
    return Math.round(
      ((contract.completed_sprints_count || 0) / contract.total_sprints_count) * 100
    );
  }

  getProgressColor(percent: number): string {
    if (percent >= 80) return '#22c55e';
    if (percent >= 50) return '#3b82f6';
    if (percent >= 25) return '#f59e0b';
    return '#ef4444';
  }

  getContractStatusColor(status: string): string {
    return ContractService.getStatusColor(status as any);
  }

  getContractStatusLabel(status: string): string {
    return ContractService.getStatusLabel(status as any);
  }

  getSprintStatusColor(status: string): string {
    return SprintService.getStatusColor(status as any);
  }

  getSprintStatusLabel(status: string): string {
    return SprintService.getStatusLabel(status as any);
  }

  isSprintDone(status: string): boolean {
    return SprintService.isCompleted(status as any);
  }

  isSprintActive(status: string): boolean {
    return ['in_progress', 'submitted', 'changes_requested'].includes(status);
  }

  formatCents(cents: number, currency: string): string {
    return ContractService.formatCents(cents, currency);
  }

  goToContractDetail(contractId: string) {
    this.navCtrl.navigateForward(['/contract-detail', contractId]);
  }

  goBack() {
    this.navCtrl.navigateBack(['/client-dashboard']);
  }

  get totalProjects(): number { return this.projects.length; }
  get activeProjects(): number {
    return this.projects.filter(p => p.contract.status === 'active').length;
  }
  get completedProjects(): number {
    return this.projects.filter(p => p.contract.status === 'completed').length;
  }
  get avgProgress(): number {
    if (!this.projects.length) return 0;
    const sum = this.projects.reduce((acc, p) => acc + this.getProgressPercent(p.contract), 0);
    return Math.round(sum / this.projects.length);
  }
}