import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { product, ProductDTO, PaginatedResponse } from '../types/product';

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  isPrescriptionRequired: boolean;
  isActive: boolean;
  categoryId: number;
  stock?: number;
  rank?: number;
  maxOrderQuantity?: number;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  discountPrice?: number;
  isPrescriptionRequired?: boolean;
  isActive?: boolean;
  categoryId?: number;
  stock?: number;
  rank?: number;
  maxOrderQuantity?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  timestamp: string;
}

export type BannerType = 'Main' | 'Middle';

export interface Banner {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  type: BannerType;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface CreateBannerDTO {
  title: string;
  description: string;
  link: string;
  displayOrder: number;
  type: BannerType;
  imageUrl?: string;
}

export interface UpdateBannerDTO {
  title?: string;
  description?: string;
  link?: string;
  type?: BannerType;
  displayOrder?: number;
  isActive?: boolean;
  imageUrl?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  userId: string;
  totalAmount: number;
  createdAt: string;
  shippingAddress: string;
  customerNotes: string;
  prescriptionImageUrl: string;
  paymentStatus: string;
  paymentMethod: string;
  branchName: string;
  userName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = 'http://localhost:5062/api/admin';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('userToken');
    if (!token) {
      console.warn('No authentication token found');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`
    });
  }

  // Helper to map ProductDTO to product
  private mapProductDTOToProduct(dto: ProductDTO): product {
    return {
      id: dto.id,
      name: dto.productName || '',
      imageUrl: dto.productImage || '',
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
      stock: dto.stock || [],
      quantity: dto.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0,
      isFav: false,
    };
  }

  // Get all products
  getProducts(): Observable<ApiResponse<product[]>> {
    return this.http.get<ApiResponse<ProductDTO[]>>(
      `${this.baseUrl}/AdminProducts`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        console.log('Raw API response:', response); // Debug log
        return {
          ...response,
          data: response.data?.map(dto => this.mapProductDTOToProduct(dto)) || []
        };
      }),
      catchError(error => {
        console.error('Error in getProducts:', error);
        return of({
          success: false,
          message: error.error?.message || 'Failed to load products',
          data: [],
          errors: error.error?.errors || [error.message],
          timestamp: new Date().toISOString()
        } as ApiResponse<product[]>);
      })
    );
  }

  // Get product by ID
  getProductById(id: number): Observable<ApiResponse<product>> {
    return this.http.get<ApiResponse<product>>(
      `${this.baseUrl}/AdminProducts/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Create product with image
  createProduct(productData: CreateProductDTO, image?: File): Observable<ApiResponse<product>> {
    const formData = new FormData();
    
    formData.append('name', productData.name);
    formData.append('description', productData.description);
    formData.append('price', productData.price.toString());
    if (productData.discountPrice !== undefined) {
      formData.append('discountPrice', productData.discountPrice.toString());
    }
    formData.append('isPrescriptionRequired', productData.isPrescriptionRequired.toString());
    formData.append('isActive', productData.isActive.toString());
    formData.append('categoryId', productData.categoryId.toString());
    if (productData.stock !== undefined) {
      formData.append('stock', productData.stock.toString());
    }
    if (productData.rank !== undefined) {
      formData.append('rank', productData.rank.toString());
    }
    if (productData.maxOrderQuantity !== undefined) {
      formData.append('maxOrderQuantity', productData.maxOrderQuantity.toString());
    }
    
    if (image) {
      formData.append('image', image);
    }

    return this.http.post<ApiResponse<ProductDTO>>(
      `${this.baseUrl}/AdminProducts`,
      formData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => ({
        ...response,
        data: response.data ? this.mapProductDTOToProduct(response.data) : null as any
      }))
    );
  }

