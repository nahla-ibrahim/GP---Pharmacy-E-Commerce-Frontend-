import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { ProductServ } from '../../../services/product-serv';
import { HomeServ } from '../../../services/home-serv';
import { BranchServ } from '../../../services/branch-serv';
import { product, ProductQuery, PaginatedResponse } from '../../../types/product';
import { ProductCard } from '../../../shared/product-card/product-card';
import { Category, Homets } from '../../../types/Homets';
import { BranchesTs } from '../../../types/branches';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, ProductCard],
  templateUrl: './products.html',
  styleUrls: ['./products.css'],
})
export class ProductsComponent implements OnInit {
  productServ = inject(ProductServ);
  homeServ = inject(HomeServ);
  branchServ = inject(BranchServ);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Products data
  products = signal<product[]>([]);
  pagination = signal<PaginatedResponse<product> | null>(null);
  isLoading = signal(false);

  // Filters
  searchTerm = signal('');
  selectedCategoryId = signal<number | undefined>(undefined);
  selectedBranchId = signal<number | undefined>(undefined);
  sortBy = signal('name');
  minPrice = signal<number | undefined>(undefined);
  maxPrice = signal<number | undefined>(undefined);
  inStockOnly = signal(false);

  // Options
  categories = signal<Category[]>([]);
  branches = signal<BranchesTs[]>([]);
  sortOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'nameDesc', label: 'Name (Z-A)' },
    { value: 'price', label: 'Price (Low to High)' },
    { value: 'priceDesc', label: 'Price (High to Low)' },
    { value: 'dateDesc', label: 'Newest First' },
    { value: 'date', label: 'Oldest First' },
  ];

  // Pagination
  currentPage = signal(1);
  pageSize = signal(12);

  ngOnInit() {
    // Check for search query parameter
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTerm.set(params['search']);
      }
    });
    
    this.loadCategories();
    this.loadBranches();
    this.loadProducts();
  }

  loadCategories() {
    this.homeServ.getHomeData().subscribe({
      next: (res: Homets) => {
        this.categories.set(res.categories || []);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      },
    });
  }

  loadBranches() {
    this.branchServ.getBranches().subscribe({
      next: (res) => {
        this.branches.set(res || []);
      },
      error: (err) => {
        console.error('Error loading branches:', err);
      },
    });
  }

  loadProducts() {
    this.isLoading.set(true);

    const query: ProductQuery = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      search: this.searchTerm() || undefined,
      categoryId: this.selectedCategoryId(),
      branchId: this.selectedBranchId(),
      sortBy: this.sortBy(),
      minPrice: this.minPrice(),
      maxPrice: this.maxPrice(),
      isActive: true,
      inStock: this.inStockOnly() ? true : undefined,
    };

    this.productServ.getProductsAdvanced(query).subscribe({
      next: (response) => {
        this.products.set(response.items);
        this.pagination.set(response);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.isLoading.set(false);
        this.products.set([]);
      },
    });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadProducts();
  }

  onCategoryChange(categoryId: number | undefined) {
    this.selectedCategoryId.set(categoryId);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onBranchChange(branchId: number | undefined) {
    this.selectedBranchId.set(branchId);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onSortChange(sortBy: string) {
    this.sortBy.set(sortBy);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onPriceInput() {
    // Trigger change detection for validation display (no API call on input)
  }

  onPriceFilterChange() {
    // Only load products if validation passes
    if (!this.hasPriceValidationError()) {
      this.currentPage.set(1);
      this.loadProducts();
    }
  }

  // Check if min price is greater than max price (validation error)
  hasPriceValidationError(): boolean {
    const min = this.minPrice();
    const max = this.maxPrice();
    if (min !== undefined && max !== undefined && min > max) {
      return true;
    }
    return false;
  }

  onStockFilterChange() {
    this.currentPage.set(1);
    this.loadProducts();
  }

  clearFilters() {
    this.searchTerm.set('');
    this.selectedCategoryId.set(undefined);
    this.selectedBranchId.set(undefined);
    this.sortBy.set('name');
    this.minPrice.set(undefined);
    this.maxPrice.set(undefined);
    this.inStockOnly.set(false);
    this.currentPage.set(1);
    this.loadProducts();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= (this.pagination()?.totalPages || 1)) {
      this.currentPage.set(page);
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage() {
    const pagination = this.pagination();
    if (pagination?.hasNext) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage() {
    const pagination = this.pagination();
    if (pagination?.hasPrevious) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get totalPages(): number {
    return this.pagination()?.totalPages || 0;
  }

  get totalCount(): number {
    return this.pagination()?.totalCount || 0;
  }

  get hasNext(): boolean {
    return this.pagination()?.hasNext || false;
  }

  get hasPrevious(): boolean {
    return this.pagination()?.hasPrevious || false;
  }

  // Get pagination pages to display (smart pagination with ellipsis)
  // Format: "1 2 3 4 ... Last" - Always show first 4 pages, then ellipsis, then last page
  getPaginationPages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 5) {
      // If 5 or fewer pages, show all
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first 4 pages
      for (let i = 1; i <= 4; i++) {
        pages.push(i);
      }
      
      // Show ellipsis if there's a gap
      if (total > 5) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(total);
    }

    return pages;
  }
}
