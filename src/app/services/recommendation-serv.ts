import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export enum SkinType {
  Normal = 1,
  Dry = 2,
  Oily = 3,
  Combination = 4,
  Sensitive = 5
}

export interface RecommendationRequest {
  skinType: SkinType;
  concerns: string[];
  symptoms: string[];
  additionalNotes?: string;
}

export interface ProductRecommendation {
  productId: number;
  name: string;
  description: string;
  categoryName: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  recommendationReason: string;
  keyIngredients: string[];
  benefits: string[];
}

export interface RecommendationResponse {
  analysisId: string;
  skinType: SkinType;
  identifiedConditions: string[];
  analysisSummary: string;
  recommendedIngredients: string[];
  ingredientsToAvoid: string[];
  recommendedProducts: ProductRecommendation[];
  routineAdvice: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class RecommendationServ {
  private apiUrl = 'http://localhost:5062/api/Recommendation';
  http = inject(HttpClient);

  analyzeAndRecommend(request: RecommendationRequest): Observable<RecommendationResponse> {
    return this.http.post<RecommendationResponse>(`${this.apiUrl}/analyze`, request);
  }

  getRecommendations(skinType: SkinType, concerns: string[]): Observable<ProductRecommendation[]> {
    const params = new URLSearchParams();
    params.append('skinType', skinType.toString());
    concerns.forEach(concern => params.append('concerns', concern));
    
    return this.http.get<ProductRecommendation[]>(`${this.apiUrl}/recommendations?${params.toString()}`);
  }
}