  // Update product with image
  updateProduct(id: number, productData: UpdateProductDTO, image?: File): Observable<ApiResponse<product>> {
    const formData = new FormData();
    
    if (productData.name) formData.append('name', productData.name);
    if (productData.description) formData.append('description', productData.description);
    if (productData.price !== undefined) formData.append('price', productData.price.toString());
    if (productData.discountPrice !== undefined) {
      formData.append('discountPrice', productData.discountPrice.toString());
    }
    if (productData.isPrescriptionRequired !== undefined) {
      formData.append('isPrescriptionRequired', productData.isPrescriptionRequired.toString());
    }
    if (productData.isActive !== undefined) {
      formData.append('isActive', productData.isActive.toString());
    }
    if (productData.categoryId !== undefined) {
      formData.append('categoryId', productData.categoryId.toString());
    }
    if (productData.stock !== undefined) {
      formData.append('stock', productData.stock.toString());
    }
    if (productData.rank !== undefined) {
      formData.append('rank', productData.rank.toString());
    }
    if (productData.maxOrderQuantity !== undefined) {
      formData.append('maxOrderQuantity', productData.maxOrderQuantity.toString());
    }
    
    if (image) {
      formData.append('image', image);
    }

    return this.http.put<ApiResponse<ProductDTO>>(
      `${this.baseUrl}/AdminProducts/${id}`,
      formData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => ({
        ...response,
        data: response.data ? this.mapProductDTOToProduct(response.data) : null as any
      }))
    );
  }

