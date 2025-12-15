import { Component, inject, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { AdminService, CreateProductDTO, UpdateProductDTO } from '../../../../services/admin-serv';
import { HomeServ } from '../../../../services/home-serv';
import { Router } from '@angular/router';

interface Category {
  id: number;
  name: string;
  rank?: number;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-products.html',
  styleUrls: ['./admin-products.css'],
})
export class AdminProductsComponent implements OnInit, OnDestroy {
  adminService = inject(AdminService);
  homeService = inject(HomeServ);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);

  // Debounce for search input
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  products: any[] = [];
  categories: Category[] = [];
  filteredProducts: any[] = [];
  
  // Pagination state
  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  totalPages: number = 0;
  hasPrevious: boolean = false;
  hasNext: boolean = false;
  
  // Form state
  showForm: boolean = false;
  isEditMode: boolean = false;
  editingProductId: number | null = null;
  
  // Form fields
  productForm: CreateProductDTO = {
    name: '',
    description: '',
    price: 0,
    discountPrice: 0,
    isPrescriptionRequired: false,
    isActive: true,
    categoryId: 0,
    stock: 0,
  };
  
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  
  // UI state
  isLoading: boolean = false;
  searchTerm: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  ngOnInit() {
    this.checkAuth();
    this.loadCategories();
    this.loadProducts();
    // Ensure filteredProducts is initialized
    this.filteredProducts = [];

    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged(), // Only trigger if search term actually changed
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.filterProducts();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login as admin to access this page');
      this.router.navigate(['/login']);
    }
  }

  loadCategories() {
    this.homeService.getHomeData().subscribe({
      next: (res) => {
        this.categories = res.categories || [];
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.errorMessage = 'Failed to load categories';
      },
    });
  }

  loadProducts() {
    this.isLoading = true;
    this.errorMessage = '';
    console.log('Starting to load products...', { page: this.currentPage, pageSize: this.pageSize, search: this.searchTerm });
    
    // Timeout fallback - ensure loading doesn't stay forever
    const timeoutId = setTimeout(() => {
      if (this.isLoading) {
        console.warn('Products load timeout - forcing stop');
        this.isLoading = false;
        this.errorMessage = 'Request timeout. Please check your connection and try again.';
        this.products = [];
        this.filteredProducts = [];
        this.cdr.detectChanges();
      }
    }, 30000); // 30 second timeout
    
    this.adminService.getProductsPaginated(this.currentPage, this.pageSize, this.searchTerm || undefined).subscribe({
      next: (res) => {
        clearTimeout(timeoutId);
        console.log('Products response received:', res);
        this.isLoading = false;
        
        if (res && res.success !== undefined) {
          if (res.success && res.data) {
            const paginatedData = res.data;
            this.products = Array.isArray(paginatedData.items) ? paginatedData.items : [];
            this.filteredProducts = [...this.products];
            
            // Update pagination state
            this.currentPage = paginatedData.currentPage || 1;
            this.pageSize = paginatedData.pageSize || 10;
            this.totalCount = paginatedData.totalCount || 0;
            this.totalPages = paginatedData.totalPages || 0;
            this.hasPrevious = paginatedData.hasPrevious || false;
            this.hasNext = paginatedData.hasNext || false;
            
            console.log('Products loaded successfully:', {
              count: this.products.length,
              currentPage: this.currentPage,
              totalPages: this.totalPages,
              totalCount: this.totalCount
            });
            this.cdr.detectChanges();
          } else {
            this.products = [];
            this.filteredProducts = [];
            this.errorMessage = res.message || 'Failed to load products';
            console.warn('Products load failed:', res.message);
            this.cdr.detectChanges();
          }
        } else {
          console.error('Unexpected response structure:', res);
          this.isLoading = false;
          this.products = [];
          this.filteredProducts = [];
          this.errorMessage = 'Unexpected response format from server';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        clearTimeout(timeoutId);
        console.error('Error loading products:', err);
        this.isLoading = false;
        this.products = [];
        this.filteredProducts = [];
        this.errorMessage = err.error?.message || err.message || 'Failed to load products. Please check if you are logged in as admin.';
        if (err.status === 401 || err.status === 403) {
          alert('Unauthorized. Please login as admin.');
          this.router.navigate(['/login']);
        }
        this.cdr.detectChanges();
      },
      complete: () => {
        clearTimeout(timeoutId);
        console.log('Products subscription completed');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddForm() {
    this.isEditMode = false;
    this.editingProductId = null;
    this.resetForm();
    this.showForm = true;
  }

  openEditForm(product: any) {
    this.isEditMode = true;
    this.editingProductId = product.id;
    this.productForm = {
      name: product.name,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice || 0,
      isPrescriptionRequired: product.isPrescriptionRequired,
      isActive: product.isActive,
      categoryId: product.categoryId,
      stock: product.quantity || 0,
    };
    this.imagePreview = product.imageUrl || null;
    this.selectedImage = null;
    this.showForm = true;
  }

  resetForm() {
    this.productForm = {
      name: '',
      description: '',
      price: 0,
      discountPrice: 0,
      isPrescriptionRequired: false,
      isActive: true,
      categoryId: 0,
      stock: 0,
    };
    this.selectedImage = null;
    this.imagePreview = null;
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditMode && this.editingProductId) {
      // Update product
      const updateData: UpdateProductDTO = {
        name: this.productForm.name,
        description: this.productForm.description,
        price: this.productForm.price,
        discountPrice: this.productForm.discountPrice,
        isPrescriptionRequired: this.productForm.isPrescriptionRequired,
        isActive: this.productForm.isActive,
        categoryId: this.productForm.categoryId,
        stock: this.productForm.stock,
      };

      this.adminService
        .updateProduct(this.editingProductId, updateData, this.selectedImage || undefined)
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            if (res.success) {
              this.successMessage = 'Product updated successfully!';
              this.loadProducts();
              this.closeForm();
              setTimeout(() => (this.successMessage = ''), 3000);
            } else {
              this.errorMessage = res.message || 'Failed to update product';
            }
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.message || 'Failed to update product';
            console.error('Update error:', err);
          },
        });
    } else {
      // Create product
      this.adminService
        .createProduct(this.productForm, this.selectedImage || undefined)
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            if (res.success) {
              this.successMessage = 'Product created successfully!';
              this.loadProducts();
              this.closeForm();
              setTimeout(() => (this.successMessage = ''), 3000);
            } else {
              this.errorMessage = res.message || 'Failed to create product';
            }
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.message || 'Failed to create product';
            console.error('Create error:', err);
          },
        });
    }
  }

  validateForm(): boolean {
    if (!this.productForm.name.trim()) {
      this.errorMessage = 'Product name is required';
      return false;
    }
    if (!this.productForm.description.trim()) {
      this.errorMessage = 'Product description is required';
      return false;
    }
    if (this.productForm.price <= 0) {
      this.errorMessage = 'Price must be greater than 0';
      return false;
    }
    if (this.productForm.categoryId === 0) {
      this.errorMessage = 'Please select a category';
      return false;
    }
    return true;
  }

  deleteProduct(id: number) {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    this.isLoading = true;
    this.adminService.deleteProduct(id).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.successMessage = 'Product deleted successfully!';
          // If we're on the last page and it becomes empty after deletion, go to previous page
          if (this.currentPage > 1 && this.filteredProducts.length === 1) {
            this.currentPage--;
          }
          this.loadProducts();
          setTimeout(() => (this.successMessage = ''), 3000);
        } else {
          this.errorMessage = res.message || 'Failed to delete product';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to delete product';
        console.error('Delete error:', err);
      },
    });
  }

  closeForm() {
    this.showForm = false;
    this.resetForm();
    this.errorMessage = '';
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  filterProducts() {
    // Reset to page 1 when searching
    this.currentPage = 1;
    this.loadProducts();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage() {
    if (this.hasPrevious) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.hasNext) {
      this.goToPage(this.currentPage + 1);
    }
  }

  onPageSizeChange() {
    this.currentPage = 1; // Reset to first page when changing page size
    this.loadProducts();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  toggleProductStatus(product: any) {
    const updateData: UpdateProductDTO = {
      isActive: !product.isActive,
    };

    this.adminService.updateProduct(product.id, updateData).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadProducts();
        } else {
          this.errorMessage = res.message || 'Failed to update product status';
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update product status';
        console.error('Toggle status error:', err);
      },
    });
  }

  // Expose Math to template
  Math = Math;
}
