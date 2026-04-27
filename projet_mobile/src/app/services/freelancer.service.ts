import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface TalentFilters {
  q?: string;
  category?: string;
  location?: string;
  min_rate?: number;
  max_rate?: number;
  skills?: string[];
  available_only?: boolean;
  sort?: 'rating' | 'rate_asc' | 'rate_desc' | 'newest' | 'top_success';
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FreelancerService {

  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ========================
  // HEADERS SAFE
  // ========================
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');

    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  // ========================
  // SEARCH FREELANCERS
  // ========================
  searchTalents(filters: TalentFilters = {}): Observable<any> {

    let params = new HttpParams();

    if (filters.q) params = params.set('q', filters.q);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.location) params = params.set('location', filters.location);

    if (filters.min_rate !== undefined)
      params = params.set('min_rate', String(filters.min_rate));

    if (filters.max_rate !== undefined)
      params = params.set('max_rate', String(filters.max_rate));

    if (filters.available_only !== undefined)
      params = params.set('available_only', String(filters.available_only));

    if (filters.sort)
      params = params.set('sort', filters.sort);

    if (filters.page !== undefined)
      params = params.set('page', String(filters.page));

    if (filters.per_page !== undefined)
      params = params.set('per_page', String(filters.per_page));

    if (filters.skills?.length) {
      filters.skills.forEach(skill => {
        params = params.append('skills', skill);
      });
    }

    return this.http.get(
      `${this.API}/freelancer`,   // ✔️ no trailing slash
      { headers: this.getHeaders(), params }
    );
  }

  // ========================
  // LOCAL FREELANCERS
  // ========================
  getLocalTalents(location: string = 'Tunisia'): Observable<any> {

    const params = new HttpParams().set('location', location);

    return this.http.get(
      `${this.API}/freelancer/local`,
      { headers: this.getHeaders(), params }
    );
  }

  // ========================
  // TOP RATED
  // ========================
  getTopRated(): Observable<any> {
    return this.http.get(
      `${this.API}/freelancer/top-rated`,
      { headers: this.getHeaders() }
    );
  }

  // ========================
  // GET BY ID
  // ========================
  getTalentById(id: string): Observable<any> {
    return this.http.get(
      `${this.API}/freelancer/${id}`,
      { headers: this.getHeaders() }
    );
  }
  changePassword(data: {
    old_password: string;
    new_password: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API}/freelancer/change-password`,
      data,
      { headers: this.getHeaders() }
    );
  }


}