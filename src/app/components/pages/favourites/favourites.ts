import { CommonModule, Location } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartServ } from '../../../services/cart-serv';
import { FavServ } from '../../../services/fav-serv';
import { ProductServ } from '../../../services/product-serv';
import { signal } from '@angular/core';
import { ProductCard } from '../../../shared/product-card/product-card';

@Component({
  selector: 'app-favourites',
  imports: [CommonModule, RouterLink, ProductCard],
  templateUrl: './favourites.html',
  styleUrl: './favourites.css',
})
export class  FavouritesComponent {

  private favServ = inject(FavServ);
  private cartServ = inject(CartServ);
  private productServ = inject(ProductServ);
  private location = inject(Location);

  favIds = this.favServ.favlist;

  fullFavList = signal<any[]>([]);

  constructor() {
    // Watch for changes in favlist and reload products automatically
    effect(() => {
      // Access favlist to create dependency
      this.favServ.favlist();
      // Reload products when favlist changes
      this.loadFavProducts();
    });
    
    // Initial load
    this.loadFavProducts();
  }

  loadFavProducts() {
    this.productServ.getProduct().subscribe((products) => {
      const ids = this.favServ.favlist();

      const mapped = ids
        .map((fav) => {
          const product = products.find((p) => p.id === fav.id);
          if (product) {
            // Ensure imageUrl is properly formatted
            if (product.imageUrl && !product.imageUrl.startsWith('http')) {
              product.imageUrl = this.getProductImageUrl(product.imageUrl);
            }
          }
          return product;
        })
        .filter((x) => x);

      this.fullFavList.set(mapped);
    });
  }

  // Get product image URL with proper backend URL
  getProductImageUrl(imageUrl: string): string {
    if (!imageUrl) return 'assets/images/placeholder.jpg';
    // If already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // If it's a relative path starting with /, return as is
    if (imageUrl.startsWith('/')) {
      return `http://localhost:5062${imageUrl}`;
    }
    // If it's just a filename or relative path, construct the full URL
    if (imageUrl.startsWith('images/')) {
      return `http://localhost:5062/${imageUrl}`;
    }
    // Default: assume it's in images/products folder
    return `http://localhost:5062/images/products/${imageUrl}`;
  }

  removeFromFav(productId: number) {
    this.favServ.addToFav(productId);
    this.loadFavProducts(); 
  }
  goBack() {
    this.location.back();
  }

  clearFav() {
    if (confirm('Are you sure you want to clear all favourites?')) {
      this.favServ.favlist.set([]);
      this.fullFavList.set([]);
      this.favServ.clearAllFav();
    }
  }
}