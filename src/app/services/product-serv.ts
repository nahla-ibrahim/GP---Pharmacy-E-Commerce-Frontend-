import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { product, ProductDTO, ProductQuery, PaginatedResponse, StockDTO, Stock } from '../types/product';
import { FavCart } from '../types/cart';

@Injectable({
  providedIn: 'root',
})
export class ProductServ {
  private apidata = 'http://localhost:5062/api/Products';
  http = inject(HttpClient);

  /**
   * Helper function to convert backend DTO to frontend product format
   */
  private mapProductDTOToProduct(dto: ProductDTO): product {
    let favproduct = localStorage.getItem('fav');
    const favproductArray: FavCart[] = favproduct ? JSON.parse(favproduct) : [];
    
    return {
      id: dto.id,
      name: dto.productName,
      imageUrl: dto.productImage,
      price: dto.price,
      discountPrice: dto.discountPrice,
      description: dto.description,
      isPrescriptionRequired: dto.isPrescriptionRequired,
      isActive: dto.isActive,
      categoryId: dto.categoryId,
      categoryName: dto.categoryName,
      createdAt: dto.createdAt,
      rank: dto.rank,
      maxOrderQuantity: dto.maxOrderQuantity,
      stock: this.mapStockDTOsToStocks(dto.stock),
      quantity: dto.stock.reduce((sum, s) => sum + s.quantity, 0),
      isFav: !!favproductArray.find((f) => f.id == dto.id),
    };
  }

  /**
   * Helper function to convert StockDTO[] to Stock[]
   */
  private mapStockDTOsToStocks(stocks: StockDTO[]): Stock[] {
    return stocks.map(s => ({
      productId: s.productId,
      productName: s.productName,
      branchId: s.branchId,
      branchName: s.branchName,
      quantity: s.quantity,
      minimumStockLevel: s.minimumStockLevel,
      maximumStockLevel: s.maximumStockLevel,
      lastRestocked: s.lastRestocked,
      isLowStock: s.isLowStock,
      isOutOfStock: s.isOutOfStock,
    }));
  }

  /**
   * Get all products (backward compatibility)
   */
  getProduct() {
    return this.http.get<ProductDTO[]>(this.apidata).pipe(
      map((res) => {
        return res.map(dto => this.mapProductDTOToProduct(dto));
      }),
      catchError((err: any) => {
        console.error('Error fetching products:', err);
        alert(err.message || 'Failed to load products');
        return [];
      })
    );
  }

  /**
   * Get product by ID
   */
  getProductById(id: number): Observable<product | null> {
    return this.http.get<ProductDTO>(`${this.apidata}/${id}`).pipe(
      map((res) => {
        return this.mapProductDTOToProduct(res);
      }),
      catchError((err: any) => {
        console.error('Error fetching product:', err);
        alert(err.message || 'Failed to load product');
        return of(null);
      })
    );
  }

  /**
   * Get products by category
   */
  getProductByCategory(id: number) {
    return this.http.get<ProductDTO[]>(`${this.apidata}/category/${id}`).pipe(
      map((res) => {
        return res.map(dto => this.mapProductDTOToProduct(dto));
      }),
      catchError((err: any) => {
        console.error('Error fetching products by category:', err);
        alert(err.message || 'Failed to load products');
        return [];
      })
    );
  }

  /**
   * Advanced product query with pagination, sorting, filtering
   * Perfect for product listing pages with filters
   */
  getProductsAdvanced(query: ProductQuery): Observable<PaginatedResponse<product>> {
    let params = new HttpParams();
    
    if (query.page) params = params.set('page', query.page.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    if (query.search) params = params.set('search', query.search);
    if (query.categoryId) params = params.set('categoryId', query.categoryId.toString());
    if (query.branchId) params = params.set('branchId', query.branchId.toString());
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.minPrice) params = params.set('minPrice', query.minPrice.toString());
    if (query.maxPrice) params = params.set('maxPrice', query.maxPrice.toString());
    if (query.isPrescriptionRequired !== undefined) {
      params = params.set('isPrescriptionRequired', query.isPrescriptionRequired.toString());
    }
    if (query.isActive !== undefined) {
      params = params.set('isActive', query.isActive.toString());
    }
    if (query.inStock !== undefined) {
      params = params.set('inStock', query.inStock.toString());
    }

    return this.http.get<PaginatedResponse<ProductDTO>>(`${this.apidata}/query`, { params }).pipe(
      map((response) => {
        return {
          ...response,
          items: response.items.map(dto => this.mapProductDTOToProduct(dto))
        };
      }),
      catchError((err: any) => {
        console.error('Error fetching products (advanced):', err);
        return of({
          currentPage: 1,
          pageSize: query.pageSize || 10,
          totalCount: 0,
          totalPages: 0,
          hasPrevious: false,
          hasNext: false,
          items: []
        } as PaginatedResponse<product>);
      })
    );
  }

  /**
   * Get products with simple pagination
   */
  getProductsPaginated(page: number = 1, pageSize: number = 10, search?: string): Observable<PaginatedResponse<product>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedResponse<ProductDTO>>(`${this.apidata}/paginated`, { params }).pipe(
      map((response) => {
        return {
          ...response,
          items: response.items.map(dto => this.mapProductDTOToProduct(dto))
        };
      }),
      catchError((err: any) => {
        console.error('Error fetching paginated products:', err);
        return of({
          currentPage: page,
          pageSize: pageSize,
          totalCount: 0,
          totalPages: 0,
          hasPrevious: false,
          hasNext: false,
          items: []
        } as PaginatedResponse<product>);
      })
    );
  }

  /**
   * Search products
   */
  searchProducts(term: string) {
    return this.http.get<ProductDTO[]>(`${this.apidata}/search`, {
      params: { term }
    }).pipe(
      map((res) => {
        return res.map(dto => this.mapProductDTOToProduct(dto));
      }),
      catchError((err: any) => {
        console.error('Error searching products:', err);
        alert(err.message || 'Failed to search products');
        return [];
      })
    );
  }

  /**
   * Get featured products
   */
  getFeaturedProducts() {
    return this.http.get<ProductDTO[]>(`${this.apidata}/featured`).pipe(
      map((res) => {
        return res.map(dto => this.mapProductDTOToProduct(dto));
      }),
      catchError((err: any) => {
        console.error('Error fetching featured products:', err);
        return [];
      })
    );
  }
}
