import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = 'http://localhost:5000/api/jobs';

  constructor(private http: HttpClient) {}

  postJob(jobData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/`, jobData);
  }

  getAllJobs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/`);
  }

  getJobById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getJobsByClient(clientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/client/${clientId}`);
  }

  updateJob(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteJob(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}