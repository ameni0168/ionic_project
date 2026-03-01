import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  testApi() {
    return this.http.get(`${this.baseUrl}/api/test`);
  }

}