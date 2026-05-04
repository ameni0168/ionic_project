import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PiiResult {
  allowed: boolean;
  reason?: string;
  pii_types?: string[];
  severity?: 'low' | 'medium' | 'high';
}

@Injectable({ providedIn: 'root' })
export class PiiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async validate(message: string): Promise<PiiResult> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
    try {
      return await firstValueFrom(
        this.http.post<PiiResult>(
          `${this.apiUrl}/chat/validate`,
          { message },
          { headers }
        )
      );
    } catch {
      return { allowed: true }; // Erreur reseau -> ne pas bloquer
    }
  }
}
