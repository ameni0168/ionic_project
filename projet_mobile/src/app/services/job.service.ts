import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private readonly base = `${environment.apiUrl}/jobs`;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  postJob(jobData: any): Observable<any> {
    return this.http.post(`${this.base}/`, jobData, { headers: this.headers() });
  }

  getAllJobs(): Observable<any> {
    return this.http.get(`${this.base}/`, { headers: this.headers() });
  }

  getJobById(id: string): Observable<any> {
    return this.http.get(`${this.base}/${id}`, { headers: this.headers() });
  }

  getJobsByClient(clientId: string): Observable<any> {
    return this.http.get(`${this.base}/client/${clientId}`, { headers: this.headers() });
  }

  updateJob(id: string, data: any): Observable<any> {
    return this.http.put(`${this.base}/${id}`, data, { headers: this.headers() });
  }

  deleteJob(id: string): Observable<any> {
    return this.http.delete(`${this.base}/${id}`, { headers: this.headers() });
  }
}