import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HomeServ, TopRankedCategory, TopRankedProduct, Banner } from '../../../../services/home-serv';
import { ProductCard } from '../../../../shared/product-card/product-card';

@Component({
  selector: 'app-categories-products-section',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCard],
  templateUrl: './categories-products-section.html',
  styleUrl: './categories-products-section.css'
})
export class CategoriesProductsSection implements OnInit {
  private homeServ = inject(HomeServ);
  
  categories = signal<TopRankedCategory[]>([]);
  banners = signal<Banner[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Track scroll positions for each carousel
  scrollPositions = new Map<number, number>();

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    // Fetch both categories and banners in parallel
    this.homeServ.getTopRankedCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoading.set(false);
        // Initialize carousel positions after data loads
        setTimeout(() => {
          categories.forEach(category => {
            const carousel = document.getElementById(`carousel-${category.category_id}`);
            if (carousel) {
              carousel.style.transform = 'translateX(0px)';
              this.scrollPositions.set(category.category_id, 0);
            }
          });
        }, 100);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.error.set('Failed to load categories');
        this.isLoading.set(false);
      }
    });

    this.homeServ.getMiddleBanners().subscribe({
      next: (banners) => {
        this.banners.set(banners);
      },
      error: (err) => {
        console.error('Error loading banners:', err);
      }
    });
  }

  // Get a single banner for a specific category index (cycling through available banners)
  getBannerForIndex(index: number): Banner | null {
    const banners = this.banners();
    if (banners.length === 0) return null;
    // Cycle through banners based on category index
    return banners[index % banners.length];
  }

  // Scroll carousel left - use native scroll on mobile, transform on desktop
  scrollLeft(categoryId: number, carouselId: string): void {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    const isMobile = window.innerWidth < 768;
    const scrollAmount = 300;
    
    if (isMobile) {
      // Use native scroll on mobile
      carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      // Use transform on desktop
      const currentPos = this.scrollPositions.get(categoryId) || 0;
      const newPos = Math.max(0, currentPos - scrollAmount);
      carousel.style.transform = `translateX(-${newPos}px)`;
      carousel.style.transition = 'transform 0.3s ease';
      this.scrollPositions.set(categoryId, newPos);
    }
  }

  // Scroll carousel right - use native scroll on mobile, transform on desktop
  scrollRight(categoryId: number, carouselId: string): void {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    const isMobile = window.innerWidth < 768;
    const scrollAmount = 300;
    
    if (isMobile) {
      // Use native scroll on mobile
      carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
      // Use transform on desktop
      const currentPos = this.scrollPositions.get(categoryId) || 0;
      const container = carousel.parentElement;
      if (container) {
        const maxScroll = Math.max(0, carousel.scrollWidth - container.clientWidth);
        const newPos = Math.min(maxScroll, currentPos + scrollAmount);
        carousel.style.transform = `translateX(-${newPos}px)`;
        carousel.style.transition = 'transform 0.3s ease';
        this.scrollPositions.set(categoryId, newPos);
      }
    }
  }

  // Prevent wheel scrolling on carousels
  preventWheelScroll(event: WheelEvent, carouselId: string): void {
    const carousel = document.getElementById(carouselId);
    if (carousel && event.deltaX !== 0) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  // Get banner image URL with proper backend URL
  getBannerImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
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
    // Default: assume it's in images/banners folder
    return `http://localhost:5062/images/banners/${imageUrl}`;
  }

  // Get product image URL with proper backend URL
  getProductImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
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

  // Convert product to format expected by ProductCard
  convertProduct(product: TopRankedProduct): any {
    // Get image URL from product images array - use actual image from response
    let imageUrl = product.images?.[0]?.image_url || '';
    
    // Process the image URL to get full path
    if (imageUrl) {
      imageUrl = this.getProductImageUrl(imageUrl);
    }

    // Create stock array format expected by ProductCard
    const stock = product.available_stock > 0 ? [{
      productId: product.sku_id,
      productName: product.product_name_en,
      branchId: 0, // Default branch
      branchName: 'Main Branch',
      quantity: product.available_stock,
      minimumStockLevel: 10,
      maximumStockLevel: 100,
      lastRestocked: new Date().toISOString(),
      isLowStock: product.available_stock < 10,
      isOutOfStock: product.available_stock === 0
    }] : [];

    return {
      id: product.sku_id,
      name: product.product_name_en,
      description: product.description || '',
      price: product.price_before || product.price_after,
      discountPrice: product.price_before && product.price_before > product.price_after ? product.price_after : undefined,
      imageUrl: imageUrl,
      isPrescriptionRequired: false,
      isActive: product.available_stock > 0,
      categoryId: product.category_id,
      categoryName: '',
      createdAt: new Date().toISOString(),
      rank: product.item_rank,
      maxOrderQuantity: undefined,
      stock: stock,
      isFav: false,
      quantity: 0
    };
  }
}

