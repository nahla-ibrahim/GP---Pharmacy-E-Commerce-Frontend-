// Backend API Response Format (camelCase)
export interface ProductDTO {
  id: number;
  productName: string;
  productImage: string;
  price: number;
  discountPrice?: number;
  description: string;
  isPrescriptionRequired: boolean;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
  createdAt: string;
  rank?: number;
  maxOrderQuantity?: number;
  stock: StockDTO[];
}

export interface StockDTO {
  productId: number;
  productName: string;
  branchId: number;
  branchName: string;
  quantity: number;
  minimumStockLevel: number;
  maximumStockLevel: number;
  lastRestocked: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

// Frontend Product Format (for compatibility)
export interface product {
  quantity: number;
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  isPrescriptionRequired: boolean;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
  createdAt: string;
  rank?: number;
  maxOrderQuantity?: number;
  stock: Stock[] | [];
  isFav: boolean;
}

export interface Stock {
  productId: number;
  productName: string;
  branchId: number;
  branchName: string;
  quantity: number;
  minimumStockLevel: number;
  maximumStockLevel: number;
  lastRestocked: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

// Pagination Types
export interface ProductQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number;
  branchId?: number;
  sortBy?: string; // 'name', 'nameDesc', 'price', 'priceDesc', 'date', 'dateDesc', 'rating'
  minPrice?: number;
  maxPrice?: number;
  isPrescriptionRequired?: boolean;
  isActive?: boolean;
  inStock?: boolean;
}

export interface PaginatedResponse<T> {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  items: T[];
}
