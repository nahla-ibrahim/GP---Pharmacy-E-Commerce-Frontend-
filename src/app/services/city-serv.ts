import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

export interface CityDTO {
  id: number;
  name: string;
  isActive: boolean;
  zones?: ZoneDTO[];
}

export interface ZoneDTO {
  id: number;
  name: string;
  deliveryFee: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CityService {
  private baseUrl = 'http://localhost:5062/api/Cities';

  constructor(private http: HttpClient) {}

  getCities(): Observable<CityDTO[]> {
    return this.http.get<CityDTO[]>(this.baseUrl).pipe(
      catchError(error => {
        console.error('Error fetching cities:', error);
        return of([]);
      })
    );
  }

  getCityById(id: number): Observable<CityDTO> {
    return this.http.get<CityDTO>(`${this.baseUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching city:', error);
        throw error;
      })
    );
  }
}

