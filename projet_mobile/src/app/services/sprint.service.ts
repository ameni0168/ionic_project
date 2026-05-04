import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Sprint {
  _id: string;
  contract_id: string;
  sprint_plan_id: string;
  freelancer_id: string;
  sequence: number;
  title: string;
  description: string;
  goals: string[];
  deliverables: string[];
  duration_days: number;
  price_cents: number;
  currency: string;
  status: SprintStatus;
  planned_start_date: string | null;
  start_date: string | null;
  due_date: string | null;
  actual_submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  revision_count: number;
  max_revisions: number;
  submission_note: string | null;
  client_feedback: string | null;
  attachments: SprintAttachment[];
  created_at: string;
  updated_at: string;
}

export interface SprintAttachment {
  type: 'link' | 'file';
  url: string;
  name?: string;
}

export type SprintStatus =
  | 'draft'
  | 'pending_funding'
  | 'ready'
  | 'in_progress'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'payment_released'
  | 'late'
  | 'blocked'
  | 'disputed'
  | 'cancelled';

export interface SubmitSprintPayload {
  submission_note: string;
  attachments?: SprintAttachment[];
  submitted_by?: string;
}

export interface ReviewSprintPayload {
  action: 'approve' | 'request_changes';
  feedback?: string;
  reviewed_by?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SprintService {
  private readonly base = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  listContractSprints(contractId: string): Observable<any> {
    return this.http.get(`${this.base}/contracts/${contractId}/sprints`, { headers: this.headers() });
  }

  startSprint(sprintId: string, startedBy?: string): Observable<any> {
    return this.http.post(
      `${this.base}/sprints/${sprintId}/start`,
      { started_by: startedBy },
      { headers: this.headers() }
    );
  }

  submitSprint(sprintId: string, payload: SubmitSprintPayload): Observable<any> {
    return this.http.post(
      `${this.base}/sprints/${sprintId}/submit`,
      payload,
      { headers: this.headers() }
    );
  }

  reviewSprint(sprintId: string, payload: ReviewSprintPayload): Observable<any> {
    return this.http.post(
      `${this.base}/sprints/${sprintId}/review`,
      payload,
      { headers: this.headers() }
    );
  }

  // Helpers
  static getStatusLabel(status: SprintStatus): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending_funding: 'Pending Funding',
      ready: 'Ready',
      in_progress: 'In Progress',
      submitted: 'Submitted',
      changes_requested: 'Changes Requested',
      approved: 'Approved',
      payment_released: 'Paid',
      late: 'Late',
      blocked: 'Blocked',
      disputed: 'Disputed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }

  static getStatusColor(status: SprintStatus): string {
    const colors: Record<string, string> = {
      draft: 'medium',
      pending_funding: 'warning',
      ready: 'success',
      in_progress: 'primary',
      submitted: 'tertiary',
      changes_requested: 'warning',
      approved: 'success',
      payment_released: 'success',
      late: 'danger',
      blocked: 'medium',
      disputed: 'danger',
      cancelled: 'danger',
    };
    return colors[status] || 'medium';
  }

  static isExecutable(status: SprintStatus): boolean {
    return ['ready', 'in_progress', 'submitted', 'changes_requested'].includes(status);
  }

  static isCompleted(status: SprintStatus): boolean {
    return ['approved', 'payment_released', 'cancelled'].includes(status);
  }
}

