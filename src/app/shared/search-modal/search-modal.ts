import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductServ } from '../../services/product-serv';
import { product } from '../../types/product';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe],
  templateUrl: './search-modal.html',
  styleUrl: './search-modal.css'
})
export class SearchModal {
  private productServ = inject(ProductServ);
  private router = inject(Router);
  
  isOpen = signal(false);
  searchTerm = signal('');
  searchResults = signal<product[]>([]);
  isLoading = signal(false);
  hasSearched = signal(false);
  
  private searchSubject = new Subject<string>();

  constructor() {
    // Debounce search input
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.trim().length < 2) {
          this.searchResults.set([]);
          this.hasSearched.set(false);
          return of([]);
        }
        this.isLoading.set(true);
        this.hasSearched.set(true);
        return this.productServ.searchProducts(term);
      })
    ).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Search error:', error);
        this.searchResults.set([]);
        this.isLoading.set(false);
      }
    });
  }

  openModal() {
    this.isOpen.set(true);
    // Focus input after modal opens
    setTimeout(() => {
      const input = document.querySelector('.search-input') as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  }

  closeModal() {
    this.isOpen.set(false);
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.hasSearched.set(false);
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.searchSubject.next(value);
  }

  onSearchSubmit() {
    const term = this.searchTerm().trim();
    if (term.length >= 2) {
      this.closeModal();
      this.router.navigate(['/products'], { 
        queryParams: { search: term } 
      });
    }
  }

  viewProduct(productId: number) {
    this.closeModal();
    this.router.navigate(['/product-details', productId]);
  }

  viewAllResults() {
    const term = this.searchTerm().trim();
    if (term.length >= 2) {
      this.closeModal();
      this.router.navigate(['/products'], { 
        queryParams: { search: term } 
      });
    }
  }
}

