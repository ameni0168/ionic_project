import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { ButtonComponent } from '../components/button/button.component';
import { ProposalService } from '../services/proposal.service';

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.page.html',
  styleUrls: ['./jobs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ButtonComponent],
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
  userId = "freelancer123";
  loading = false;
  error: string | null = null;
  appliedJobs: Set<string> = new Set();

  constructor(
    private http: HttpClient,
    private alertController: AlertController,
    private proposalService: ProposalService
  ) {}

  ngOnInit() {
    this.loadJobs();
    this.loadUserApplications();
  }

  loadJobs() {
    this.loading = true;
    this.error = null;
    
    this.http.get<any>('http://localhost:5000/api/jobs')
      .subscribe({
        next: (data) => {
          console.log('Jobs received:', data);
          this.jobs = data.jobs || [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading jobs:', err);
          this.error = 'Failed to load jobs. Please check if backend is running.';
          this.loading = false;
        }
      });
  }

  loadUserApplications() {
    this.proposalService.getProposalsByFreelancer(this.userId).subscribe({
      next: (response) => {
        console.log('User applications:', response);
        if (response.proposals) {
          response.proposals.forEach((proposal: any) => {
            this.appliedJobs.add(proposal.job_id);
          });
        }
      },
      error: (err) => {
        console.error('Error loading applications:', err);
      }
    });
  }

  async apply(job: any) {
    // Check if already applied
    if (this.appliedJobs.has(job._id)) {
      const alert = await this.alertController.create({
        header: 'Already Applied',
        message: 'You have already submitted a proposal for this job.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Check if job is already in progress
    if (job.status === 'in_progress') {
      const alert = await this.alertController.create({
        header: 'Job Already Assigned',
        message: 'This job has already been assigned to another freelancer.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Show proposal form
    const alert = await this.alertController.create({
      header: 'Submit Proposal',
      subHeader: job.title,
      inputs: [
        {
          name: 'message',
          type: 'textarea',
          placeholder: 'Write a message to the client...',
          attributes: {
            rows: 4
          }
        },
        {
          name: 'price',
          type: 'number',
          placeholder: 'Your proposed price (DT)',
          value: job.budget_min.toString()
        },
        {
          name: 'days',
          type: 'number',
          placeholder: 'Estimated days to complete'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Submit',
          handler: (data) => {
            if (!data.message || !data.price) {
              this.showErrorAlert('Please fill all required fields');
              return false;
            }
            
            const proposal = {
              job_id: job._id,
              freelancer_id: this.userId,
              client_id: job.client_id,
              message: data.message,
              price: parseFloat(data.price),
              estimated_days: data.days ? parseInt(data.days) : undefined  // ✅ Fixed: use undefined instead of null
            };
            
            this.proposalService.createProposal(proposal).subscribe({
              next: (response) => {
                console.log('Proposal created:', response);
                this.appliedJobs.add(job._id);
                this.showSuccessAlert('Proposal submitted successfully!');
              },
              error: (err) => {
                console.error('Error submitting proposal:', err);
                const errorMessage = err.error?.error || 'Failed to submit proposal. Please try again.';
                this.showErrorAlert(errorMessage);
              }
            });
            return true;
          }
        }
      ]
    });
    
    await alert.present();
  }

  async showSuccessAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Success',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  goBack() {
    window.history.back();
  }
}