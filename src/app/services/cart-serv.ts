import { Injectable, signal } from '@angular/core';
import { ProductCart } from '../types/cart';

@Injectable({
  providedIn: 'root',
})
export class CartServ {
  cartcount = signal(0);

  constructor() {
    this.cartcount.set(this.gettotalcart());
    
  }
  gettotalcart() {
    const cart = localStorage.getItem('cart');
    const cartarray: ProductCart[] = cart ? JSON.parse(cart) : [];
    const totalQuantity = cartarray.reduce((sum, item) => sum + item.quantity, 0);
    return totalQuantity;
  }

  addtocart(id: number, qunatity: number) {
    const cart = localStorage.getItem('cart');
    const cartarray: ProductCart[] = cart ? JSON.parse(cart) : [];
    const excitingProduct = cartarray.findIndex((item: ProductCart) => item.id === id);
    if (qunatity == 0) {
      const updatedCart = cartarray.filter((item: any) => item.id !== id);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      this.cartcount.set(this.gettotalcart());
      return;
    } else {
      if (excitingProduct > -1) {
        cartarray[excitingProduct].quantity = qunatity;
      } else {
        cartarray.push({ id: id, quantity: qunatity });
      }

      localStorage.setItem('cart', JSON.stringify(cartarray));
      this.cartcount.set(this.gettotalcart());
    }
  }
}

