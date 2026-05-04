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

  constructor(private http: HttpClient) {}

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
    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || null;
    } catch {
      return null;
    }
  }

  getUserRole(): string | null {
    const storedRole = localStorage.getItem(this.USER_ROLE_KEY);
    if (storedRole) {
      return storedRole;
    }

    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch {
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

  getAdminReviewItems(approvalStatus: 'pending' | 'approved' | 'rejected' = 'pending'): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/review-items?approval_status=${approvalStatus}`, {
      headers: this.authHeaders()
    });
  }

  updateAdminJobApproval(jobId: string, approvalStatus: 'pending' | 'approved' | 'rejected', note: string = ''): Observable<any> {
    return this.http.patch(`${this.baseUrl}/admin/jobs/${jobId}/approval`, {
      approval_status: approvalStatus,
      note
    }, {
      headers: this.authHeaders()
    });
  }

  updateAdminGigApproval(gigId: string, approvalStatus: 'pending' | 'approved' | 'rejected', note: string = ''): Observable<any> {
    return this.http.patch(`${this.baseUrl}/admin/gigs/${gigId}/approval`, {
      approval_status: approvalStatus,
      note
    }, {
      headers: this.authHeaders()
    });
  }

  getAdminUsers(params?: {
    role?: 'client' | 'freelancer';
    status?: 'active' | 'disabled';
    search?: string;
  }): Observable<any> {
    const query = new URLSearchParams();

    if (params?.role) {
      query.set('role', params.role);
    }
    if (params?.status) {
      query.set('status', params.status);
    }
    if (params?.search) {
      query.set('search', params.search);
    }

    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.http.get(`${this.baseUrl}/admin/users${suffix}`, {
      headers: this.authHeaders()
    });
  }

  updateAdminUserStatus(userId: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}/admin/users/${userId}/status`, {
      is_active: isActive
    }, {
      headers: this.authHeaders()
    });
  }

  getAdminStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/stats`, {
      headers: this.authHeaders()
    });
  }

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
}
