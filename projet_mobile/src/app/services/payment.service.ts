import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Payment {
  _id: string;
  contract_id: string;
  sprint_id: string;
  client_id: string;
  freelancer_id: string;
  type: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_reference: string | null;
  funded_at: string;
  released_at: string | null;
  failed_at: string | null;
  refunded_at: string | null;
  meta: {
    fee_cents: number;
    tax_cents: number;
  };
  created_at: string;
  updated_at: string;
}

export type PaymentStatus =
  | 'pending_funding'
  | 'held'
  | 'authorized'
  | 'released'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'cancelled'
  | 'disputed';

export interface FundSprintPayload {
  client_id: string;
  amount_cents: number;
  payment_method_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly base = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  fundSprint(sprintId: string, payload: FundSprintPayload): Observable<any> {
    return this.http.post(
      `${this.base}/sprints/${sprintId}/fund`,
      payload,
      { headers: this.headers() }
    );
  }

  listContractPayments(contractId: string): Observable<any> {
    return this.http.get(`${this.base}/contracts/${contractId}/payments`, { headers: this.headers() });
  }

  // Helpers
  static getStatusLabel(status: PaymentStatus): string {
    const labels: Record<string, string> = {
      pending_funding: 'Pending Funding',
      held: 'In Escrow',
      authorized: 'Authorized',
      released: 'Released',
      failed: 'Failed',
      refunded: 'Refunded',
      partially_refunded: 'Partially Refunded',
      cancelled: 'Cancelled',
      disputed: 'Disputed',
    };
    return labels[status] || status;
  }

  static getStatusColor(status: PaymentStatus): string {
    const colors: Record<string, string> = {
      pending_funding: 'warning',
      held: 'primary',
      authorized: 'tertiary',
      released: 'success',
      failed: 'danger',
      refunded: 'medium',
      partially_refunded: 'medium',
      cancelled: 'danger',
      disputed: 'danger',
    };
    return colors[status] || 'medium';
  }
}

