import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JobService } from '../../services/job.service';
import { ProposalService } from '../../services/proposal.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.page.html',
  styleUrls: ['./jobs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class JobsPage implements OnInit {
  jobs: any[] = [];
  filteredJobs: any[] = [];
  userId: string | null = null;
  loading = false;
  searchTerm = '';
  selectedCategory = 'all';
  appliedJobIds: Set<string> = new Set();

  categories: Array<{ id: string; label: string }> = [{ id: 'all', label: 'Tous' }];

  constructor(
    private jobService: JobService,
    private proposalService: ProposalService,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.userId = this.apiService.getUserId();
    this.route.queryParamMap.subscribe((params) => {
      this.searchTerm = (params.get('q') || '').trim();
      this.applyFilters();
    });
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      const jobsRes = await this.jobService.getAllJobs().toPromise();
      this.jobs = jobsRes.jobs || [];
      this.categories = this.buildDynamicCategories(this.jobs);

      if (this.userId && this.apiService.getUserRole() === 'freelancer') {
        const proposalsRes = await this.proposalService.getProposalsByFreelancer(this.userId).toPromise();
        const proposals = proposalsRes.proposals || [];
        this.appliedJobIds = new Set(proposals.map((p: any) => p.job_id));
      }

      this.applyFilters();
    } catch (err) {
      console.error('Error loading jobs board data:', err);
      this.showToast('Erreur lors du chargement des offres', 'danger');
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    this.filteredJobs = this.jobs.filter(job => {
      const matchSearch = !this.searchTerm ||
        job.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchCat = this.selectedCategory === 'all' || job.category === this.selectedCategory;

      return matchSearch && matchCat && job.status === 'open';
    });
  }

  handleSearch(event: any) {
    this.searchTerm = event?.detail?.value ?? event?.target?.value ?? '';
    this.applyFilters();
  }

  filterByCategory(catId: string) {
    this.selectedCategory = catId;
    this.applyFilters();
  }

  private buildDynamicCategories(jobs: any[]): Array<{ id: string; label: string }> {
    const uniqueCategories = Array.from(
      new Set(
        jobs
          .map((job) => this.normalizeCategory(job?.category))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    if (!uniqueCategories.includes(this.selectedCategory)) {
      this.selectedCategory = 'all';
    }

    return [
      { id: 'all', label: 'Tous' },
      ...uniqueCategories.map((category) => ({
        id: category,
        label: category,
      })),
    ];
  }

  private normalizeCategory(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  async openApplyModal(job: any) {
    if (!this.userId || this.apiService.getUserRole() !== 'freelancer') {
      this.showToast('Inscription freelancer obligatoire avant de confirmer une candidature', 'warning');
      this.router.navigate(['/welcome'], { queryParams: { redirectTo: '/jobs' } });
      return;
    }

    if (this.appliedJobIds.has(job._id)) {
      this.showToast('Vous avez deja postule a cette offre', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Proposer mes services',
      subHeader: job.title,
      mode: 'ios',
      cssClass: 'custom-alert',
      inputs: [
        {
          name: 'message',
          type: 'textarea',
          placeholder: 'Pourquoi etes-vous le meilleur pour ce job ?',
        },
        {
          name: 'price',
          type: 'number',
          placeholder: 'Votre tarif propose (DT)',
          value: job.budget_min
        },
        {
          name: 'days',
          type: 'number',
          placeholder: 'Nombre de jours estimes'
        }
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Envoyer',
          handler: (data) => {
            this.submitProposal(job, data);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async submitProposal(job: any, data: any) {
    if (!data.message || !data.price || !data.days) {
      this.showToast('Veuillez remplir tous les champs', 'warning');
      return false;
    }

    try {
      const proposal = {
        job_id: job._id,
        freelancer_id: this.userId!,
        client_id: job.client_id,
        message: data.message,
        price: parseFloat(data.price),
        estimated_days: parseInt(data.days)
      };

      await this.proposalService.createProposal(proposal).toPromise();
      this.appliedJobIds.add(job._id);
      this.showToast('Candidature envoyee avec succes !', 'success');
      return true;
    } catch (err: any) {
      const msg = err.error?.error || 'Erreur lors de l envoi';
      this.showToast(msg, 'danger');
      return false;
    }
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  goBack() {
    window.history.back();
  }
}
