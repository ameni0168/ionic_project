import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Contract {
  _id: string;
  job_id: string;
  proposal_id: string;
  client_id: string;
  freelancer_id: string;
  source_type: string;
  workflow_type: string;
  title: string;
  description_snapshot: string;
  currency: string;
  pricing_type: string;
  total_estimated_amount_cents: number;
  total_approved_amount_cents: number;
  escrow_enabled: boolean;
  status: ContractStatus;
  active_sprint_plan_id: string | null;
  current_sprint_id: string | null;
  completed_sprints_count: number;
  total_sprints_count: number;
  start_date: string | null;
  target_end_date: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ContractStatus =
  | 'awaiting_sprint_plan'
  | 'sprint_plan_under_review'
  | 'active'
  | 'paused'
  | 'in_dispute'
  | 'completed'
  | 'cancelled';

export interface CreateContractPayload {
  job_id: string;
  proposal_id: string;
  client_id: string;
  freelancer_id: string;
  workflow_type?: string;
  currency?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private readonly base = `${environment.apiUrl}/contracts`;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  createContract(payload: CreateContractPayload): Observable<any> {
    return this.http.post(`${this.base}/`, payload, { headers: this.headers() });
  }

  getContractById(id: string): Observable<any> {
    return this.http.get(`${this.base}/${id}`, { headers: this.headers() });
  }

  listContracts(filters?: { client_id?: string; freelancer_id?: string; status?: string; job_id?: string }): Observable<any> {
    const params = new URLSearchParams();
    if (filters?.client_id) params.append('client_id', filters.client_id);
    if (filters?.freelancer_id) params.append('freelancer_id', filters.freelancer_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.job_id) params.append('job_id', filters.job_id);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.http.get(`${this.base}/${query}`, { headers: this.headers() });
  }

  // Helper to format cents to display currency
  static formatCents(cents: number, currency: string = 'USD'): string {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency + ' ';
    return symbol + (cents / 100).toFixed(2);
  }

  // Helper to get status label
  static getStatusLabel(status: ContractStatus): string {
    const labels: Record<string, string> = {
      awaiting_sprint_plan: 'Awaiting Sprint Plan',
      sprint_plan_under_review: 'Plan Under Review',
      active: 'Active',
      paused: 'Paused',
      in_dispute: 'In Dispute',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }

  // Helper to get status color
  static getStatusColor(status: ContractStatus): string {
    const colors: Record<string, string> = {
      awaiting_sprint_plan: 'warning',
      sprint_plan_under_review: 'tertiary',
      active: 'success',
      paused: 'medium',
      in_dispute: 'danger',
      completed: 'primary',
      cancelled: 'danger',
    };
    return colors[status] || 'medium';
  }
}

