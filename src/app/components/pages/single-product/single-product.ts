import { Component, computed, effect, inject, OnInit, Signal, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductServ } from '../../../services/product-serv';
import { product } from '../../../types/product';
import { Location, CommonModule } from '@angular/common';
import { CartServ } from '../../../services/cart-serv';
import { FavServ } from '../../../services/fav-serv';
import { HomeServ } from '../../../services/home-serv';
import { ProductCard } from '../../../shared/product-card/product-card';

@Component({
  selector: 'app-single-product',
  templateUrl: './single-product.html',
  styleUrls: ['./single-product.css'],
  imports: [CommonModule, ProductCard],
})
export class SingleProduct implements OnInit {
  productId!: number;
  productServ = inject(ProductServ);
  cartServ = inject(CartServ);
  favServ = inject(FavServ);
  homeServ = inject(HomeServ);
  activeRoute = inject(ActivatedRoute);
  location = inject(Location);

  ProductById = signal<product | null>(null);
  discount = signal<number>(0);
  perdiscount = signal<number>(0);
  quantityNum = signal<number>(1);
  productsByCategory: product[] = [];
  relatedProducts = signal<product[]>([]);
  isFav!: Signal<boolean>;
  
  showDiscount = computed(() => {
    const product = this.ProductById();
    return product !== null && 
           product.discountPrice !== undefined && 
           product.price !== undefined && 
           product.discountPrice < product.price && 
           this.discount() > 0;
  });

  ngOnInit(): void {
    // Scroll to top when component initializes
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    this.activeRoute.paramMap.subscribe((params) => {
      this.productId = Number(params.get('id'));

      // Scroll to top when route parameter changes (navigating to different product)
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Get product details
      this.productServ.getProductById(this.productId).subscribe({
        next: (product: product | null) => {
          if (product) {
            this.ProductById.set(product);

            // Calculate discount - handle reversed data entry
            if (product.discountPrice) {
              // Check if data is reversed (price < discountPrice means data entry error)
              if (product.price < product.discountPrice) {
                // Data is reversed: swap them for display
                // discountPrice is actually the higher price (original)
                // price is actually the lower price (discounted)
                const originalPrice = product.discountPrice;
                const discountedPrice = product.price;
                const discountAmount = originalPrice - discountedPrice;
                this.discount.set(Math.max(0, discountAmount));
                this.perdiscount.set(
                  Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
                );
                // Swap the values in the product object for display
                const tempPrice = product.price;
                product.price = product.discountPrice;
                product.discountPrice = tempPrice;
              } else if (product.discountPrice < product.price) {
                // Normal case: discountPrice < price
                const discountAmount = product.price - product.discountPrice;
                this.discount.set(Math.max(0, discountAmount));
                this.perdiscount.set(
                  Math.round(((product.price - product.discountPrice) / product.price) * 100)
                );
              } else {
                // No discount (prices are equal)
                this.discount.set(0);
                this.perdiscount.set(0);
              }
            } else {
              // Reset discount if no valid discount
              this.discount.set(0);
              this.perdiscount.set(0);
            }

            // Get related products by category
            this.productServ.getProductByCategory(product.categoryId).subscribe({
              next: (categoryProducts: product[]) => {
                this.productsByCategory = categoryProducts
                  .filter((item) => item.id !== this.productId)
                  .slice(0, 8);
                this.relatedProducts.set(this.productsByCategory);
              },
              error: (err) => {
                console.error('Error loading related products:', err);
              },
            });
          }
        },
        error: (err) => {
          console.error('Error loading product:', err);
        },
      });
    });

    this.isFav = computed(() =>
      this.favServ.favlist().some((f) => f.id === this.ProductById()?.id)
    );
  }

  goBack() {
    this.location.back();
  }
  decQuantity(quantity: string) {
    if (+quantity <= 0) {
      return;
    } else {
      this.quantityNum.set(Number(+quantity - 1));
    }
  }
  incQuantity(quantity: string) {
    this.quantityNum.set(Number(+quantity + 1));
  }
  addTocart(id: number, quantity: string) {
    this.cartServ.addtocart(id, +quantity);
  }
  addToFav(id: number) {
    this.favServ.addToFav(id);
  }

  getProductImage(product: product | null): string {
    if (!product) return '';
    
    // Use imageUrl from the product
    if (product.imageUrl) {
      // If it's already a full URL, return as is
      if (product.imageUrl.startsWith('http://') || product.imageUrl.startsWith('https://')) {
        return product.imageUrl;
      }
      // If it's a relative path, construct the full URL
      if (product.imageUrl.startsWith('/')) {
        return `http://localhost:5062${product.imageUrl}`;
      }
      // If it's just a filename or relative path, construct the full URL
      return `http://localhost:5062/${product.imageUrl}`;
    }
    
    // Fallback to a placeholder if no image
    return 'assets/images/placeholder.png';
  }
}
