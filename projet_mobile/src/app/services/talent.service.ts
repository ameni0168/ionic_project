// src/app/services/talent.service.ts
import { Injectable }              from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable }              from 'rxjs';

export interface TalentFilters {
  q?:             string;
  category?:      string;
  location?:      string;
  min_rate?:      number;
  max_rate?:      number;
  skills?:        string[];
  available_only?: boolean;
  sort?:          'rating' | 'rate_asc' | 'rate_desc' | 'newest' | 'top_success';
  page?:          number;
  per_page?:      number;
}

@Injectable({ providedIn: 'root' })
export class TalentService {

  private API = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // GET /api/talents/ — recherche avec filtres
  searchTalents(filters: TalentFilters = {}): Observable<any> {
    let params = new HttpParams();
    if (filters.q)              params = params.set('q',              filters.q);
    if (filters.category)       params = params.set('category',       filters.category);
    if (filters.location)       params = params.set('location',       filters.location);
    if (filters.min_rate)       params = params.set('min_rate',       String(filters.min_rate));
    if (filters.max_rate)       params = params.set('max_rate',       String(filters.max_rate));
    if (filters.available_only) params = params.set('available_only', 'true');
    if (filters.sort)           params = params.set('sort',           filters.sort);
    if (filters.page)           params = params.set('page',           String(filters.page));
    if (filters.per_page)       params = params.set('per_page',       String(filters.per_page));
    if (filters.skills?.length) {
      filters.skills.forEach(s => { params = params.append('skills', s); });
    }
    return this.http.get(`${this.API}/talents/`, { headers: this.headers(), params });
  }

  // GET /api/talents/local?location=Tunisia
  getLocalTalents(location = 'Tunisia'): Observable<any> {
    return this.http.get(
      `${this.API}/talents/local?location=${location}`,
      { headers: this.headers() }
    );
  }

  // GET /api/talents/top-rated
  getTopRated(): Observable<any> {
    return this.http.get(`${this.API}/talents/top-rated`, { headers: this.headers() });
  }

  // GET /api/talents/<id>
  getTalentById(id: string): Observable<any> {
    return this.http.get(`${this.API}/talents/${id}`, { headers: this.headers() });
  }
}