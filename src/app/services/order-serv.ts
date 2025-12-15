import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';

export interface OrderItemDTO {
  productId: number;
  quantity: number;
}

export interface CreateOrderDTO {
  shippingAddress: string;
  phoneNumber: string;
  cityId: number;
  customerNotes: string;
  prescriptionImageUrl: string;
  paymentMethod: string;
  branchId: number;
  orderItems: OrderItemDTO[];
}

export interface OrderDTO {
  id: number;
  orderNumber: string;
  status: string;
  userId: string;
  totalAmount: number;
  createdAt: string;
  shippingAddress: string;
  phoneNumber: string;
  cityId?: number;
  cityName?: string;
  customerNotes: string;
  prescriptionImageUrl: string;
  paymentStatus: string;
  paymentMethod: string;
  branchName: string;
  userName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private baseUrl = 'http://localhost:5062/api/Orders';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('userToken');
    if (!token) {
      console.warn('No authentication token found');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    });
  }

  createOrder(dto: CreateOrderDTO): Observable<OrderDTO> {
    return this.http.post<OrderDTO>(
      this.baseUrl,
      dto,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error creating order:', error);
        throw error;
      })
    );
  }

  getUserOrders(): Observable<OrderDTO[]> {
    return this.http.get<OrderDTO[]>(
      this.baseUrl,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error fetching user orders:', error);
        return of([]);
      })
    );
  }

  getOrderById(id: number): Observable<OrderDTO> {
    return this.http.get<OrderDTO>(
      `${this.baseUrl}/${id}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error fetching order:', error);
        throw error;
      })
    );
  }

  cancelOrder(id: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/${id}/cancel`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error cancelling order:', error);
        throw error;
      })
    );
  }
}

