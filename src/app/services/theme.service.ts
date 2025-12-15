import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'carezone-theme';
  isDarkMode = signal<boolean>(this.getInitialTheme());

  constructor() {
    // Apply theme on initialization
    this.applyTheme(this.isDarkMode());
    
    // Watch for theme changes and apply them
    effect(() => {
      this.applyTheme(this.isDarkMode());
      this.saveTheme(this.isDarkMode());
    });
  }

  private getInitialTheme(): boolean {
    // Check localStorage first
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false;
  }

  private saveTheme(isDark: boolean): void {
    localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
  }

  toggleTheme(): void {
    this.isDarkMode.set(!this.isDarkMode());
  }

  setTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);
  }

  private applyTheme(isDark: boolean): void {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      if (isDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }
}

