import { Injectable }              from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable }              from 'rxjs';
import { environment }             from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private readonly API = environment.apiUrl;

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

  getTopFreelancers(): Observable<any> {
    return this.http.get(`${this.API}/freelancer/top-rated`, {
      params: { limit: '5' },
      headers: this.headers(),
    });
  }

  getLocalFreelancers(location: string = 'Tunisia'): Observable<any> {
    return this.http.get(`${this.API}/freelancer/local`, {
      params: { location },
      headers: this.headers(),
    });
  }

  getFreelancersByCategory(category: string): Observable<any> {
    return this.http.get(`${this.API}/freelancer/`, {
      params: {
        category,
        sort: 'rating',
        per_page: '5',
        page: '1',
      },
      headers: this.headers(),
    });
  }
}