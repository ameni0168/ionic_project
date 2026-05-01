// src/app/pages/client-dashboard/client-dashboard.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { DashboardService } from 'src/app/services/client-dashboard.service';
import { MarketplaceContentService } from 'src/app/services/marketplace-content.service';

interface DashboardStats {
  active_projects: number;
  total_spent: number;
  total_contracts: number;
  avg_rating?: number;
}

@Component({
  selector: 'app-client-dashboard',
  templateUrl: './client-dashboard.page.html',
  styleUrls: ['./client-dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ClientDashboardPage implements OnInit {

  isLoading = true;
  isLoadingExperts = false;

  userAvatar = '';
  userName = '';

  stats = [
    {
      icon: 'briefcase-outline',
      value: '0',
      label: 'Active Projects',
      gradient: 'linear-gradient(135deg, #6c63ff, #4f46e5)',
      route: '/jobs'
    },
    {
      icon: 'cash-outline',
      value: '$0',
      label: 'Total Spent',
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      route: '/payments'
    },
    {
      icon: 'trending-up-outline',
      value: '0',
      label: 'Contracts',
      gradient: 'linear-gradient(135deg, #f97316, #dc2626)',
      route: '/contracts'
    },
    {
      icon: 'analytics-outline',
      value: '0',
      label: 'Project Progress',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      route: '/project-progress'
    },
  ];

  hasActiveJobs = false;
  activeJobs: any[] = [];

  selectedCategoryId = 0;

  categories: Array<{ id: number; name: string; ionIcon: string }> = [];

  topExperts: any[] = [];

  tourExpanded = false;

  tourSteps = [
    { title: 'Publiez une offre', desc: 'Décrivez votre projet et fixez votre budget.' },
    { title: 'Choisissez un talent', desc: 'Parcourez les profils et embauchez le meilleur.' },
    { title: 'Travaillez ensemble', desc: 'Collaborez et suivez l’avancement.' },
  ];

  constructor(
    private dashboardSvc: DashboardService,
    private marketplaceContent: MarketplaceContentService,
    private navCtrl: NavController,
  ) {}

  ngOnInit() {
    this._loadUserFromStorage();
    this._loadDashboard();
    this._loadCategories();
    this._loadTopFreelancers();
  }

  // ─────────────────────────────
  // USER STORAGE
  // ─────────────────────────────
  private _loadUserFromStorage() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const profile = JSON.parse(localStorage.getItem('profile') || '{}');

      this.userName = user.full_name || '';
      this.userAvatar = profile.avatar || '';
    } catch {
      this.userAvatar = '';
    }
  }

  // ─────────────────────────────
  // DASHBOARD
  // ─────────────────────────────
  private _loadDashboard() {
    this.isLoading = true;

    this.dashboardSvc.getDashboard().subscribe({
      next: (res: any) => {
        this.isLoading = false;

        const s: DashboardStats = res.stats || {
          active_projects: 0,
          total_spent: 0,
          total_contracts: 0
        };

        this.stats[0].value = String(s.active_projects || 0);
        this.stats[1].value = '$' + this._formatMoney(s.total_spent || 0);
        this.stats[2].value = String(s.total_contracts || 0);

        const jobs = res.active_jobs || [];
        this.hasActiveJobs = jobs.length > 0;

        this.activeJobs = jobs.map((j: any) => ({
          id: j._id || j.id,
          title: j.title || 'Sans titre',
          status: j.status || 'open',
          date: j.created_at
            ? new Date(j.created_at).toLocaleDateString('fr-FR')
            : '',
          avatar: j.avatar || '',
          badge: this._jobBadgeLabel(j.status),
          badgeColor: this._jobBadgeColor(j.status),
        }));

        if (res.client) {
          this.userAvatar = res.client.avatar || this.userAvatar;
          localStorage.setItem('profile', JSON.stringify(res.client));
        }

        if (res.user) {
          this.userName = res.user.full_name || '';
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.navCtrl.navigateRoot(['/auth/login']);
        }
      },
    });
  }

  // ─────────────────────────────
  // TOP FREELANCERS (FIXED)
  // ─────────────────────────────
  private _loadTopFreelancers() {
    this.isLoadingExperts = true;

    this.dashboardSvc.getTopFreelancers().subscribe({
      next: (res: any) => {
        this.isLoadingExperts = false;

        this.topExperts = this._mapFreelancers(
          res.freelancers || res.talents || []
        );
      },
      error: () => {
        this.isLoadingExperts = false;
      },
    });
  }

  private _loadCategories() {
    this.marketplaceContent.getDynamicCategories(10).subscribe({
      next: (categories) => {
        this.categories = categories.map((category, index) => ({
          id: index + 1,
          name: category.name,
          ionIcon: category.icon,
        }));

        if (!this.categories.some((category) => category.id === this.selectedCategoryId)) {
          this.selectedCategoryId = this.categories[0]?.id ?? 0;
        }
      },
      error: () => {
        this.categories = [];
        this.selectedCategoryId = 0;
      },
    });
  }

  // ─────────────────────────────
  // CATEGORY FILTER (FIXED)
  // ─────────────────────────────
  selectCategory(cat: any) {
    this.selectedCategoryId = cat.id;
    this.isLoadingExperts = true;

    this.dashboardSvc.getFreelancersByCategory(cat.name).subscribe({
      next: (res: any) => {
        this.isLoadingExperts = false;

        this.topExperts = this._mapFreelancers(
          res.freelancers || res.talents || []
        );
      },
      error: () => {
        this.isLoadingExperts = false;
      },
    });
  }

  // ─────────────────────────────
  // MAPPING SAFE (VERY IMPORTANT)
  // ─────────────────────────────
  private _mapFreelancers(talents: any[]): any[] {
    return (talents || []).map((t: any) => ({
      id: t.id || t._id,
      name: t.full_name || 'Freelancer',
      title: t.title || '',
      avatar: t.avatar || '',
      hourlyRate: t.hourly_rate || 0,
      location: t.location || '',
      rating: t.stats?.rating || 0,
      reviews: t.stats?.review_count || 0,
      online: t.is_available || false,
      topRated: (t.stats?.rating || 0) >= 4.5,
    }));
  }

  // ─────────────────────────────
  // HELPERS
  // ─────────────────────────────
  getStars(rating: number): any[] {
    return Array(Math.min(5, Math.round(rating)));
  }

  getEmptyStars(rating: number): any[] {
    return Array(5 - Math.min(5, Math.round(rating)));
  }

  private _formatMoney(val: number): string {
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return String(val);
  }

  private _jobBadgeLabel(status: string): string {
    const m: Record<string, string> = {
      open: 'Open',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };
    return m[status] || status;
  }

  private _jobBadgeColor(status: string): string {
    const m: Record<string, string> = {
      open: 'success',
      in_progress: 'warning',
      completed: 'medium',
      cancelled: 'danger'
    };
    return m[status] || 'medium';
  }

  // ─────────────────────────────
  // NAVIGATION
  // ─────────────────────────────
  openProfile() { this.navCtrl.navigateForward(['/client-profile']); }
   openMenu()             { }
  browseConsultations()  { this.navCtrl.navigateForward(['/talent']); }
  viewStat(stat: any) { 
    console.log('Navigating to:', stat.route);
    this.navCtrl.navigateForward([stat.route]); 
  }
  findTalent() { this.navCtrl.navigateForward(['/talent']); }
  postJob() { this.navCtrl.navigateForward(['/post-job']); }
  viewJob(job: any) { this.navCtrl.navigateForward(['/job-detail', job.id]); }
  viewAllJobs() { this.navCtrl.navigateForward(['/jobs']); }
  viewProposals() { this.navCtrl.navigateForward(['/proposal']); }
  viewAllContracts() { this.navCtrl.navigateForward(['/contracts']); }
  seeAllExperts() { this.navCtrl.navigateForward(['/talent']); }
  viewExpert(e: any) { this.navCtrl.navigateForward(['/talent-profile', e.id]); }
   goTo(path: string)     { this.navCtrl.navigateForward([path]); }
   hireExpert(ev: Event, e: any) { ev.stopPropagation(); this.navCtrl.navigateForward(['/talent-profile', e.id]); }

  toggleGuidedTour() {
    this.tourExpanded = !this.tourExpanded;
  }
}
