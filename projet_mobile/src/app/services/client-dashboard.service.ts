// src/app/services/dashboard.service.ts
import { Injectable }              from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable }              from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private API = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    });
  }

  // GET /api/client/dashboard → stats + jobs + contrats
  getDashboard(): Observable<any> {
    return this.http.get(`${this.API}/client/dashboard`, { headers: this.headers() });
  }

  // GET /api/talents/?sort=rating&per_page=5 → top freelancers
  getTopFreelancers(): Observable<any> {
    return this.http.get(
      `${this.API}/freelancer/?sort=rating&per_page=5`,
      { headers: this.headers() }
    );
  }

  // GET /api/talents/local?location=Tunisia → freelancers locaux
  getLocalFreelancers(location: string = 'Tunisia'): Observable<any> {
    return this.http.get(
      `${this.API}/freelancer/local?location=${location}`,
      { headers: this.headers() }
    );
  }

  // GET /api/talents/?category=...&sort=rating → par catégorie
  getFreelancersByCategory(category: string): Observable<any> {
    return this.http.get(
      `${this.API}/freelancer/?category=${encodeURIComponent(category)}&sort=rating&per_page=5`,
      { headers: this.headers() }
    );
  }
}