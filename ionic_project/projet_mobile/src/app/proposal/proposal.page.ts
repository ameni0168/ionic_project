import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { ProposalService, Proposal } from '../services/proposal.service';  // Updated path

@Component({
  selector: 'app-proposal',
  templateUrl: './proposal.page.html',
  styleUrls: ['./proposal.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ProposalPage implements OnInit {
  jobsWithProposals: any[] = [];
  clientId = 'test_client_1'; // This should come from your auth system
  loading = false;
  error: string | null = null;

  constructor(
    private proposalService: ProposalService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadProposals();
  }

  loadProposals() {
    this.loading = true;
    this.error = null;

    this.proposalService.getClientJobsWithProposals(this.clientId).subscribe({
      next: (response) => {
        console.log('Jobs with proposals:', response);
        this.jobsWithProposals = response.jobs;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading proposals:', err);
        this.error = 'Failed to load proposals';
        this.loading = false;
      }
    });
  }

  async acceptProposal(proposal: any) {
    const alert = await this.alertController.create({
      header: 'Accept Proposal',
      message: `Are you sure you want to accept this proposal from ${proposal.freelancer?.name || 'freelancer'}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Accept',
          handler: () => {
            this.proposalService.updateProposalStatus(proposal._id!, 'accepted').subscribe({
              next: () => {
                this.loadProposals();
                this.showSuccessAlert('Proposal accepted successfully!');
              },
              error: (err) => {
                console.error('Error accepting proposal:', err);
                this.showErrorAlert('Failed to accept proposal');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async rejectProposal(proposal: any) {
    const alert = await this.alertController.create({
      header: 'Reject Proposal',
      message: `Are you sure you want to reject this proposal from ${proposal.freelancer?.name || 'freelancer'}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reject',
          handler: () => {
            this.proposalService.updateProposalStatus(proposal._id!, 'rejected').subscribe({
              next: () => {
                this.loadProposals();
                this.showSuccessAlert('Proposal rejected');
              },
              error: (err) => {
                console.error('Error rejecting proposal:', err);
                this.showErrorAlert('Failed to reject proposal');
              }
            });
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

  getStatusColor(status: string): string {
    switch(status) {
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      default: return 'Pending';
    }
  }

  goBack() {
    window.history.back();
  }
}