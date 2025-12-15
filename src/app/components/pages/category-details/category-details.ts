import { Component, inject, OnInit, signal, effect, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ProductCard } from '../../../shared/product-card/product-card';
import { UserService } from '../../../services/user.service';
import { CounterService } from '../../../services/counter.service';
import { ToastService } from '../../../services/toast.service';
import { CategoryService } from '../../../services/category.service';
import { CartServ } from '../../../services/cart-serv';
import { FavServ } from '../../../services/fav-serv';
import { ProductServ } from '../../../services/product-serv';
import { PaginatedResponse } from '../../../types/product';

// Extended product interface to handle both Angular and React-style data
interface CategoryProduct {
  id: number;
  skuId?: number; // React style
  nameEn?: string;
  nameAr?: string;
  name?: string; // Angular style
  description?: string;
  cardDescriptionEn?: string;
  cardDescriptionAr?: string;
  price: number;
  priceAfter?: number; // React style
  priceBefore?: number; // React style
  discountPrice?: number; // Angular style
  imageUrl?: string;
  Images?: Array<{ url: string }>; // React style
  isActive: boolean;
  isDeleted?: boolean;
  availableStock?: number; // React style
  stock?: any[]; // Angular style
  tags?: Array<{ tag: { id: number; nameEn: string; nameAr: string } }>;
  company?: any;
  companyId?: number;
  company_id?: number;
  company_name?: string;
  company_name_en?: string;
  company_name_ar?: string;
  companyName?: string;
  itemRank?: number; // React style
  rank?: number; // Angular style
  createdAt?: string;
  maxOrderQuantity?: number;
}

interface Category {
  id: number;
  nameEn?: string;
  nameAr?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  products?: CategoryProduct[];
}

interface Tag {
  id: number;
  nameEn: string;
  nameAr: string;
}

