import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts: Array<{ message: string; type: 'success' | 'error' | 'info'; id: number }> = [];
  private toastIdCounter = 0;

  show(message: string, type: 'success' | 'error' | 'info' = 'info', options?: { style?: any }): void {
    const id = this.toastIdCounter++;
    const toast = { message, type, id };
    this.toasts.push(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      this.remove(id);
    }, 3000);

    // Also use browser alert as fallback for now
    if (type === 'error') {
      console.error(message);
    } else if (type === 'success') {
      console.log(message);
    }
  }

  success(message: string, options?: { style?: any }): void {
    this.show(message, 'success', options);
  }

  error(message: string, options?: { style?: any }): void {
    this.show(message, 'error', options);
  }

  info(message: string, options?: { style?: any }): void {
    this.show(message, 'info', options);
  }

  private remove(id: number): void {
    const index = this.toasts.findIndex((t) => t.id === id);
    if (index > -1) {
      this.toasts.splice(index, 1);
    }
  }

  getToasts(): Array<{ message: string; type: 'success' | 'error' | 'info'; id: number }> {
    return this.toasts;
  }
}

