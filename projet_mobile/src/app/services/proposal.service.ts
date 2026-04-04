import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface FreelancerInfo {
  _id: string;
  name: string;
  email: string;
  skills?: string[];
}

export interface JobInfo {
  _id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
}

export interface Proposal {
  _id?: string;
  job_id: string;
  freelancer_id: string;
  client_id: string;
  message: string;
  price: number;
  estimated_days?: number;  // This should be optional number
  status?: 'pending' | 'accepted' | 'rejected';
  created_at?: Date;
  updated_at?: Date;
  freelancer?: FreelancerInfo;
  job?: JobInfo;
}

@Injectable({
  providedIn: 'root'
})
export class ProposalService {
  private readonly apiUrl = `${environment.apiUrl}/proposals`;

  constructor(private http: HttpClient) { }

  createProposal(proposal: Proposal): Observable<any> {
    return this.http.post(`${this.apiUrl}/`, proposal);
  }

  getProposalsByJob(jobId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/job/${jobId}`);
  }

  getProposalsByFreelancer(freelancerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/freelancer/${freelancerId}`);
  }

  getClientJobsWithProposals(clientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/client/${clientId}/jobs-with-proposals`);
  }

  updateProposalStatus(proposalId: string, status: 'accepted' | 'rejected'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${proposalId}`, { status });
  }

  deleteProposal(proposalId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${proposalId}`);
  }
}