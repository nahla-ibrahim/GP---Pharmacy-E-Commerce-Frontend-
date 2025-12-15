import { Component, computed, inject, input, OnInit, Signal, signal } from '@angular/core';
import { product } from '../../types/product';
import { CurrencyPipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { CartServ } from '../../services/cart-serv';
import { ProductCart } from '../../types/cart';
import { FavServ } from '../../services/fav-serv';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, NgClass],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard implements OnInit {
  productdata = input.required<product>();
  cartServ = inject(CartServ);
  favServ = inject(FavServ);
  isFav!: Signal<boolean>;
  router = inject(Router);

  goToSingleProductPage(id: number) {
    this.router.navigateByUrl(`/product-details/${id}`);
  }

  addTocart(id: number) {
    const productofcart = localStorage.getItem('cart');
    const productofcartarray: ProductCart[] = productofcart ? JSON.parse(productofcart) : [];
    const exsistingproduct = productofcartarray.find((item) => item.id == id);
    let x = this.cartServ.addtocart(id, exsistingproduct ? exsistingproduct.quantity + 1 : 1);
  }
  addToFav(id: number) {
    this.favServ.addToFav(id);
    this.productdata().isFav = !this.productdata().isFav;
  }

  /////////////////discount ////////////
  perdiscout = signal<number>(0);

  ngOnInit(): void {
    if (this.productdata()?.discountPrice) {
      this.perdiscout.set(
        ((this.productdata()!.price - (this.productdata()?.discountPrice ?? 0)) * 100) / 100
      );
    }
    this.isFav = computed(() => this.favServ.favlist().some((f) => f.id === this.productdata().id));
  }
}
