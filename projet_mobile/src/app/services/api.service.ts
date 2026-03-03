// src/app/services/api.service.ts
// SERVICE API COMPLET POUR FREELANCEHUB

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// ==================== INTERFACES ====================

export interface FreelancerAccountData {
  fullName: string;
  title: string;
  bio: string;
  location: string;
  hourlyRate: number;
  portfolioUrl?: string;
  skills: Array<{ name: string; level: number }>;
  languages?: Array<{ name: string; proficiency: string }>;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
}

export interface GigData {
  title: string;
  category: string;
  subcategory?: string;
  description: string;
  requirements?: string;
  pricing: {
    basic: {
      price: number;
      title: string;
      description: string;
      deliveryTime: number;
      revisions: number;
    };
    standard?: any;
    premium?: any;
  };
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5000/api';  // URL du backend Flask
  
  constructor(private http: HttpClient) {}

  // ==================== HELPERS ====================
  
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }
  
  private getMultipartHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
      // Pas de Content-Type pour multipart/form-data (auto par HttpClient)
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      console.error('Client Error:', error.error.message);
    } else {
      // Erreur côté serveur
      console.error(`Backend Error ${error.status}:`, error.error);
    }
    
    return throwError(() => error);
  }

  // ==================== HEALTH CHECK ====================
  
  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== AUTHENTIFICATION ====================
  
  /**
   * Enregistrer un nouveau client
   * @param data Données d'inscription du client
   */
  registerClient(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register/client`, data).pipe(
      tap(response => console.log('Client registered:', response)),
      catchError(this.handleError)
    );
  }

  // ==================== FREELANCER ACCOUNT ====================
  
  /**
   * Créer un compte freelancer complet
   * @param data Données du profil freelancer
   */
  createFreelancerAccount(data: FreelancerAccountData): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/freelancer-account/create`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Account created:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupérer le compte freelancer complet
   */
  getFreelancerAccount(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/freelancer/account`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Vérifier le statut du compte
   */
  getAccountStatus(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/freelancer/account/status`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Mettre à jour le profil freelancer
   * @param data Données à mettre à jour (partiel)
   */
  updateFreelancerProfile(data: Partial<FreelancerAccountData>): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/freelancer/update-profile`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Profile updated:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Upload avatar du freelancer
   * @param file Fichier image
   */
  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.http.post(
      `${this.apiUrl}/freelancer-account/upload-avatar`,
      formData,
      { headers: this.getMultipartHeaders() }
    ).pipe(
      tap(response => console.log('Avatar uploaded:', response)),
      catchError(this.handleError)
    );
  }

  // ==================== GIGS ====================

  /**
   * Créer un nouveau gig
   * @param data Données du gig
   */
  createGig(data: GigData): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/gigs/create`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Gig created:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupérer tous mes gigs
   * @param status Filtrer par statut (optionnel)
   * @param category Filtrer par catégorie (optionnel)
   */
  getMyGigs(status?: string, category?: string): Observable<any> {
    let url = `${this.apiUrl}/gigs/my-gigs`;
    const params: string[] = [];
    
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupérer les détails d'un gig
   * @param gigId ID du gig
   */
  getGigDetails(gigId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/gigs/${gigId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Mettre à jour un gig
   * @param gigId ID du gig
   * @param data Données à mettre à jour
   */
  updateGig(gigId: string, data: Partial<GigData>): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/gigs/${gigId}`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Gig updated:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Supprimer un gig (soft delete)
   * @param gigId ID du gig
   */
  deleteGig(gigId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/gigs/${gigId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Gig deleted:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Changer le statut d'un gig
   * @param gigId ID du gig
   * @param status Nouveau statut (active ou paused)
   */
  changeGigStatus(gigId: string, status: 'active' | 'paused'): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/gigs/${gigId}/status`,
      { status },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Gig status changed:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Upload une image pour un gig
   * @param gigId ID du gig
   * @param file Fichier image
   */
  uploadGigImage(gigId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    
    return this.http.post(
      `${this.apiUrl}/gigs/${gigId}/upload-image`,
      formData,
      { headers: this.getMultipartHeaders() }
    ).pipe(
      tap(response => console.log('Gig image uploaded:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Dupliquer un gig
   * @param gigId ID du gig à dupliquer
   */
  duplicateGig(gigId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/gigs/${gigId}/duplicate`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Gig duplicated:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupérer les statistiques de tous mes gigs
   */
  getGigsStats(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/gigs/stats`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== TOKEN MANAGEMENT ====================

  /**
   * Sauvegarder le token JWT dans localStorage
   */
  saveToken(accessToken: string, refreshToken?: string): void {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    console.log('Token saved successfully');
  }

  /**
   * Récupérer le token JWT depuis localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Supprimer le token JWT de localStorage
   */
  removeToken(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    console.log('Tokens removed');
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  /**
   * Déconnecter l'utilisateur
   */
  logout(): void {
    this.removeToken();
  }

  // ==================== UTILITIES ====================

  /**
   * Formater les erreurs pour l'affichage
   */
  getErrorMessage(error: any): string {
    if (error.error?.error) {
      return error.error.error;
    } else if (error.error?.message) {
      return error.error.message;
    } else if (error.message) {
      return error.message;
    } else {
      return 'An unexpected error occurred';
    }
  }
}