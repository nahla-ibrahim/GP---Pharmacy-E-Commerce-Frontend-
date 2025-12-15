import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CounterService {
  minSearch = signal<number>(0);
  maxSearch = signal<number>(5000);

  setMinSearch(value: number): void {
    this.minSearch.set(value);
  }

  setMaxSearch(value: number): void {
    this.maxSearch.set(value);
  }

  reset(): void {
    this.minSearch.set(0);
    this.maxSearch.set(5000);
  }
}

