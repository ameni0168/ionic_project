import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  registerClient(data: any) {
    return this.http.post(`${this.baseUrl}/auth/register/client`, data);
  }
}