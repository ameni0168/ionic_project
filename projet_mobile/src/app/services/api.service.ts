import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:5000/api';
  private readonly TOKEN_KEY = 'access_token';

  constructor(private http: HttpClient) {}

  // ── Gestion token ─────────────────────────

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
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

  getFreelancerDashboard(): Observable<any> {
    return this.http.get(`${this.baseUrl}/freelancer/dashboard`, {
      headers: this.authHeaders()
    });
  }

  // ── Gigs ─────────────────────────

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
}