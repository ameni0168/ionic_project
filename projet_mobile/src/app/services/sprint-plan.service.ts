import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SprintPlanItem {
  sequence: number;
  title: string;
  description?: string;
  goals?: string[];
  deliverables?: string[];
  duration_days: number;
  price_cents: number;
  max_revisions?: number;
}

export interface SprintPlan {
  _id: string;
  contract_id: string;
  version: number;
  created_by: string;
  summary: string;
  currency: string;
  total_price_cents: number;
  total_duration_days: number;
  status: SprintPlanStatus;
  client_feedback: string | null;
  sprints: SprintPlanItem[];
  submitted_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SprintPlanStatus =
  | 'draft'
  | 'submitted'
  | 'revision_requested'
  | 'approved'
  | 'rejected'
  | 'superseded';

export interface CreateSprintPlanPayload {
  summary: string;
  currency?: string;
  sprints: SprintPlanItem[];
  created_by?: string;
}

export interface ReviewSprintPlanPayload {
  action: 'approve' | 'request_revision';
  feedback?: string;
  reviewed_by?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SprintPlanService {
  private readonly base = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  createSprintPlan(contractId: string, payload: CreateSprintPlanPayload): Observable<any> {
    return this.http.post(
      `${this.base}/contracts/${contractId}/sprint-plans`,
      payload,
      { headers: this.headers() }
    );
  }

  getSprintPlanById(planId: string): Observable<any> {
    return this.http.get(`${this.base}/sprint-plans/${planId}`, { headers: this.headers() });
  }

  listContractSprintPlans(contractId: string): Observable<any> {
    return this.http.get(`${this.base}/contracts/${contractId}/sprint-plans`, { headers: this.headers() });
  }

  updateSprintPlan(planId: string, payload: Partial<CreateSprintPlanPayload> & { updated_by?: string }): Observable<any> {
    return this.http.put(`${this.base}/sprint-plans/${planId}`, payload, { headers: this.headers() });
  }

  submitSprintPlan(planId: string, submittedBy?: string): Observable<any> {
    return this.http.post(
      `${this.base}/sprint-plans/${planId}/submit`,
      { submitted_by: submittedBy },
      { headers: this.headers() }
    );
  }

  reviewSprintPlan(planId: string, payload: ReviewSprintPlanPayload): Observable<any> {
    return this.http.post(
      `${this.base}/sprint-plans/${planId}/review`,
      payload,
      { headers: this.headers() }
    );
  }

  // Helpers
  static getStatusLabel(status: SprintPlanStatus): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      revision_requested: 'Revision Requested',
      approved: 'Approved',
      rejected: 'Rejected',
      superseded: 'Superseded',
    };
    return labels[status] || status;
  }

  static getStatusColor(status: SprintPlanStatus): string {
    const colors: Record<string, string> = {
      draft: 'medium',
      submitted: 'primary',
      revision_requested: 'warning',
      approved: 'success',
      rejected: 'danger',
      superseded: 'medium',
    };
    return colors[status] || 'medium';
  }
}

