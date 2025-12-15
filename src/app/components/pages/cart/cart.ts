import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { CartServ } from '../../../services/cart-serv';
import { CurrencyPipe, Location } from '@angular/common';
import { ProductServ } from '../../../services/product-serv';
import { signal } from '@angular/core';


@Component({
  selector: 'app-cart',
  imports: [RouterLink,CurrencyPipe],
  standalone: true,
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent {

  private cartServ = inject(CartServ);
  private productServ = inject(ProductServ);
  private location = inject(Location);

  cartItemsIds = signal<{ id: number; quantity: number }[]>([]);

  fullCart = signal<any[]>([]);

  constructor() {
    this.loadCart();
  }

  loadCart() {
    const stored = localStorage.getItem('cart');
    const ids = stored ? JSON.parse(stored) : [];
    this.cartItemsIds.set(ids);

    this.productServ.getProduct().subscribe((products) => {
      const full = ids
        .map((c: any) => {
          const product = products.find((p) => p.id === c.id);
          return product
            ? { ...product, quantity: c.quantity }
            : null;
        })
        .filter((x: any) => x);

      this.fullCart.set(full);
    });
  }

  increase(productId: number, quantity: number) {
    this.cartServ.addtocart(productId, quantity + 1);
    this.loadCart();
  }

  decrease(productId: number, quantity: number) {
    if (quantity > 1) {
      this.cartServ.addtocart(productId, quantity - 1);
      this.loadCart();
    }
  }

  remove(productId: number) {
    this.cartServ.addtocart(productId, 0);
    this.loadCart();
  }

  clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
      localStorage.removeItem('cart');
      this.fullCart.set([]);
      this.cartServ.cartcount.set(0);
    }
  }

  
  goBack() {
    this.location.back();
  }
  getSubtotal() {
    return this.fullCart().reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  getShipping() {
    return this.fullCart().length > 0 ? 5 : 0;
  }

  getTotal() {
    return this.getSubtotal() + this.getShipping();
  }

  getProductImage(item: any): string {
    if (!item) return '';
    
    // Use imageUrl from the product
    if (item.imageUrl) {
      // If it's already a full URL, return as is
      if (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://')) {
        return item.imageUrl;
      }
      // If it's a relative path, construct the full URL
      if (item.imageUrl.startsWith('/')) {
        return `http://localhost:5062${item.imageUrl}`;
      }
      // If it's just a filename or relative path, construct the full URL
      return `http://localhost:5062/${item.imageUrl}`;
    }
    
    // Fallback to empty string (will show placeholder icon)
    return '';
  }

  formatPrice(price: number): string {
    // Format price without .00 and put currency after: "100 EGP" instead of "EGP 100"
    const formattedPrice = price.toFixed(2).replace(/\.00$/, '');
    return `${formattedPrice} EGP`;
  }
}