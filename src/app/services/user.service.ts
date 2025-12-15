import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // Language detection - check localStorage or default to false (English)
  isArabic = signal<boolean>(this.detectLanguage());

  private detectLanguage(): boolean {
    const lang = localStorage.getItem('language');
    if (lang === 'ar') return true;
    if (lang === 'en') return false;
    // Default to English if not set
    return false;
  }

  setLanguage(lang: 'ar' | 'en'): void {
    localStorage.setItem('language', lang);
    this.isArabic.set(lang === 'ar');
  }

  handleOrderingLimitError(error: any, defaultMessage: string): string | null {
    // Check if error response contains ordering limit message
    if (error?.error?.message) {
      const message = error.error.message.toLowerCase();
      if (message.includes('limit') || message.includes('maximum') || message.includes('exceed')) {
        return this.isArabic()
          ? 'تم تجاوز الحد الأقصى للطلب'
          : error.error.message || 'Order limit exceeded';
      }
    }
    return null;
  }
}

