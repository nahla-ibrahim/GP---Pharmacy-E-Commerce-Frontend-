import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecommendationServ, SkinType, RecommendationRequest, RecommendationResponse, ProductRecommendation } from '../../../services/recommendation-serv';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recommendation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recommendation.html',
  styleUrl: './recommendation.css'
})
export class RecommendationComponent {
  skinType = SkinType;
  analysisRequest: RecommendationRequest = {
    skinType: SkinType.Normal,
    concerns: [],
    symptoms: [],
    additionalNotes: ''
  };

  symptomsText: string = '';
  selectedConcerns = {
    acne: false,
    dryness: false,
    oiliness: false,
    redness: false,
    aging: false,
    darkSpots: false
  };

  analysisResults: RecommendationResponse | null = null;
  isLoading = false;

  constructor(
    private recommendationService: RecommendationServ,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit() {
    if (this.isLoading) return;

    // Ensure skinType is a number (not a string)
    const skinTypeValue = typeof this.analysisRequest.skinType === 'string' 
      ? parseInt(this.analysisRequest.skinType, 10) 
      : this.analysisRequest.skinType;

    // Convert selected concerns to array
    const concerns = Object.keys(this.selectedConcerns)
      .filter(key => this.selectedConcerns[key as keyof typeof this.selectedConcerns]);

    // Convert symptoms text to array
    const symptoms = this.symptomsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Create properly formatted request
    const request: RecommendationRequest = {
      skinType: skinTypeValue as SkinType,
      concerns: concerns.length > 0 ? concerns : [],
      symptoms: symptoms.length > 0 ? symptoms : [],
      additionalNotes: this.analysisRequest.additionalNotes?.trim() || undefined
    };

    // Log the request for debugging
    console.log('Sending request:', request);

    this.isLoading = true;

    this.recommendationService.analyzeAndRecommend(request).subscribe({
      next: (response) => {
        console.log('Analysis response received:', response);
        if (response) {
          // Ensure skinType is converted to number if it comes as string
          if (typeof response.skinType === 'string') {
            const skinTypeMap: { [key: string]: SkinType } = {
              'Normal': SkinType.Normal,
              'Dry': SkinType.Dry,
              'Oily': SkinType.Oily,
              'Combination': SkinType.Combination,
              'Sensitive': SkinType.Sensitive
            };
            response.skinType = skinTypeMap[response.skinType] || SkinType.Normal;
          }
          
          this.analysisResults = response;
          console.log('Analysis results set:', this.analysisResults);
          console.log('analysisResults is truthy:', !!this.analysisResults);
          console.log('recommendedProducts count:', this.analysisResults?.recommendedProducts?.length || 0);
          
          // Force change detection to ensure UI updates
          this.cdr.detectChanges();
          
          // Scroll to top after a brief delay to ensure DOM is updated
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        } else {
          console.warn('Received empty response');
          alert('Received empty response from server. Please try again.');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Analysis failed:', error);
        console.error('Error status:', error.status);
        console.error('Error statusText:', error.statusText);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);
        const errorMessage = error.error?.message || error.error?.error || error.message || 'Analysis failed. Please try again.';
        alert(`Analysis failed: ${errorMessage}`);
        this.isLoading = false;
      }
    });
  }

  getRoutineAdviceLines(): string[] {
    if (!this.analysisResults?.routineAdvice) return [];
    return this.analysisResults.routineAdvice.split('\n').filter(line => line.trim());
  }

  viewProduct(productId: number) {
    this.router.navigate(['/product-details', productId]);
  }

  getSkinTypeName(type: SkinType): string {
    const skinTypeNames: { [key: number]: string } = {
      1: 'Normal',
      2: 'Dry',
      3: 'Oily',
      4: 'Combination',
      5: 'Sensitive'
    };
    return skinTypeNames[type] || 'Normal';
  }

  resetForm() {
    // Clear analysis results
    this.analysisResults = null;
    
    // Reset form fields to initial values
    this.analysisRequest = {
      skinType: SkinType.Normal,
      concerns: [],
      symptoms: [],
      additionalNotes: ''
    };
    
    // Reset symptoms text
    this.symptomsText = '';
    
    // Reset selected concerns
    this.selectedConcerns = {
      acne: false,
      dryness: false,
      oiliness: false,
      redness: false,
      aging: false,
      darkSpots: false
    };
    
    // Reset loading state
    this.isLoading = false;
    
    // Force change detection
    this.cdr.detectChanges();
  }
}

