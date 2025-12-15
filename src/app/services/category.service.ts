import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

export interface CategoryDetails {
  id: number;
  nameEn?: string;
  nameAr?: string;
  name?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  products?: any[];
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = 'http://localhost:5062/api';
  http = inject(HttpClient);

  /**
   * Get category details with products
   * Since the backend might not have a single endpoint, we'll fetch category info and products separately
   */
  getCategoryWithProducts(categoryId: number): Observable<CategoryDetails> {
    // First try to get category from Home endpoint (if available)
    // Otherwise, fetch products by category and construct category object
    return this.http.get<any[]>(`${this.apiUrl}/Products/category/${categoryId}`).pipe(
      map((products) => {
        // If we have products, extract category info from first product
        if (products && products.length > 0) {
          const firstProduct = products[0];
          return {
            id: categoryId,
            nameEn: firstProduct.categoryName || '',
            nameAr: firstProduct.categoryName || '',
            name: firstProduct.categoryName || '',
            products: products,
            isActive: true,
          } as CategoryDetails;
        }
        // Return empty category if no products
        return {
          id: categoryId,
          nameEn: '',
          nameAr: '',
          name: '',
          products: [],
          isActive: true,
        } as CategoryDetails;
      }),
      catchError((err) => {
        console.error('Error fetching category:', err);
        return of({
          id: categoryId,
          nameEn: '',
          nameAr: '',
          name: '',
          products: [],
          isActive: false,
        } as CategoryDetails);
      })
    );
  }

  /**
   * Get all tags (for filtering)
   */
  getTags(): Observable<any[]> {
    // Note: This endpoint might not exist in the backend
    // You may need to create it or extract tags from products
    return this.http.get<any[]>(`${this.apiUrl}/Tags`).pipe(
      catchError((err) => {
        console.error('Error fetching tags:', err);
        return of([]);
      })
    );
  }
}

