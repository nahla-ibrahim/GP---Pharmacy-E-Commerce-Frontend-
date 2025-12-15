import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Profile {
  private baseUrl = 'http://localhost:5062/api';  

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    const token = localStorage.getItem('token'); 
        return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getProfile() {
    return this.http.get(`${this.baseUrl}/Auth/profile`, {
      headers: this.getAuthHeaders()
    });
  }

  updateProfile(data: any) {
    return this.http.put(`${this.baseUrl}/Auth/profile`, data, {
      headers: this.getAuthHeaders()
    });
  }
}