interface Brand {
  id: string;
  nameEn: string;
  nameAr: string;
}

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [CommonModule, ProductCard, NgClass],
  templateUrl: './category-details.html',
  styleUrl: './category-details.css',
})
export class CategoryDetailsComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private http = inject(HttpClient);
  userService = inject(UserService);
  counterService = inject(CounterService);
  toastService = inject(ToastService);
  categoryService = inject(CategoryService);
  cartServ = inject(CartServ);
  favServ = inject(FavServ);
  productServ = inject(ProductServ);

  // ViewChild refs for dropdowns
  @ViewChild('sortDropdownRef', { static: false }) sortDropdownRef?: ElementRef<HTMLElement>;
  @ViewChild('tagDropdownRef', { static: false }) tagDropdownRef?: ElementRef<HTMLElement>;
  @ViewChild('brandDropdownRef', { static: false }) brandDropdownRef?: ElementRef<HTMLElement>;
  @ViewChild('sliderRef', { static: false }) sliderRef?: ElementRef<HTMLElement>;

  // State
  category = signal<Category | null>(null);
  products = signal<CategoryProduct[]>([]);
  isLoading = signal<boolean>(true);
  isQuickViewOpen = signal<boolean>(false);
  selectedProduct = signal<CategoryProduct | null>(null);
  showFilters = signal<boolean>(false);
  showSort = signal<boolean>(false);
  currentSort = signal<string>('itemRank_asc');
  priceFilterApplied = signal<boolean>(false);
  tempMin = signal<number>(0);
  tempMax = signal<number>(5000);
  filteredProducts = signal<CategoryProduct[]>([]);
  tags = signal<Tag[]>([]);
  selectedTag = signal<Tag | null>(null);
  showTagDropdown = signal<boolean>(false);
  brands = signal<Brand[]>([]);
  selectedBrand = signal<Brand | null>(null);
  showBrandDropdown = signal<boolean>(false);
  loadingCartItems = signal<Set<number>>(new Set());
  private loadingCartRef = new Set<number>();

  // Pagination state
  currentPage = signal<number>(1);
  pageSize = signal<number>(21); // 3 rows x 7 columns = 21 products per page
  totalCount = signal<number>(0);
  totalPages = signal<number>(0);
  hasNext = signal<boolean>(false);
  hasPrevious = signal<boolean>(false);
  private currentCategoryId: number | null = null;
  private allProductsCache: CategoryProduct[] = []; // Cache for client-side filtering

  // Computed
  get isArabic(): boolean {
    return this.userService.isArabic();
  }

  constructor() {
    // Initialize min and max search values
    effect(() => {
      this.counterService.setMinSearch(0);
      this.counterService.setMaxSearch(5000);
    });

    // Initialize cart in localStorage
    effect(() => {
      const storedCart = localStorage.getItem('cart');
      if (!storedCart) {
        localStorage.setItem('cart', JSON.stringify([]));
      }
      // Update cart count from CartServ
      this.cartServ.cartcount.set(this.cartServ.gettotalcart());
    });

    // Handle tag/brand filter changes with pagination
    effect(() => {
      const selectedTag = this.selectedTag();
      const selectedBrand = this.selectedBrand();
      
      // If tag or brand is selected, use client-side filtering
      if (selectedTag || selectedBrand) {
        if (this.allProductsCache.length > 0) {
          this.currentPage.set(1); // Reset to first page
          this.applyClientSideFilters();
        } else if (this.currentCategoryId) {
          // If cache is empty, fetch all products first
          this.fetchAllProductsForFilters(this.currentCategoryId, []);
        }
      }
    });
  }

  ngOnInit(): void {
    // Scroll to top when loading
    if (this.isLoading()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Get category ID from route
    this.route.params.subscribe((params) => {
      const categoryId = +params['id'];
      if (categoryId && categoryId !== this.currentCategoryId) {
        this.currentCategoryId = categoryId;
        this.currentPage.set(1); // Reset to first page
        this.fetchCategoryData(categoryId);
      }
    });

    // Set initial sort based on language
    this.currentSort.set(this.isArabic ? 'itemRank_desc' : 'itemRank_asc');
  }

  private fetchCategoryData(categoryId: number): void {
    this.isLoading.set(true);
    
    // Check if we need client-side filtering (tags or brands)
    const needsClientSideFiltering = this.selectedTag() || this.selectedBrand();
    
    if (needsClientSideFiltering && this.allProductsCache.length > 0) {
      // Use cached products and apply client-side filters
      this.applyClientSideFilters();
      this.isLoading.set(false);
      return;
    }

    // Build query parameters for backend
    const query: any = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      categoryId: categoryId,
      isActive: true,
    };

    // Add price filter if applied
    if (this.priceFilterApplied()) {
      query.minPrice = this.counterService.minSearch();
      query.maxPrice = this.counterService.maxSearch();
    }

    // Map client-side sort to backend sortBy
    const backendSortBy = this.mapSortToBackend(this.currentSort());
    if (backendSortBy) {
      query.sortBy = backendSortBy;
    }

    // Fetch from backend with pagination
    this.productServ.getProductsAdvanced(query).subscribe({
      next: (response: PaginatedResponse<any>) => {
        // Transform products to match expected format
        const transformedProducts = this.transformProducts(response.items);
        
        // Update pagination state
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.hasNext.set(response.hasNext);
        this.hasPrevious.set(response.hasPrevious);

        // Create category object from first product (if available)
        if (transformedProducts.length > 0 && !this.category()) {
          const categoryData: Category = {
            id: categoryId,
            nameEn: response.items[0]?.categoryName || '',
            nameAr: response.items[0]?.categoryName || '',
            name: response.items[0]?.categoryName || '',
            products: transformedProducts,
            isActive: true,
          };
          this.category.set(categoryData);
        }

        // If we need to extract tags/brands, fetch all products first time
        if (this.allProductsCache.length === 0) {
          this.fetchAllProductsForFilters(categoryId, transformedProducts);
        }

        this.products.set(transformedProducts);
        this.filteredProducts.set(transformedProducts);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error fetching category data:', error);
        this.toastService.error(
          this.isArabic ? 'فشل تحميل بيانات الفئة' : 'Failed to load category data',
          { style: { fontFamily: "'Alexandria', sans-serif", fontWeight: 300, fontSize: '14px' } }
        );
        this.isLoading.set(false);
      },
    });
  }

  private fetchAllProductsForFilters(categoryId: number, currentProducts: CategoryProduct[]): void {
    // Fetch all products without pagination to extract tags and brands
    this.http.get<any[]>(`http://localhost:5062/api/Products/category/${categoryId}`).subscribe({
      next: (allProducts) => {
        this.allProductsCache = this.transformProducts(allProducts);
        this.extractTags(this.allProductsCache);
        this.extractBrands(this.allProductsCache);
      },
      error: (error) => {
        // If fetching all fails, use current products
        this.allProductsCache = currentProducts;
        this.extractTags(currentProducts);
        this.extractBrands(currentProducts);
      },
    });
  }

  private mapSortToBackend(sortOption: string): string | null {
    const sortMap: { [key: string]: string } = {
      'newest': 'dateDesc',
      'oldest': 'date',
      'price_asc': 'price',
      'price_desc': 'priceDesc',
      'name_asc': 'name',
      'name_desc': 'nameDesc',
      'itemRank_asc': 'name', // Default fallback
      'itemRank_desc': 'nameDesc',
    };
    return sortMap[sortOption] || null;
  }

  private applyClientSideFilters(): void {
    let filtered = [...this.allProductsCache];

    // Apply tag filtering
    if (this.selectedTag()) {
      filtered = filtered.filter((product) =>
        product.tags?.some(
          (tagObj) => tagObj.tag && tagObj.tag.id === this.selectedTag()!.id
        )
      );
    }

    // Apply brand filtering
    if (this.selectedBrand()) {
      filtered = filtered.filter((product) => {
        const companyObject =
          product && product.company && typeof product.company === 'object'
            ? product.company
            : null;

        const brandIds = [
          product.companyId,
          product.company_id,
          companyObject?.id,
        ]
          .filter((id) => id !== undefined && id !== null)
          .map((id) => id.toString());

        if (this.selectedBrand()!.id && brandIds.includes(this.selectedBrand()!.id.toString())) {
          return true;
        }

        const productBrandNames = [
          product.company_name,
          product.company_name_en,
          product.company_name_ar,
          typeof product.company === 'string' ? product.company : null,
          companyObject?.name,
          companyObject?.nameEn,
          companyObject?.nameAr,
        ]
          .filter(Boolean)
          .map((name) => name.toString().trim().toLowerCase());

        const selectedBrandNames = [this.selectedBrand()!.nameEn, this.selectedBrand()!.nameAr]
          .filter(Boolean)
          .map((name) => name.toString().trim().toLowerCase());

        if (selectedBrandNames.length === 0) {
          return false;
        }

        return productBrandNames.some((name) => selectedBrandNames.includes(name));
      });
    }

    // Apply sorting
    filtered = this.applySorting(filtered, this.currentSort());

    // Apply pagination
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    const paginatedProducts = filtered.slice(startIndex, endIndex);

    // Update pagination state
    this.totalCount.set(filtered.length);
    this.totalPages.set(Math.ceil(filtered.length / this.pageSize()));
    this.hasNext.set(endIndex < filtered.length);
    this.hasPrevious.set(this.currentPage() > 1);

    this.filteredProducts.set(paginatedProducts);
  }

  private transformProducts(products: any[]): CategoryProduct[] {
    return products.map((p) => {
      // Ensure image URL is properly set
      const imageUrl = p.productImage || p.imageUrl || '';
      
      return {
        id: p.id,
        skuId: p.id, // Use id as skuId for compatibility
        nameEn: p.productName,
        nameAr: p.productName,
        name: p.productName,
        description: p.description,
        cardDescriptionEn: p.description, // Set English description
        cardDescriptionAr: p.description, // Set Arabic description (same for now, can be updated if backend provides separate fields)
        price: p.price,
        priceAfter: p.discountPrice || p.price,
        priceBefore: p.discountPrice ? p.price : undefined,
        discountPrice: p.discountPrice,
        imageUrl: imageUrl,
        Images: imageUrl ? [{ url: imageUrl }] : [],
        isActive: p.isActive,
        isDeleted: false,
        availableStock: p.stock?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0,
        stock: p.stock || [],
        tags: p.tags || [],
        rank: p.rank,
        itemRank: p.rank || 0,
        createdAt: p.createdAt,
        maxOrderQuantity: p.maxOrderQuantity,
      };
    });
  }

  private extractTags(products: CategoryProduct[]): void {
    if (!products || products.length === 0) {
      this.tags.set([]);
      return;
    }

    const tagIds = new Set<number>();
    products.forEach((product) => {
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach((tagObj) => {
          if (tagObj && tagObj.tag && tagObj.tag.id) {
            tagIds.add(tagObj.tag.id);
          }
        });
      }
    });

    if (tagIds.size > 0) {
      // Try to fetch tags from API
      this.http.get<Tag[]>('http://localhost:5062/api/Tags').subscribe({
        next: (allTags) => {
          const categoryTags = allTags.filter((tag) => tagIds.has(tag.id));
          this.tags.set(categoryTags.length > 0 ? categoryTags : allTags);
        },
        error: () => {
          // If tags endpoint doesn't exist, extract from products
          const extractedTags: Tag[] = [];
          products.forEach((product) => {
            if (product.tags) {
              product.tags.forEach((tagObj) => {
                if (tagObj.tag && !extractedTags.find((t) => t.id === tagObj.tag.id)) {
                  extractedTags.push(tagObj.tag);
                }
              });
            }
          });
          this.tags.set(extractedTags);
        },
      });
    } else {
      this.tags.set([]);
    }
  }

  private extractBrands(products: CategoryProduct[]): void {
    if (!products || products.length === 0) {
      this.brands.set([]);
      this.selectedBrand.set(null);
      return;
    }

    const brandMap = new Map<string, Brand>();

    products.forEach((product) => {
      const companyObject =
        product && product.company && typeof product.company === 'object' ? product.company : null;

      const brandId = (product.companyId ?? product.company_id ?? companyObject?.id)?.toString();
      const brandNameEn =
        product.company_name ||
        product.company_name_en ||
        companyObject?.nameEn ||
        (typeof product.company === 'string' ? product.company : companyObject?.name) ||
        product.companyName ||
        '';
      const brandNameAr =
        product.company_name_ar ||
        companyObject?.nameAr ||
        brandNameEn ||
        '';

      const uniqueKey = brandId || brandNameEn || brandNameAr;

      if (!uniqueKey) {
        return;
      }

      if (!brandMap.has(uniqueKey)) {
        brandMap.set(uniqueKey, {
          id: brandId || uniqueKey.toString(),
          nameEn: brandNameEn || brandNameAr || 'Brand',
          nameAr: brandNameAr || brandNameEn || 'البراند',
        });
      }
    });

    const brandList = Array.from(brandMap.values()).sort((a, b) =>
      (a.nameEn || '').localeCompare(b.nameEn || '', undefined, { sensitivity: 'base' })
    );

    this.brands.set(brandList);
  }

  // This method is now replaced by applyClientSideFilters for tag/brand filtering
  // Price filtering and sorting are handled by backend

  private applySorting(products: CategoryProduct[], sortOption: string): CategoryProduct[] {
    if (!products) return [];

    const sortedProducts = [...products];

    // First apply default sorting by rank and ID
    sortedProducts.sort((a, b) => {
      const rankA = a.itemRank || a.rank || 0;
      const rankB = b.itemRank || b.rank || 0;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return a.id - b.id;
    });

    // Then apply additional sorting
    switch (sortOption) {
      case 'newest':
        return sortedProducts.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      case 'oldest':
        return sortedProducts.sort(
          (a, b) =>
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
      case 'price_asc':
        return sortedProducts.sort(
          (a, b) => (a.priceAfter || a.price) - (b.priceAfter || b.price)
        );
      case 'price_desc':
        return sortedProducts.sort(
          (a, b) => (b.priceAfter || b.price) - (a.priceAfter || a.price)
        );
      case 'name_asc':
        return sortedProducts.sort((a, b) =>
          (a.nameEn || a.nameAr || a.name || '').localeCompare(
            b.nameEn || b.nameAr || b.name || ''
          )
        );
      case 'name_desc':
        return sortedProducts.sort((a, b) =>
          (b.nameEn || b.nameAr || b.name || '').localeCompare(
            a.nameEn || a.nameAr || a.name || ''
          )
        );
      default:
        return sortedProducts;
    }
  }

  handleSort(sortOption: string): void {
    this.currentSort.set(sortOption);
    this.currentPage.set(1); // Reset to first page
    if (this.currentCategoryId) {
      this.fetchCategoryData(this.currentCategoryId);
    }
  }

  applyPriceFilter(): void {
    this.counterService.setMinSearch(this.tempMin());
    this.counterService.setMaxSearch(this.tempMax());
    this.priceFilterApplied.set(true);
    this.currentPage.set(1); // Reset to first page
    if (this.currentCategoryId) {
      this.fetchCategoryData(this.currentCategoryId);
    }
  }

  resetPriceFilter(): void {
    this.tempMin.set(0);
    this.tempMax.set(5000);
    this.counterService.setMinSearch(0);
    this.counterService.setMaxSearch(5000);
    this.priceFilterApplied.set(false);
    this.currentPage.set(1); // Reset to first page
    if (this.currentCategoryId) {
      this.fetchCategoryData(this.currentCategoryId);
    }
  }

  resetTagFilter(): void {
    this.selectedTag.set(null);
    this.currentPage.set(1); // Reset to first page
    if (this.selectedBrand()) {
      // If brand is still selected, use client-side filtering
      this.applyClientSideFilters();
    } else if (this.currentCategoryId) {
      // Otherwise refetch from backend
      this.fetchCategoryData(this.currentCategoryId);
    }
  }

  resetBrandFilter(): void {
    this.selectedBrand.set(null);
    this.currentPage.set(1); // Reset to first page
    if (this.selectedTag()) {
      // If tag is still selected, use client-side filtering
      this.applyClientSideFilters();
    } else if (this.currentCategoryId) {
      // Otherwise refetch from backend
      this.fetchCategoryData(this.currentCategoryId);
    }
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      if (this.selectedTag() || this.selectedBrand()) {
        // Use client-side filtering
        this.applyClientSideFilters();
      } else if (this.currentCategoryId) {
        // Fetch from backend
        this.fetchCategoryData(this.currentCategoryId);
      }
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.hasPrevious()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  handleQuickViewClick(product: CategoryProduct): void {
    this.selectedProduct.set(product);
    this.isQuickViewOpen.set(true);
  }

  handleCloseQuickView(): void {
    this.isQuickViewOpen.set(false);
    this.selectedProduct.set(null);
  }

  async addToCartLocal(skuId: number, quantity: number = 1): Promise<void> {
    // Prevent multiple clicks
    if (this.loadingCartRef.has(skuId)) {
      return;
    }

    this.loadingCartRef.add(skuId);
    this.loadingCartItems.update((set) => new Set(set).add(skuId));

    try {
      const userToken = localStorage.getItem('userToken');

      if (!userToken) {
        // Handle non-logged in users - use 'cart' key with format { id: number, quantity: number }[]
        // Use CartServ to handle adding/updating cart (it will increment quantity if product exists)
        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingProduct = existingCart.find((item: { id: number; quantity: number }) => item.id === skuId);
        const newQuantity = existingProduct ? existingProduct.quantity + quantity : quantity;

        // Update cart using CartServ (it handles both add and update)
        this.cartServ.addtocart(skuId, newQuantity);

        this.toastService.success(
          this.isArabic ? 'تمت الإضافة إلى السلة!' : 'Added to cart!',
          { style: { fontFamily: 'Alexandria, sans-serif', fontWeight: 300 } }
        );

        await new Promise((resolve) => setTimeout(resolve, 300));
      } else {
        // Handle logged in users
        const headers = new HttpHeaders({
          'Access-Token': userToken,
          'Content-Type': 'application/json',
        });

        const requestBody = {
          productId: skuId,
          quantity: quantity,
        };

        this.http
          .post<{ id: number; userId: string; totalAmount: number; cartItems: Array<{ id: number; productId: number; productName: string; productPrice: number; productImage: string; quantity: number; totalPrice: number }> }>('http://localhost:5062/api/Cart/add', requestBody, { headers })
          .subscribe({
            next: (cart) => {
              // Update cart count based on backend response
              const totalItems = cart?.cartItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
              this.cartServ.cartcount.set(totalItems);

              this.toastService.success(
                this.isArabic ? 'تمت الإضافة إلى السلة!' : 'Added to cart!',
                { style: { fontFamily: 'Alexandria, sans-serif', fontWeight: 300 } }
              );
            },
            error: (error) => {
              const orderingLimitMessage = this.userService.handleOrderingLimitError(error, '');
              if (orderingLimitMessage) {
                this.toastService.error(orderingLimitMessage, {
                  style: { fontFamily: 'Alexandria, sans-serif', fontWeight: 300 },
                });
              } else {
                this.toastService.error(
                  this.isArabic ? 'فشل إضافة المنتج إلى السلة' : 'Failed to Add to Cart',
                  { style: { fontFamily: 'Alexandria, sans-serif', fontWeight: 300 } }
                );
              }
            },
          });
      }
    } catch (error: any) {
      const orderingLimitMessage = this.userService.handleOrderingLimitError(error, '');
      if (orderingLimitMessage) {
        this.toastService.error(orderingLimitMessage, {
          style: { fontFamily: 'Alexandria, sans-serif', fontWeight: 300 },
        });
      } else {
        this.toastService.error(
          this.isArabic ? 'فشل إضافة المنتج إلى السلة' : 'Failed to Add to Cart',
          { style: { fontFamily: 'Alexandria, sans-serif', fontWeight: 300 } }
        );
      }
    } finally {
      this.loadingCartRef.delete(skuId);
      this.loadingCartItems.update((set) => {
        const newSet = new Set(set);
        newSet.delete(skuId);
        return newSet;
      });
    }
  }

  addToWishlist(skuId: number): void {
    this.favServ.addToFav(skuId);
  }

  ngAfterViewInit(): void {
    // ViewChild refs are available here
  }

  // Slider handlers
  onSliderMouseDown(event: MouseEvent, isMin: boolean): void {
    event.preventDefault();
    const slider = this.sliderRef?.nativeElement;
    if (!slider) return;

    const sliderRect = slider.getBoundingClientRect();
    const sliderWidth = sliderRect.width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const newPosition = ((moveEvent.clientX - sliderRect.left) / sliderWidth) * 100;

      if (isMin) {
        const boundedPosition = Math.min(
          Math.max(newPosition, 0),
          (this.tempMax() / 5000) * 100
        );
        const newMinValue = Math.round((boundedPosition / 100) * 5000);
        this.tempMin.set(newMinValue);
      } else {
        const boundedPosition = Math.min(
          Math.max(newPosition, (this.tempMin() / 5000) * 100),
          100
        );
        const newMaxValue = Math.round((boundedPosition / 100) * 5000);
        this.tempMax.set(newMaxValue);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  onSliderTouchStart(event: TouchEvent, isMin: boolean): void {
    event.preventDefault();
    const slider = this.sliderRef?.nativeElement;
    if (!slider) return;

    const sliderRect = slider.getBoundingClientRect();
    const sliderWidth = sliderRect.width;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();
      const touch = moveEvent.touches[0];
      const newPosition = ((touch.clientX - sliderRect.left) / sliderWidth) * 100;

      if (isMin) {
        const boundedPosition = Math.min(
          Math.max(newPosition, 0),
          (this.tempMax() / 5000) * 100
        );
        const newMinValue = Math.round((boundedPosition / 100) * 5000);
        this.tempMin.set(newMinValue);
      } else {
        const boundedPosition = Math.min(
          Math.max(newPosition, (this.tempMin() / 5000) * 100),
          100
        );
        const newMaxValue = Math.round((boundedPosition / 100) * 5000);
        this.tempMax.set(newMaxValue);
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }

  // Close dropdowns when clicking outside
  @HostListener('document:mousedown', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (
      this.sortDropdownRef?.nativeElement &&
      !this.sortDropdownRef.nativeElement.contains(event.target as Node)
    ) {
      this.showSort.set(false);
    }
    if (this.tagDropdownRef?.nativeElement && !this.tagDropdownRef.nativeElement.contains(event.target as Node)) {
      this.showTagDropdown.set(false);
    }
    if (this.brandDropdownRef?.nativeElement && !this.brandDropdownRef.nativeElement.contains(event.target as Node)) {
      this.showBrandDropdown.set(false);
    }
  }

  // Helper methods for template
  getCategoryName(): string {
    const cat = this.category();
    if (!cat) return '';
    return this.isArabic ? cat.nameAr || cat.name || '' : cat.nameEn || cat.name || '';
  }

  getProductName(product: CategoryProduct): string {
    return this.isArabic
      ? product.nameAr || product.name || ''
      : product.nameEn || product.name || '';
  }

  getProductDescription(product: CategoryProduct): string {
    if (this.isArabic) {
      return product.cardDescriptionAr || product.description || '';
    } else {
      // English - prioritize cardDescriptionEn, then description
      return product.cardDescriptionEn || product.description || '';
    }
  }

  getProductImage(product: CategoryProduct): string {
    // Try Images array first (React-style)
    if (product.Images && product.Images.length > 0 && product.Images[0].url) {
      return product.Images[0].url;
    }
    // Fall back to imageUrl
    if (product.imageUrl) {
      return product.imageUrl;
    }
    // Fall back to empty string or placeholder
    return '';
  }

  getAvailableStock(product: CategoryProduct): number {
    if (product.availableStock !== undefined) {
      return product.availableStock;
    }
    if (product.stock && Array.isArray(product.stock)) {
      return product.stock.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);
    }
    return 0;
  }

  // Math helpers for template
  Math = Math;

  calculateDiscountPercentage(priceBefore: number | undefined, priceAfter: number | undefined): number {
    if (!priceBefore || !priceAfter || priceBefore <= priceAfter) {
      return 0;
    }
    return Math.round(((priceBefore - priceAfter) / priceBefore) * 100);
  }

  getActiveProductsCount(): number {
    return this.filteredProducts().filter((p) => p.isActive && !p.isDeleted).length;
  }

  getActiveFilteredProducts(): CategoryProduct[] {
    return this.filteredProducts().filter((p) => p.isActive && !p.isDeleted);
  }

  hasDiscount(product: CategoryProduct | null): boolean {
    if (!product) return false;
    return (
      this.getAvailableStock(product) > 0 &&
      !!product.priceBefore &&
      !!product.priceAfter &&
      product.priceBefore > product.priceAfter
    );
  }

  getProductPrice(product: CategoryProduct | null): number {
    if (!product) return 0;
    return product.priceAfter || product.price || 0;
  }

  shouldShowPriceBefore(product: CategoryProduct | null): boolean {
    if (!product || !product.priceBefore) return false;
    const currentPrice = this.getProductPrice(product);
    return product.priceBefore > currentPrice;
  }

  hasTags(product: CategoryProduct | null): boolean {
    return !!(product?.tags && product.tags.length > 0);
  }

  getPageNumbers(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: number[] = [];

    if (total <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (current > 3) {
        pages.push(-1); // Ellipsis
      }

      // Show pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push(-1); // Ellipsis
      }

      // Show last page
      pages.push(total);
    }

    return pages;
  }

  // Format price without .00 and with price before currency
  formatPrice(price: number | undefined | null): string {
    if (price === undefined || price === null || isNaN(price)) return '';
    
    // Remove .00 if it exists (e.g., 100.00 becomes 100, 100.50 stays 100.5)
    let formattedPrice: string;
    if (price % 1 === 0) {
      // Whole number - no decimals
      formattedPrice = Math.round(price).toString();
    } else {
      // Has decimals - remove trailing zeros
      formattedPrice = price.toFixed(2).replace(/\.?0+$/, '');
    }
    
    // Price before currency
    const currency = this.isArabic ? 'جنية' : 'EGP';
    return `${formattedPrice} ${currency}`;
  }
}

