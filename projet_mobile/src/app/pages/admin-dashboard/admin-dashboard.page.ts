import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, MenuController } from '@ionic/angular';
import { forkJoin } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';

export interface User {
  id: string;
  name: string;
  initials: string;
  type: 'freelancer' | 'client';
  email: string;
  phone: string;
  location: string;
  status: 'active' | 'pending' | 'blocked';
  kyc: 'verified' | 'pending' | 'not_started';
  skills?: string;
  rating?: number;
  jobs?: number;
  budget?: string;
  posted?: number;
  company?: string;
  portfolioUrl?: string;
  bio?: string;
  isVerified?: boolean;
}

export interface Proposal {
  id: string;
  title: string;
  owner: string;
  category: string;
  budget: string;
  deadline: string;
  desc: string;
  status: 'pending' | 'approved' | 'rejected';
  tag: 'dev' | 'design' | 'marketing';
  itemType: 'job' | 'gig';
  reviewNote?: string;
}

interface AdminStats {
  user_total: number;
  freelancers_actif: number;
  clients_actif: number;
  propositions_en_attente: number;
  jobs_en_attente: number;
  gigs_en_attente: number;
  comptes_bloques: number;
}

interface ReviewApiResponse {
  jobs: any[];
  gigs: any[];
  totals: {
    jobs: number;
    gigs: number;
  };
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class AdminDashboardPage implements OnInit {
  section: 'overview' | 'users' | 'proposals' | 'profiles' = 'overview';
  userFilter: 'all' | 'freelancer' | 'client' | 'blocked' = 'all';
  proposalFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'all';
  searchQuery = '';

  profileModalOpen = false;
  kycModalOpen = false;
  selectedUser: User | null = null;

  toastVisible = false;
  toastMessage = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isLoading = false;
  isUsersLoading = false;
  isProposalsLoading = false;

  stats: AdminStats = {
    user_total: 0,
    freelancers_actif: 0,
    clients_actif: 0,
    propositions_en_attente: 0,
    jobs_en_attente: 0,
    gigs_en_attente: 0,
    comptes_bloques: 0,
  };

  users: User[] = [];
  proposals: Proposal[] = [];

  get filteredUsers(): User[] {
    return this.users.filter((u) => {
      const matchesFilter =
        this.userFilter === 'all'
          ? true
          : this.userFilter === 'blocked'
            ? u.status === 'blocked'
            : u.type === this.userFilter;

      const needle = this.searchQuery.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        [u.name, u.email, u.location, u.phone, u.company, u.skills]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));

      return matchesFilter && matchesSearch;
    });
  }

  get filteredProposals(): Proposal[] {
    if (this.proposalFilter === 'all') {
      return this.proposals;
    }
    return this.proposals.filter((p) => p.status === this.proposalFilter);
  }

  get sectionTitle(): string {
    const map: Record<string, string> = {
      overview: 'Dashboard Admin',
      users: 'Utilisateurs',
      proposals: 'Validation Jobs',
      profiles: 'Profils & KYC',
    };
    return map[this.section] || 'Admin';
  }

  get freelancerCount(): number {
    return this.stats.freelancers_actif || this.users.filter((u) => u.type === 'freelancer' && u.status !== 'blocked').length;
  }

  get clientCount(): number {
    return this.stats.clients_actif || this.users.filter((u) => u.type === 'client' && u.status !== 'blocked').length;
  }

  get blockedCount(): number {
    return this.stats.comptes_bloques || this.users.filter((u) => u.status === 'blocked').length;
  }

  get pendingProposals(): number {
    return this.stats.propositions_en_attente || this.proposals.filter((p) => p.status === 'pending').length;
  }

  get kycPendingCount(): number {
    return this.users.filter((u) => u.kyc === 'pending').length;
  }

  get kycPendingUsers(): User[] {
    return this.users.filter((u) => u.kyc === 'pending');
  }

  get kycVerifiedUsers(): User[] {
    return this.users.filter((u) => u.kyc === 'verified');
  }

  constructor(
    private menuCtrl: MenuController,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.loadStats();
    this.loadUsers();
    this.loadProposals(() => {
      this.isLoading = false;
    });
  }

  loadStats(): void {
    this.api.getAdminStats().subscribe({
      next: (stats: AdminStats) => {
        this.stats = {
          ...this.stats,
          ...stats,
        };
      },
      error: (err) => {
        console.error('Admin stats error:', err);
        this.showToast(err?.error?.error || 'Impossible de charger les statistiques admin.');
      }
    });
  }

  loadUsers(): void {
    this.isUsersLoading = true;
    this.api.getAdminUsers().subscribe({
      next: (response: { users: any[] }) => {
        this.users = (response.users || []).map((user) => this.mapUser(user));
        this.isUsersLoading = false;
      },
      error: (err) => {
        console.error('Admin users error:', err);
        this.isUsersLoading = false;
        this.showToast(err?.error?.error || 'Impossible de charger les utilisateurs.');
      }
    });
  }

  loadProposals(onComplete?: () => void): void {
    this.isProposalsLoading = true;

    const finish = () => {
      this.isProposalsLoading = false;
      onComplete?.();
    };

    if (this.proposalFilter === 'all') {
      forkJoin([
        this.api.getAdminReviewItems('pending'),
        this.api.getAdminReviewItems('approved'),
        this.api.getAdminReviewItems('rejected'),
      ]).subscribe({
        next: ([pending, approved, rejected]: ReviewApiResponse[]) => {
          this.proposals = [
            ...this.mapReviewItems(pending),
            ...this.mapReviewItems(approved),
            ...this.mapReviewItems(rejected),
          ].sort((a, b) => Number(a.status !== 'pending') - Number(b.status !== 'pending'));
          finish();
        },
        error: (err) => {
          console.error('Admin review items error:', err);
          this.proposals = [];
          finish();
          this.showToast(err?.error?.error || 'Impossible de charger les validations.');
        }
      });
      return;
    }

    this.api.getAdminReviewItems(this.proposalFilter).subscribe({
      next: (response: ReviewApiResponse) => {
        this.proposals = this.mapReviewItems(response);
        finish();
      },
      error: (err) => {
        console.error('Admin review items error:', err);
        this.proposals = [];
        finish();
        this.showToast(err?.error?.error || 'Impossible de charger les validations.');
      }
    });
  }

  openDrawer(): void {
    this.menuCtrl.open('admin-drawer');
  }

  selectSection(section: 'overview' | 'users' | 'proposals' | 'profiles'): void {
    this.section = section;
    this.menuCtrl.close('admin-drawer');

    if (section === 'proposals') {
      this.loadProposals();
    }
  }

  setUserFilter(filter: 'all' | 'freelancer' | 'client' | 'blocked'): void {
    this.userFilter = filter;
  }

  setProposalFilter(filter: 'all' | 'pending' | 'approved' | 'rejected'): void {
    this.proposalFilter = filter;
    this.loadProposals();
  }

  applyFilters(): void {}

  viewProfile(user: User): void {
    this.selectedUser = user;
    this.profileModalOpen = true;
  }

  toggleStatus(user: User): void {
    const nextIsActive = user.status === 'blocked';

    this.api.updateAdminUserStatus(user.id, nextIsActive).subscribe({
      next: (response: { user: any; message: string }) => {
        const updatedUser = this.mapUser(response.user);
        this.users = this.users.map((item) => item.id === updatedUser.id ? { ...item, ...updatedUser } : item);

        if (this.selectedUser?.id === updatedUser.id) {
          this.selectedUser = { ...this.selectedUser, ...updatedUser };
        }

        this.loadStats();
        this.showToast(response.message || `Statut mis a jour pour ${updatedUser.name}.`);
      },
      error: (err) => {
        console.error('Admin user status error:', err);
        this.showToast(err?.error?.error || 'Impossible de modifier le statut utilisateur.');
      }
    });
  }

  approveJob(proposal: Proposal): void {
    this.updateProposalStatus(proposal, 'approved');
  }

  rejectJob(proposal: Proposal): void {
    this.updateProposalStatus(proposal, 'rejected');
  }

  openKycModal(user: User): void {
    this.selectedUser = user;
    this.kycModalOpen = true;
  }

  approveKyc(user: User): void {
    user.kyc = 'verified';
    user.isVerified = true;
    this.kycModalOpen = false;
    this.showToast('Aucune API KYC admin n existe encore cote backend. Statut mis a jour seulement dans l interface.');
  }

  exportData(): void {
    this.showToast('Export a implementer.');
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      active: 'badge-active',
      pending: 'badge-pending',
      blocked: 'badge-blocked',
      approved: 'badge-active',
      rejected: 'badge-blocked',
    };
    return map[status] || '';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'Actif',
      pending: 'En attente',
      blocked: 'Bloque',
      approved: 'Approuve',
      rejected: 'Refuse',
    };
    return map[status] || status;
  }

  getKycClass(kyc: string): string {
    const map: Record<string, string> = {
      verified: 'badge-active',
      pending: 'badge-pending',
      not_started: 'badge-blocked',
    };
    return map[kyc] || '';
  }

  getBudgetShort(user: User): string {
    return user.budget?.split(' ')[0] ?? '-';
  }

  getKycLabel(kyc: string): string {
    const map: Record<string, string> = {
      verified: 'KYC Verifie',
      pending: 'KYC En attente',
      not_started: 'KYC Non demarre',
    };
    return map[kyc] || kyc;
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 2500);
  }

  private updateProposalStatus(proposal: Proposal, status: 'approved' | 'rejected'): void {
    const request$ = proposal.itemType === 'job'
      ? this.api.updateAdminJobApproval(proposal.id, status)
      : this.api.updateAdminGigApproval(proposal.id, status);

    request$.subscribe({
      next: () => {
        this.proposals = this.proposals.map((item) =>
          item.id === proposal.id && item.itemType === proposal.itemType
            ? { ...item, status }
            : item
        );
        this.loadStats();
        this.showToast(status === 'approved' ? 'Element valide avec succes.' : 'Element refuse avec succes.');
      },
      error: (err) => {
        console.error('Admin approval error:', err);
        this.showToast(err?.error?.error || 'Impossible de mettre a jour la validation.');
      }
    });
  }

  private mapUser(user: any): User {
    const type: 'freelancer' | 'client' = user.role === 'freelancer' ? 'freelancer' : 'client';
    const name = user.full_name || user.email || 'Utilisateur';
    const isActive = user.is_active !== false;
    const kyc = this.mapKycStatus(user);

    return {
      id: user.id,
      name,
      initials: this.buildInitials(name),
      type,
      email: user.email || '',
      phone: user.phone || '-',
      location: user.location || '-',
      status: isActive ? (kyc === 'pending' ? 'pending' : 'active') : 'blocked',
      kyc,
      skills: user.portfolioUrl ? 'Portfolio disponible' : '',
      rating: undefined,
      jobs: undefined,
      budget: '-',
      posted: undefined,
      company: user.company || '',
      portfolioUrl: user.portfolioUrl || '',
      bio: user.bio || '',
      isVerified: !!user.is_verified,
    };
  }

  private mapReviewItems(response: ReviewApiResponse): Proposal[] {
    const jobs = (response.jobs || []).map((job) => this.mapJobProposal(job));
    const gigs = (response.gigs || []).map((gig) => this.mapGigProposal(gig));
    return [...jobs, ...gigs];
  }

  private mapJobProposal(job: any): Proposal {
    const categories = Array.isArray(job.category) ? job.category : [];
    const primaryCategory = categories[0] || 'General';

    return {
      id: job.id,
      itemType: 'job',
      title: job.title || 'Job sans titre',
      owner: job.owner_name || job.client_id || 'Client inconnu',
      category: primaryCategory,
      budget: this.formatJobBudget(job),
      deadline: job.deadline || 'Non precisee',
      desc: job.description || '',
      status: job.approval_status || 'pending',
      tag: this.mapTag(primaryCategory),
      reviewNote: job.review_note || '',
    };
  }

  private mapGigProposal(gig: any): Proposal {
    const categories = Array.isArray(gig.category) ? gig.category : [];
    const primaryCategory = categories[0] || 'Service';

    return {
      id: gig.id,
      itemType: 'gig',
      title: gig.title || 'Gig sans titre',
      owner: gig.owner_name || gig.freelancerId || 'Freelancer inconnu',
      category: primaryCategory,
      budget: `${gig.price ?? 0} TND`,
      deadline: gig.deliveryTime || 'Delai non precise',
      desc: gig.description || '',
      status: gig.approval_status || 'pending',
      tag: this.mapTag(primaryCategory),
      reviewNote: gig.review_note || '',
    };
  }

  private mapTag(category: string): 'dev' | 'design' | 'marketing' {
    const normalized = category.toLowerCase();

    if (normalized.includes('design') || normalized.includes('ui') || normalized.includes('ux') || normalized.includes('figma')) {
      return 'design';
    }

    if (normalized.includes('marketing') || normalized.includes('seo') || normalized.includes('social')) {
      return 'marketing';
    }

    return 'dev';
  }

  private formatJobBudget(job: any): string {
    const min = job.budget_min ?? 0;
    const max = job.budget_max ?? 0;
    const budgetType = job.budget_type ? ` ${job.budget_type}` : '';

    if (min && max) {
      return `${min} - ${max}${budgetType}`;
    }

    if (max) {
      return `${max}${budgetType}`;
    }

    if (min) {
      return `${min}${budgetType}`;
    }

    return `Budget non precise${budgetType}`;
  }

  private mapKycStatus(user: any): 'verified' | 'pending' | 'not_started' {
    if (user.is_verified) {
      return 'verified';
    }

    if (user.phone || user.location || user.company || user.portfolioUrl) {
      return 'pending';
    }

    return 'not_started';
  }

  private buildInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U';
  }
}
