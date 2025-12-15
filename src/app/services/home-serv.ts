import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { Homets } from '../types/Homets';

interface HomeDataResponse {
  categories: any[];
  banners: any[];
  featuredProducts: any[];
  popularProducts: any[];
  products: any[];
}

@Injectable({
  providedIn: 'root',
})
export class HomeServ {
  private apidata = 'http://localhost:5062/api/Home';
  http = inject(HttpClient);

  getHomeData() {
    return this.http.get<HomeDataResponse>(this.apidata).pipe(
      map((res: HomeDataResponse) => {
        const favproduct = JSON.parse(localStorage.getItem('fav') || '[]');
        // Map the response to match Homets interface
        return {
          categories: res.categories || [],
          banners: res.banners || [],
          featuredProducts: res.featuredProducts || [],
          popularProducts: res.popularProducts || []
        } as Homets;
      }),
      catchError((err) => {
        console.error('Error fetching home data:', err);
        // Return empty structure on error
        return of({
          categories: [],
          banners: [],
          featuredProducts: [],
          popularProducts: []
        } as Homets);
      })
    );
  }

  getTopRankedCategories() {
    return this.http.get<TopRankedCategory[]>('http://localhost:5062/api/Categories/top-ranked').pipe(
      catchError((err) => {
        console.error('Error fetching top-ranked categories:', err);
        return of([]);
      })
    );
  }

  getMiddleBanners() {
    return this.http.get<Banner[]>('http://localhost:5062/api/Banners/middle').pipe(
      catchError((err) => {
        console.error('Error fetching middle banners:', err);
        return of([]);
      })
    );
  }
}

export interface TopRankedCategory {
  category_id: number;
  category_name_en: string;
  category_name_ar: string;
  category_rank: number | null;
  products: TopRankedProduct[];
}

export interface TopRankedProduct {
  sku_id: number;
  product_name_en: string;
  product_name_ar: string;
  price_after: number;
  price_before: number | null;
  available_stock: number;
  item_rank: number | null;
  images: ProductImage[];
  description: string;
  category_id: number;
}

export interface ProductImage {
  image_url: string;
  image_rank: number;
}

export interface Banner {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  displayOrder: number;
  type: number;
  isActive: boolean;
}
