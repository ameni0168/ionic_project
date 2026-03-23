// src/app/services/client-profile.service.ts
import { Injectable }              from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable }              from 'rxjs';

export interface UserData {
  id:          string;
  username:    string;
  email:       string;
  full_name:   string;
  role:        string;
  is_verified: boolean;
  is_active:   boolean;
  created_at:  string;
  last_login:  string | null;
}

export interface ClientData {
  id:       string;
  user_id:  string;
  phone:    string;
  location: string;
  company:  string;
  website:  string;
  bio:      string;
  avatar:   string;
  stats: {
    active_projects: number;
    total_spent:     number;
    total_contracts: number;
    avg_rating:      number;
  };
  updated_at: string;
}

export interface ClientProfile {
  user:   UserData;
  client: ClientData;
}

@Injectable({ providedIn: 'root' })
export class ClientProfileService {

  // ✅ URL directe — pas besoin d'environment.apiUrl
  private API = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    });
  }

  getProfile(): Observable<ClientProfile> {
    return this.http.get<ClientProfile>(
      `${this.API}/client/profile`,
      { headers: this.headers() }
    );
  }

  updateProfile(data: Partial<{
    full_name: string;
    phone:     string;
    location:  string;
    company:   string;
    website:   string;
    bio:       string;
    avatar:    string;
  }>): Observable<ClientProfile> {
    return this.http.put<ClientProfile>(
      `${this.API}/client/profile`,
      data,
      { headers: this.headers() }
    );
  }

  changePassword(data: {
    old_password: string;
    new_password: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API}/client/change-password`,
      data,
      { headers: this.headers() }
    );
  }
}