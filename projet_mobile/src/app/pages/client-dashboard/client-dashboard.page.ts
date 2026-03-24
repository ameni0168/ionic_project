import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-client-dashboard',
  templateUrl: './client-dashboard.page.html',
  styleUrls: ['./client-dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ClientDashboardPage implements OnInit {

  // ── État ──────────────────────────────────────────────────
  hasActiveJobs      = false;
  tourExpanded       = false;
  selectedCategoryId = 1; // catégorie active par défaut

  // ── Stats ─────────────────────────────────────────────────
  stats = [
    {
      icon: 'briefcase', value: '5', label: 'Active Projects',
      gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)', route: '/jobs',
    },
    {
      icon: 'cash', value: '$8.2k', label: 'Total Spent',
      gradient: 'linear-gradient(135deg, #34d399, #059669)', route: '/payments',
    },
    {
      icon: 'trending-up', value: '4.8', label: 'Avg Rating',
      gradient: 'linear-gradient(135deg, #fb923c, #ef4444)', route: '/reviews',
    },
  ];

  // ── Catégories (grille 2 × 5) ─────────────────────────────
  categories = [
    { id: 1,  name: 'AI Services',           ionIcon: 'hardware-chip-outline'  },
    { id: 2,  name: 'Development & IT',      ionIcon: 'code-slash-outline'     },
    { id: 3,  name: 'Design & Creative',     ionIcon: 'color-palette-outline'  },
    { id: 4,  name: 'Sales & Marketing',     ionIcon: 'megaphone-outline'      },
    { id: 5,  name: 'Writing & Translation', ionIcon: 'create-outline'         },
    { id: 6,  name: 'Admin & Support',       ionIcon: 'headset-outline'        },
    { id: 7,  name: 'Finance & Accounting',  ionIcon: 'bar-chart-outline'      },
    { id: 8,  name: 'Legal',                 ionIcon: 'scale-outline'          },
    { id: 9,  name: 'HR & Training',         ionIcon: 'people-circle-outline'  },
    { id: 10, name: 'Engineering',           ionIcon: 'construct-outline'      },
  ];

  // ── Top experts ───────────────────────────────────────────
  topExperts = [
    {
      id: 1,
      name:       'Sarah Johnson',
      title:      'Full-Stack Developer · React & Node.js',
      avatar:     'assets/experts/sarah.jpg',
      rating:     5,
      reviews:    142,
      hourlyRate: 85,
      location:   'USA',
      online:     true,
      topRated:   true,
    },
    {
      id: 2,
      name:       'Ahmed Khalil',
      title:      'UI/UX Designer · Figma & Adobe XD',
      avatar:     'assets/experts/ahmed.jpg',
      rating:     5,
      reviews:    98,
      hourlyRate: 60,
      location:   'Tunisia',
      online:     true,
      topRated:   true,
    },
    {
      id: 3,
      name:       'Maria Lopez',
      title:      'Digital Marketing Specialist',
      avatar:     'assets/experts/maria.jpg',
      rating:     4,
      reviews:    76,
      hourlyRate: 45,
      location:   'Spain',
      online:     false,
      topRated:   false,
    },
    {
      id: 4,
      name:       'James Chen',
      title:      'Mobile Developer · Flutter & Ionic',
      avatar:     'assets/experts/james.jpg',
      rating:     5,
      reviews:    211,
      hourlyRate: 90,
      location:   'Canada',
      online:     true,
      topRated:   true,
    },
    {
      id: 5,
      name:       'Fatima Benali',
      title:      'Content Writer & Translator (FR/EN/AR)',
      avatar:     'assets/experts/fatima.jpg',
      rating:     4,
      reviews:    53,
      hourlyRate: 30,
      location:   'Morocco',
      online:     false,
      topRated:   false,
    },
  ];

  // ── Jobs actifs ───────────────────────────────────────────
  activeJobs = [
    {
      title: 'Développement App Mobile',
      status: 'En cours', date: '12 Fév 2026',
      avatar: 'assets/avatar1.png', badge: 'Actif', badgeColor: 'success',
    },
    {
      title: 'Design UI/UX Dashboard',
      status: 'En revue', date: '10 Fév 2026',
      avatar: 'assets/avatar2.png', badge: 'En revue', badgeColor: 'warning',
    },
  ];

  // ── Guided tour ───────────────────────────────────────────
  tourSteps = [
    { title: 'Poster une offre',   desc: 'Décrivez votre projet et trouvez des freelancers qualifiés.' },
    { title: 'Trouver un talent',  desc: 'Parcourez des profils et contactez-les directement.'        },
    { title: 'Gérer vos contrats', desc: 'Suivez l\'avancement et effectuez des paiements sécurisés.' },
  ];

  constructor(private router: Router) {}

  ngOnInit() { this.loadDashboardData(); }

  loadDashboardData() {
    // TODO: charger depuis vos services
    // this.jobService.getActiveJobs().subscribe(jobs => {
    //   this.activeJobs    = jobs;
    //   this.hasActiveJobs = jobs.length > 0;
    // });
    // this.expertService.getTopRated().subscribe(e => this.topExperts = e);
  }

  // ── Helpers étoiles ───────────────────────────────────────
  getStars(rating: number):      any[] { return Array(Math.round(rating));     }
  getEmptyStars(rating: number): any[] { return Array(5 - Math.round(rating)); }

  // ── Actions ───────────────────────────────────────────────
  goTo(path: string)           { this.router.navigate([path]); }
  openProfile()                { this.router.navigate(['/profile']); }
  openMenu()                   { /* TODO ActionSheet */ }
  findTalent()                 { this.router.navigate(['/talent']); }
  postJob()                    { this.router.navigate(['/post-job']); }
  viewAllJobs()                { this.router.navigate(['/jobs']); }
  viewAllContracts()           { this.router.navigate(['/contracts']); }
  browseConsultations()        { this.router.navigate(['/categories']); }
  seeAllExperts()              { this.router.navigate(['/talent']); }
  viewStat(s: any)             { this.router.navigate([s.route]); }
  viewJob(job: any)            { this.router.navigate(['/job-detail'], { state: { job } }); }
  viewExpert(expert: any)      { this.router.navigate(['/expert', expert.id]); }
  toggleGuidedTour()           { this.tourExpanded = !this.tourExpanded; }

  selectCategory(cat: any) {
    this.selectedCategoryId = cat.id;
    this.router.navigate(['/talent'], { queryParams: { category: cat.name } });
  }

  hireExpert(event: Event, expert: any) {
    event.stopPropagation();
    this.router.navigate(['/hire', expert.id]);
  }
}