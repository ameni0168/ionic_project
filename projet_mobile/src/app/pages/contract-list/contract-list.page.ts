import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ContractService, Contract } from '../../services/contract.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-contract-list',
  templateUrl: './contract-list.page.html',
  styleUrls: ['./contract-list.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class ContractListPage implements OnInit {
  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];
  loading = false;
  userId: string | null = null;
  userRole: string | null = null;
  activeFilter: 'all' | 'active' | 'completed' | 'awaiting' = 'all';

  constructor(
    private contractService: ContractService,
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.userId = this.apiService.getUserId();
    this.userRole = this.apiService.getUserRole();
    this.loadContracts();
  }

  loadContracts() {
    this.loading = true;
    const filters: any = {};
    if (this.userRole === 'client') {
      filters.client_id = this.userId!;
    } else if (this.userRole === 'freelancer') {
      filters.freelancer_id = this.userId!;
    }

    this.contractService.listContracts(filters).subscribe({
      next: (res: any) => {
        this.contracts = res.items || [];
        this.applyFilter();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading contracts:', err);
        this.showToast('Failed to load contracts', 'danger');
        this.loading = false;
      },
    });
  }

  applyFilter() {
    if (this.activeFilter === 'all') {
      this.filteredContracts = this.contracts;
    } else if (this.activeFilter === 'active') {
      this.filteredContracts = this.contracts.filter(c =>
        ['active', 'sprint_plan_under_review', 'awaiting_sprint_plan'].includes(c.status)
      );
    } else if (this.activeFilter === 'completed') {
      this.filteredContracts = this.contracts.filter(c =>
        ['completed', 'cancelled'].includes(c.status)
      );
    } else if (this.activeFilter === 'awaiting') {
      this.filteredContracts = this.contracts.filter(c =>
        ['awaiting_sprint_plan', 'sprint_plan_under_review'].includes(c.status)
      );
    }
  }

  setFilter(filter: 'all' | 'active' | 'completed' | 'awaiting') {
    this.activeFilter = filter;
    this.applyFilter();
  }

  viewContract(contract: Contract) {
    this.navCtrl.navigateForward(['/contract-detail', contract._id]);
  }

  getStatusLabel(status: string): string {
    return ContractService.getStatusLabel(status as any);
  }

  getStatusColor(status: string): string {
    return ContractService.getStatusColor(status as any);
  }

  formatCents(cents: number, currency: string): string {
    return ContractService.formatCents(cents, currency);
  }

  getProgressPercent(contract: Contract): number {
    if (!contract.total_sprints_count) return 0;
    return Math.round((contract.completed_sprints_count / contract.total_sprints_count) * 100);
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

