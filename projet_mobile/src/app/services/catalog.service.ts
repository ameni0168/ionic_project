// src/app/services/catalog.service.ts
import { Injectable }              from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable }              from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CatalogService {

  private API = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // GET /api/catalog/?q=...&category=...&sort=...
  listGigs(filters: {
    q?:            string;
    category?:     string;
    min_price?:    number;
    max_price?:    number;
    delivery_time?:string;
    sort?:         string;
    page?:         number;
    per_page?:     number;
  } = {}): Observable<any> {
    let params = new HttpParams();
    if (filters.q)             params = params.set('q',             filters.q);
    if (filters.category)      params = params.set('category',      filters.category);
    if (filters.min_price)     params = params.set('min_price',     String(filters.min_price));
    if (filters.max_price)     params = params.set('max_price',     String(filters.max_price));
    if (filters.delivery_time) params = params.set('delivery_time', filters.delivery_time);
    if (filters.sort)          params = params.set('sort',          filters.sort);
    if (filters.page)          params = params.set('page',          String(filters.page));
    if (filters.per_page)      params = params.set('per_page',      String(filters.per_page));
    return this.http.get(`${this.API}/catalog/`, { params });
  }

  // GET /api/catalog/featured
  getFeatured(limit = 6): Observable<any> {
    return this.http.get(`${this.API}/catalog/featured?limit=${limit}`);
  }

  // GET /api/catalog/category/<category>
  getByCategory(category: string, limit = 10): Observable<any> {
    return this.http.get(
      `${this.API}/catalog/category/${encodeURIComponent(category)}?limit=${limit}`
    );
  }

  // GET /api/catalog/<gig_id>
  getGigDetail(gigId: string): Observable<any> {
    return this.http.get(`${this.API}/catalog/${gigId}`);
  }

  // POST /api/catalog/<gig_id>/order
  orderGig(gigId: string, data: {
    message?:      string;
    requirements?: string;
  }): Observable<any> {
    return this.http.post(
      `${this.API}/catalog/${gigId}/order`,
      data,
      { headers: this.headers() }
    );
  }
}