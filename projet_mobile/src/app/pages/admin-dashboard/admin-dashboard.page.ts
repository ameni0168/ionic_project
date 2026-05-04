// admin-dashboard.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, MenuController, ToastController } from '@ionic/angular';

export interface User {
  id: number;
  name: string;
  initials: string;
  type: 'freelancer' | 'client';
  email: string;
  phone: string;
  location: string;
  status: 'active' | 'pending' | 'blocked';
  kyc: 'verified' | 'pending' | 'not_started';
  // Freelancer only
  skills?: string;
  rating?: number;
  jobs?: number;
  // Client only
  budget?: string;
  posted?: number;
}

export interface Proposal {
  id: number;
  title: string;
  owner: string;
  category: string;
  budget: string;
  deadline: string;
  desc: string;
  status: 'pending' | 'approved' | 'rejected';
  tag: 'dev' | 'design' | 'marketing';
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class AdminDashboardPage implements OnInit {

  // ==================== STATE ====================

  section: 'overview' | 'users' | 'proposals' | 'profiles' = 'overview';
  userFilter: 'all' | 'freelancer' | 'client' | 'blocked' = 'all';
  proposalFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'all';
  searchQuery = '';

  profileModalOpen = false;
  kycModalOpen = false;
  selectedUser: User | null = null;

  toastVisible = false;
  toastMessage = '';
  private toastTimer: any;

  // ==================== DATA ====================
  // Remplace ces données statiques par tes appels API (ex: UserService, ProposalService)

  users: User[] = [
    {
      id: 1, name: 'Aymen Ben Ali', initials: 'AB', type: 'freelancer',
      email: 'aymen@mail.com', phone: '+216 91 234 567', location: 'Tunis',
      status: 'active', kyc: 'verified', skills: 'React, Node.js', rating: 4.8, jobs: 23,
    },
    {
      id: 2, name: 'Sarra Trabelsi', initials: 'ST', type: 'client',
      email: 'sarra@startup.tn', phone: '+216 22 345 678', location: 'Sfax',
      status: 'pending', kyc: 'pending', budget: '1200 TND/mois', posted: 5,
    },
    {
      id: 3, name: 'Youssef Mansour', initials: 'YM', type: 'freelancer',
      email: 'youssef@dev.com', phone: '+216 55 456 789', location: 'Sousse',
      status: 'blocked', kyc: 'verified', skills: 'Python, ML', rating: 4.5, jobs: 11,
    },
    {
      id: 4, name: 'Nadia Chaabane', initials: 'NC', type: 'client',
      email: 'nadia@corps.tn', phone: '+216 71 567 890', location: 'Tunis',
      status: 'active', kyc: 'verified', budget: '3000 TND/mois', posted: 8,
    },
    {
      id: 5, name: 'Mehdi Khlifi', initials: 'MK', type: 'freelancer',
      email: 'mehdi@design.com', phone: '+216 98 678 901', location: 'Bizerte',
      status: 'active', kyc: 'pending', skills: 'UI/UX, Figma', rating: 4.9, jobs: 34,
    },
    {
      id: 6, name: 'Fatma Riahi', initials: 'FR', type: 'client',
      email: 'fatma@agency.tn', phone: '+216 25 789 012', location: 'Monastir',
      status: 'pending', kyc: 'not_started', budget: '800 TND/projet', posted: 2,
    },
    {
      id: 7, name: 'Omar Hamdi', initials: 'OH', type: 'freelancer',
      email: 'omar@backend.dev', phone: '+216 52 890 123', location: 'Gabes',
      status: 'active', kyc: 'verified', skills: 'Java, Spring Boot', rating: 4.2, jobs: 7,
    },
  ];

  proposals: Proposal[] = [
    {
      id: 1, title: 'Application mobile E-commerce', owner: 'Nadia Chaabane',
      category: 'Développement', budget: '4500 TND', deadline: '30 Mai 2025',
      desc: "Développement d'une app iOS/Android pour une boutique en ligne avec paiement intégré.",
      status: 'pending', tag: 'dev',
    },
    {
      id: 2, title: 'Refonte UI Dashboard Analytics', owner: 'Fatma Riahi',
      category: 'Design', budget: '1800 TND', deadline: '15 Juin 2025',
      desc: 'Redesign complet d\'un tableau de bord analytics avec nouvelles visualisations.',
      status: 'pending', tag: 'design',
    },
    {
      id: 3, title: 'Campagne Marketing Digital', owner: 'Sarra Trabelsi',
      category: 'Marketing', budget: '2200 TND', deadline: '10 Juin 2025',
      desc: 'Stratégie SEO/SEM et gestion réseaux sociaux sur 3 mois pour une startup tech.',
      status: 'pending', tag: 'marketing',
    },
    {
      id: 4, title: 'API REST Microservices', owner: 'Nadia Chaabane',
      category: 'Développement', budget: '6000 TND', deadline: '25 Juin 2025',
      desc: 'Architecture et développement de 5 microservices pour plateforme logistique.',
      status: 'approved', tag: 'dev',
    },
    {
      id: 5, title: 'Logo & Identité Visuelle', owner: 'Fatma Riahi',
      category: 'Design', budget: '900 TND', deadline: '20 Mai 2025',
      desc: 'Création logo + charte graphique complète pour une entreprise de consulting.',
      status: 'rejected', tag: 'design',
    },
  ];

  // ==================== COMPUTED ====================

  get filteredUsers(): User[] {
    return this.users.filter(u => {
      const matchesFilter =
        this.userFilter === 'all' ? true :
        this.userFilter === 'blocked' ? u.status === 'blocked' :
        u.type === this.userFilter;
      const matchesSearch = !this.searchQuery ||
        u.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }

  get filteredProposals(): Proposal[] {
    if (this.proposalFilter === 'all') return this.proposals;
    return this.proposals.filter(p => p.status === this.proposalFilter);
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
    return this.users.filter(u => u.type === 'freelancer').length;
  }

  get clientCount(): number {
    return this.users.filter(u => u.type === 'client').length;
  }

  get blockedCount(): number {
    return this.users.filter(u => u.status === 'blocked').length;
  }

  get pendingProposals(): number {
    return this.proposals.filter(p => p.status === 'pending').length;
  }

  get kycPendingCount(): number {
    return this.users.filter(u => u.kyc === 'pending').length;
  }

  get kycPendingUsers(): User[] {
    return this.users.filter(u => u.kyc === 'pending');
  }

  get kycVerifiedUsers(): User[] {
    return this.users.filter(u => u.kyc === 'verified');
  }

  // ==================== LIFECYCLE ====================

  constructor(private menuCtrl: MenuController) {}

  ngOnInit() {}

  // ==================== NAVIGATION ====================

  openDrawer() {
    this.menuCtrl.open('admin-drawer');
  }

  selectSection(section: 'overview' | 'users' | 'proposals' | 'profiles') {
    this.section = section;
    this.menuCtrl.close('admin-drawer');
  }

  // ==================== FILTERS ====================

  setUserFilter(filter: 'all' | 'freelancer' | 'client' | 'blocked') {
    this.userFilter = filter;
  }

  setProposalFilter(filter: 'all' | 'pending' | 'approved' | 'rejected') {
    this.proposalFilter = filter;
  }

  applyFilters() {
    // ngModel already updates searchQuery; filteredUsers getter reacts automatically
  }

  // ==================== USER ACTIONS ====================

  viewProfile(user: User) {
    this.selectedUser = user;
    this.profileModalOpen = true;
  }

  toggleStatus(user: User) {
    if (user.status === 'active') {
      user.status = 'blocked';
      this.showToast(`${user.name} désactivé ⛔`);
    } else {
      user.status = 'active';
      this.showToast(`${user.name} activé ✅`);
    }
  }

  // ==================== PROPOSAL ACTIONS ====================

  approveJob(proposal: Proposal) {
    proposal.status = 'approved';
    this.showToast('Job validé et publié ✅');
  }

  rejectJob(proposal: Proposal) {
    proposal.status = 'rejected';
    this.showToast('Job refusé ❌');
  }

  // ==================== KYC ACTIONS ====================

  openKycModal(user: User) {
    this.selectedUser = user;
    this.kycModalOpen = true;
  }

  approveKyc(user: User) {
    user.kyc = 'verified';
    this.kycModalOpen = false;
    this.showToast(`KYC approuvé pour ${user.name} ✅`);
  }

  // ==================== EXPORT ====================

  exportData() {
    this.showToast('Rapport exporté 📤');
    // TODO: implémenter l'export CSV/PDF réel ici
  }

  // ==================== HELPERS ====================

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
      blocked: 'Bloqué',
      approved: 'Approuvé',
      rejected: 'Refusé',
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
      verified: 'KYC Vérifié',
      pending: 'KYC En attente',
      not_started: 'KYC Non démarré',
    };
    return map[kyc] || kyc;
  }

  showToast(message: string) {
    this.toastMessage = message;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 2500);
  }
}