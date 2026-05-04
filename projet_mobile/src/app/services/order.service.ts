import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // POST /api/orders/<orderId>/accept-pay
  acceptAndPayGigOrder(orderId: string, paymentMethodId?: string): Observable<any> {
    const body = paymentMethodId ? { payment_method_id: paymentMethodId } : {};
    return this.http.post(`${this.apiUrl}/orders/${orderId}/accept-pay`, body, { 
      headers: this.headers 
    });
  }

  // GET /api/orders/client - Client orders
  getClientOrders(statusFilter?: string): Observable<any> {
    const params = new HttpParams().set('status', statusFilter || '');
    return this.http.get(`${this.apiUrl}/orders/client`, { 
      params, 
      headers: this.headers 
    });
  }

  // GET /api/orders/freelancer - Freelancer orders
  getFreelancerOrders(statusFilter?: string): Observable<any> {
    const params = new HttpParams().set('status', statusFilter || '');
    return this.http.get(`${this.apiUrl}/orders/freelancer`, { 
      params, 
      headers: this.headers 
    });
  }

  // PATCH /api/orders/<orderId>/status
  updateOrderStatus(orderId: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/orders/${orderId}/status`, 
      { status },
      { headers: this.headers }
    );
  }
}

