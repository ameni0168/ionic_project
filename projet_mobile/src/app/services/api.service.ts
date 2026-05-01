import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly baseUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_ID_KEY = 'user_id';
  private readonly USER_ROLE_KEY = 'user_role';

  constructor(private http: HttpClient) { }

  // ── Gestion token ─────────────────────────

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.USER_ROLE_KEY);
  }

  getUserId(): string | null {
    const storedUserId = localStorage.getItem(this.USER_ID_KEY);
    if (storedUserId) {
      return storedUserId;
    }

    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || null;
    } catch (e) {
      return null;
    }
  }

  getUserRole(): string | null {
    const storedRole = localStorage.getItem(this.USER_ROLE_KEY);
    if (storedRole) {
      return storedRole;
    }

    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch (e) {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private authHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ── Auth ─────────────────────────

  registerClient(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register/client`, data);
  }

  registerFreelancer(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register/freelancer`, data);
  }

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, data).pipe(
      tap((res) => {
        if (res?.access_token) {
          this.saveToken(res.access_token);
        }
        if (res?.user_id) {
          localStorage.setItem(this.USER_ID_KEY, res.user_id);
        }
        if (res?.role) {
          localStorage.setItem(this.USER_ROLE_KEY, res.role);
        }
      })
    );
  }

  // ── Freelancer ─────────────────────────

  getFreelancerProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/freelancer/profile`, {
      headers: this.authHeaders()
    });
  }

  updateFreelancerProfile(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/freelancer/profile`, data, {
      headers: this.authHeaders()
    });
  }

  changeFreelancerPassword(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/freelancer/change-password`, data, {
      headers: this.authHeaders()
    });
  }

  getFreelancerDashboard(): Observable<any> {
    return this.http.get(`${this.baseUrl}/freelancer/dashboard`, {
      headers: this.authHeaders()
    });
  }

  // ── Client ─────────────────────────

  getClientProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/client/profile`, {
      headers: this.authHeaders()
    });
  }

  updateClientProfile(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/client/profile`, data, {
      headers: this.authHeaders()
    });
  }

  getClientDashboard(): Observable<any> {
    return this.http.get(`${this.baseUrl}/client/dashboard`, {
      headers: this.authHeaders()
    });
  }

  // ── Jobs (pour les clients) ─────────────────────────

  getMyJobs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/jobs/my-jobs`, {
      headers: this.authHeaders()
    });
  }

  getJobById(jobId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/jobs/${jobId}`, {
      headers: this.authHeaders()
    });
  }

  createJob(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/jobs`, data, {
      headers: this.authHeaders()
    });
  }

  updateJob(jobId: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/jobs/${jobId}`, data, {
      headers: this.authHeaders()
    });
  }

  deleteJob(jobId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/jobs/${jobId}`, {
      headers: this.authHeaders()
    });
  }

  getJobProposals(jobId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/jobs/${jobId}/proposals`, {
      headers: this.authHeaders()
    });
  }

  selectProposal(jobId: string, proposalId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/jobs/${jobId}/select-proposal`, 
      { proposalId },
      { headers: this.authHeaders() }
    );
  }

  // ── Proposals (pour les freelancers) ─────────────────────────

  submitProposal(jobId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/jobs/${jobId}/proposals`, data, {
      headers: this.authHeaders()
    });
  }

  getMyProposals(): Observable<any> {
    return this.http.get(`${this.baseUrl}/proposals/my-proposals`, {
      headers: this.authHeaders()
    });
  }

  getProposalById(proposalId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/proposals/${proposalId}`, {
      headers: this.authHeaders()
    });
  }

  updateProposal(proposalId: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/proposals/${proposalId}`, data, {
      headers: this.authHeaders()
    });
  }

  // ── Contracts ─────────────────────────

  getMyContracts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/contracts/my-contracts`, {
      headers: this.authHeaders()
    });
  }

  getContractById(contractId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/contracts/${contractId}`, {
      headers: this.authHeaders()
    });
  }

  getContractByJob(jobId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/contracts/job/${jobId}`, {
      headers: this.authHeaders()
    });
  }

  updateContractStatus(contractId: string, status: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/contracts/${contractId}/status`, 
      { status },
      { headers: this.authHeaders() }
    );
  }

  // ── Sprint Plans ─────────────────────────

  createSprintPlan(contractId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/contracts/${contractId}/sprint-plans`, data, {
      headers: this.authHeaders()
    });
  }

  getSprintPlansByContract(contractId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/contracts/${contractId}/sprint-plans`, {
      headers: this.authHeaders()
    });
  }

  getActiveSprintPlan(contractId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/contracts/${contractId}/sprint-plans/active`, {
      headers: this.authHeaders()
    });
  }

  getSprintPlanById(planId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/sprint-plans/${planId}`, {
      headers: this.authHeaders()
    });
  }

  submitSprintPlanForReview(planId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/sprint-plans/${planId}/submit`, {}, {
      headers: this.authHeaders()
    });
  }

  approveSprintPlan(planId: string, feedback?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/sprint-plans/${planId}/approve`, 
      { feedback },
      { headers: this.authHeaders() }
    );
  }

  rejectSprintPlan(planId: string, feedback: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/sprint-plans/${planId}/reject`, 
      { feedback },
      { headers: this.authHeaders() }
    );
  }

  // ── Sprints ─────────────────────────

  getSprintsByContract(contractId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/contracts/${contractId}/sprints`, {
      headers: this.authHeaders()
    });
  }

  getSprintById(sprintId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/sprints/${sprintId}`, {
      headers: this.authHeaders()
    });
  }

  startSprint(sprintId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/sprints/${sprintId}/start`, {}, {
      headers: this.authHeaders()
    });
  }

  // ── Sprint Reviews ─────────────────────────

  submitSprintReview(sprintId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sprints/${sprintId}/review`, data, {
      headers: this.authHeaders()
    });
  }

  getSprintReviewsByContract(contractId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/contracts/${contractId}/sprint-reviews`, {
      headers: this.authHeaders()
    });
  }

  getSprintReviewBySprint(sprintId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/sprints/${sprintId}/review`, {
      headers: this.authHeaders()
    });
  }

  reviewSprintSubmission(reviewId: string, decision: string, feedback: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/sprint-reviews/${reviewId}/review`, 
      { decision, feedback },
      { headers: this.authHeaders() }
    );
  }

  // ── Gigs (existants) ─────────────────────────

  getMyGigs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/gigs/`, {
      headers: this.authHeaders()
    });
  }

  createGig(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/gigs/`, data, {
      headers: this.authHeaders()
    });
  }

  updateGig(gigId: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/gigs/${gigId}`, data, {
      headers: this.authHeaders()
    });
  }

  deleteGig(gigId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/gigs/${gigId}`, {
      headers: this.authHeaders()
    });
  }

  // ── Orders (freelancer) ─────────────────────────

  getFreelancerOrders(status: string = ''): Observable<any> {
    const params = status ? `?status=${status}` : '';
    return this.http.get(`${this.baseUrl}/orders/freelancer${params}`, {
      headers: this.authHeaders()
    });
  }

  updateOrderStatus(orderId: string, status: string): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/orders/${orderId}/status`,
      { status },
      { headers: this.authHeaders() }
    );
  }

  // ── Orders (client) ─────────────────────────

  getClientOrders(status: string = ''): Observable<any> {
    const params = status ? `?status=${status}` : '';
    return this.http.get(`${this.baseUrl}/orders/client${params}`, {
      headers: this.authHeaders()
    });
  }

  orderGig(gigId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/catalog/${gigId}/order`, data, {
      headers: this.authHeaders()
    });
  }

  // ── Projets (pour le client) ─────────────────────────
  
  getClientProjects(): Observable<any> {
    return this.http.get(`${this.baseUrl}/client/projects`, {
      headers: this.authHeaders()
    });
  }

  getProjectProgress(contractId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/contracts/${contractId}/progress`, {
      headers: this.authHeaders()
    });
  }
}