  // Delete product
  deleteProduct(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(
      `${this.baseUrl}/AdminProducts/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Get paginated products
  getProductsPaginated(page: number = 1, pageSize: number = 10, search?: string): Observable<ApiResponse<PaginatedResponse<product>>> {
    let url = `${this.baseUrl}/AdminProducts/paginated?page=${page}&pageSize=${pageSize}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get<ApiResponse<PaginatedResponse<ProductDTO>>>(url, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        if (response && response.data) {
          return {
            ...response,
            data: {
              ...response.data,
              items: response.data.items?.map(dto => this.mapProductDTOToProduct(dto)) || []
            }
          };
        }
        return {
          ...response,
          data: {
            currentPage: 1,
            pageSize: pageSize,
            totalCount: 0,
            totalPages: 0,
            hasPrevious: false,
            hasNext: false,
            items: []
          }
        };
      }),
      catchError(error => {
        console.error('Error in getProductsPaginated:', error);
        return of({
          success: false,
          message: error.error?.message || 'Failed to load products',
          data: {
            currentPage: 1,
            pageSize: pageSize,
            totalCount: 0,
            totalPages: 0,
            hasPrevious: false,
            hasNext: false,
            items: []
          },
          errors: error.error?.errors || [error.message],
          timestamp: new Date().toISOString()
        } as ApiResponse<PaginatedResponse<product>>);
      })
    );
  }

  // Toggle featured status
  toggleFeaturedStatus(id: number): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(
      `${this.baseUrl}/AdminProducts/${id}/toggle-featured`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // Get product stats
  getProductStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/AdminProducts/stats`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ========== BANNER METHODS ==========
  
  // Get all banners
  getBanners(): Observable<ApiResponse<Banner[]>> {
    return this.http.get<Banner[]>(
      `${this.baseUrl}/AdminBanners`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(banners => ({
        success: true,
        message: 'Banners retrieved successfully',
        data: banners,
        timestamp: new Date().toISOString()
      })),
      catchError(error => {
        console.error('Error in getBanners:', error);
        return of({
          success: false,
          message: error.error?.message || 'Failed to load banners',
          data: [],
          errors: error.error?.errors || [error.message],
          timestamp: new Date().toISOString()
        } as ApiResponse<Banner[]>);
      })
    );
  }

  // Get banner by ID
  getBannerById(id: number): Observable<ApiResponse<Banner>> {
    return this.http.get<Banner>(
      `${this.baseUrl}/AdminBanners/${id}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(banner => ({
        success: true,
        message: 'Banner retrieved successfully',
        data: banner,
        timestamp: new Date().toISOString()
      })),
      catchError(error => {
        console.error('Error in getBannerById:', error);
        return of({
          success: false,
          message: error.error?.message || 'Failed to load banner',
          data: null as any,
          errors: error.error?.errors || [error.message],
          timestamp: new Date().toISOString()
        } as ApiResponse<Banner>);
      })
    );
  }

  // Create banner with image
  createBanner(bannerData: CreateBannerDTO, image?: File): Observable<ApiResponse<Banner>> {
    const formData = new FormData();
    
    formData.append('title', bannerData.title);
    formData.append('description', bannerData.description || '');
    formData.append('link', bannerData.link || '');
    formData.append('displayOrder', bannerData.displayOrder.toString());
    // Send type as enum integer value: 'Main' = 0, 'Middle' = 1
    // ASP.NET Core binds enums from FormData better as integers
    const typeValue = bannerData.type === 'Main' ? '0' : '1';
    formData.append('type', typeValue);
    // Don't append imageUrl when creating - it will be set by the backend from the uploaded file
    // Only append if it's explicitly provided (for edge cases)
    if (bannerData.imageUrl && !image) {
      formData.append('imageUrl', bannerData.imageUrl);
    }
    
    if (image) {
      formData.append('image', image, image.name);
    }

    // Debug: Log what we're sending
    console.log('Creating banner with data:', {
      title: bannerData.title,
      description: bannerData.description,
      link: bannerData.link,
      displayOrder: bannerData.displayOrder,
      type: bannerData.type,
      typeValue: typeValue,
      hasImage: !!image,
      imageName: image?.name
    });

    // Don't set Content-Type header - let browser set it with boundary for FormData
    const headers = this.getAuthHeaders();

    return this.http.post<Banner>(
      `${this.baseUrl}/AdminBanners`,
      formData,
      { 
        headers: headers
      }
    ).pipe(
      map(banner => ({
        success: true,
        message: 'Banner created successfully',
        data: banner,
        timestamp: new Date().toISOString()
      })),
      catchError(error => {
        console.error('Error in createBanner:', error);
        return of({
          success: false,
          message: error.error?.message || 'Failed to create banner',
          data: null as any,
          errors: error.error?.errors || [error.message],
          timestamp: new Date().toISOString()
        } as ApiResponse<Banner>);
      })
    );
  }

  // Update banner with image
  updateBanner(id: number, bannerData: UpdateBannerDTO, image?: File): Observable<ApiResponse<Banner>> {
    console.log('Updating banner:', id, bannerData, image ? 'with image' : 'without image');
    
    const formData = new FormData();
    
    // Always send these fields
    formData.append('title', bannerData.title || '');
    formData.append('description', bannerData.description || '');
    formData.append('link', bannerData.link || '');
    
    // Send type as enum integer value: 'Main' = 0, 'Middle' = 1
    if (bannerData.type) {
      const typeValue = bannerData.type === 'Main' ? '0' : '1';
      formData.append('type', typeValue);
    }
    
    if (bannerData.displayOrder !== undefined) {
      formData.append('displayOrder', bannerData.displayOrder.toString());
    }
    if (bannerData.isActive !== undefined) {
      formData.append('isActive', bannerData.isActive.toString());
    }
    
    // Only append image if a new one is provided
    if (image) {
      formData.append('image', image, image.name);
      console.log('Adding image to FormData:', image.name);
    }

    // Don't set Content-Type header - let browser set it with boundary for FormData
    const headers = this.getAuthHeaders();
    
    return this.http.put<Banner>(
      `${this.baseUrl}/AdminBanners/${id}`,
      formData,
      { 
        headers: headers
      }
    ).pipe(
      map(banner => {
        console.log('Banner updated successfully:', banner);
        return {
          success: true,
          message: 'Banner updated successfully',
          data: banner,
          timestamp: new Date().toISOString()
        };
      }),
      catchError(error => {
        console.error('Error in updateBanner:', error);
        console.error('Error status:', error.status);
        console.error('Error body:', error.error);
        return of({
          success: false,
          message: error.error?.message || error.message || 'Failed to update banner',
          data: null as any,
          errors: error.error?.errors || [error.message],
          timestamp: new Date().toISOString()
        } as ApiResponse<Banner>);
      })
    );
  }

  // Delete banner
  deleteBanner(id: number): Observable<ApiResponse<boolean>> {
    // Ensure ID is a number
    const bannerId = Number(id);
    if (isNaN(bannerId)) {
      console.error('Invalid banner ID:', id);
      return of({
        success: false,
        message: 'Invalid banner ID',
        data: false,
        timestamp: new Date().toISOString()
      } as ApiResponse<boolean>);
    }
    
    console.log('Deleting banner with ID:', bannerId);
    
    return this.http.delete<any>(
      `${this.baseUrl}/AdminBanners/${bannerId}`,
      { 
        headers: this.getAuthHeaders(),
        observe: 'response'
      }
    ).pipe(
      map((response) => {
        console.log('Delete response status:', response.status);
        console.log('Delete response body:', response.body);
        
        // Any 2xx status code means success
        if (response.status >= 200 && response.status < 300) {
          const message = response.body?.message || 'Banner deleted successfully';
          return {
            success: true,
            message: message,
            data: true,
            timestamp: new Date().toISOString()
          } as ApiResponse<boolean>;
        }
        throw new Error(`Unexpected status code: ${response.status}`);
      }),
      catchError(error => {
        console.error('Error in deleteBanner:', error);
        console.error('Error status:', error.status);
        console.error('Error body:', error.error);
        console.error('Full error:', JSON.stringify(error, null, 2));
        return of({
          success: false,
          message: error.error?.message || error.message || 'Failed to delete banner',
          data: false,
          errors: error.error?.errors || [error.message],
          timestamp: new Date().toISOString()
        } as ApiResponse<boolean>);
      })
    );
  }

  // ========== ORDER METHODS ==========
  
  // Get all orders
  getOrders(): Observable<ApiResponse<Order[]>> {
    console.log('Fetching orders from:', `${this.baseUrl}/AdminOrders`);
    console.log('Auth headers:', this.getAuthHeaders());
    
    return this.http.get<Order[]>(
      `${this.baseUrl}/AdminOrders`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(orders => {
        console.log('Raw orders response from backend:', orders);
        console.log('Orders type:', typeof orders);
        console.log('Is array:', Array.isArray(orders));
        console.log('Orders length:', Array.isArray(orders) ? orders.length : 'Not an array');
        
        const response = {
          success: true,
          message: 'Orders retrieved successfully',
          data: Array.isArray(orders) ? orders : [],
          timestamp: new Date().toISOString()
        };
        
        console.log('Mapped response:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error in getOrders:', error);
        console.error('Error status:', error.status);
        console.error('Error body:', error.error);
        return of({
          success: false,
          message: error.error?.message || 'Failed to load orders',
          data: [],
          errors: error.error?.errors || [error.message],
          timestamp: new Date().toISOString()
        } as ApiResponse<Order[]>);
      })
    );
  }

  // Get order by ID
  getOrderById(id: number): Observable<ApiResponse<Order>> {
    return this.http.get<Order>(
      `${this.baseUrl}/AdminOrders/${id}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(order => ({
        success: true,
        message: 'Order retrieved successfully',
        data: order,
        timestamp: new Date().toISOString()
      })),
      catchError(error => {
        console.error('Error in getOrderById:', error);
        return of({
          success: false,
          message: error.error?.message || 'Failed to load order',
          data: null as any,
          errors: error.error?.errors || [error.message],
          timestamp: new Date().toISOString()
        } as ApiResponse<Order>);
      })
    );
  }

  // Cancel order
  cancelOrder(id: number): Observable<ApiResponse<boolean>> {
    return this.http.put<{ message: string }>(
      `${this.baseUrl}/AdminOrders/${id}/cancel`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(() => ({
        success: true,
        message: 'Order cancelled successfully',
        data: true,
        timestamp: new Date().toISOString()
      })),
      catchError(error => {
        console.error('Error in cancelOrder:', error);
        return of({
          success: false,
          message: error.error?.message || 'Failed to cancel order',
          data: false,
          errors: error.error?.errors || [error.message],
          timestamp: new Date().toISOString()
        } as ApiResponse<boolean>);
      })
    );
  }
}
