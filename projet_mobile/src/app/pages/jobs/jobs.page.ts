import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
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

  categories = [
    { id: 'all', label: 'Tous' },
    { id: 'Design', label: 'Design' },
    { id: 'Développement', label: 'Dév' },
    { id: 'Marketing', label: 'Marketing' },
    { id: 'Rédaction', label: 'Rédaction' }
  ];

  constructor(
    private jobService: JobService,
    private proposalService: ProposalService,
    private apiService: ApiService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.userId = this.apiService.getUserId();
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      // 1. Charger les jobs
      const jobsRes = await this.jobService.getAllJobs().toPromise();
      this.jobs = jobsRes.jobs || [];
      
      // 2. Charger les candidatures déjà faites pour marquer "Déjà postulé"
      if (this.userId) {
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
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  filterByCategory(catId: string) {
    this.selectedCategory = catId;
    this.applyFilters();
  }

  async openApplyModal(job: any) {
    if (this.appliedJobIds.has(job._id)) {
      this.showToast('Vous avez déjà postulé à cette offre', 'warning');
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
          placeholder: 'Pourquoi êtes-vous le meilleur pour ce job ?',
        },
        {
          name: 'price',
          type: 'number',
          placeholder: 'Votre tarif proposé (DT)',
          value: job.budget_min
        },
        {
          name: 'days',
          type: 'number',
          placeholder: 'Nombre de jours estimés'
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
      this.showToast('Candidature envoyée avec succès !', 'success');
      return true;
    } catch (err: any) {
      const msg = err.error?.error || 'Erreur lors de l\'envoi';
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