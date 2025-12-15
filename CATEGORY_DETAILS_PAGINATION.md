# Category Details Page - Pagination Implementation

## ✅ Backend Support

The pagination uses the existing backend endpoint:
- **Endpoint**: `GET /api/Products/query`
- **Supports**: Pagination, sorting, filtering by category, price range
- **Location**: `ProductsController.cs` (line 63-68)
- **Response**: `PaginationResponse<ProductDTO>`

### Backend Query Parameters:
- `page`: Current page number (default: 1)
- `pageSize`: Items per page (default: 21)
- `categoryId`: Filter by category
- `minPrice` / `maxPrice`: Price range filtering
- `sortBy`: Sorting option (name, price, priceDesc, date, dateDesc)
- `isActive`: Filter active products (default: true)

## 🔄 Hybrid Pagination Approach

### Backend Pagination (Default)
Used when:
- No tag filter selected
- No brand filter selected
- Price filtering, sorting, and category filtering handled by backend

**Benefits:**
- Faster performance for large datasets
- Reduced data transfer
- Server-side sorting and filtering

### Client-Side Pagination (Fallback)
Used when:
- Tag filter is selected
- Brand filter is selected
- Backend doesn't support these filters

**How it works:**
1. Fetches all products for the category once
2. Caches them in `allProductsCache`
3. Applies tag/brand filters client-side
4. Applies pagination to filtered results

## 📊 Pagination State

```typescript
currentPage: signal<number>(1)        // Current page (1-indexed)
pageSize: signal<number>(21)          // Products per page (3 rows × 7 columns)
totalCount: signal<number>(0)         // Total products matching filters
totalPages: signal<number>(0)         // Total number of pages
hasNext: signal<boolean>(false)       // Can go to next page
hasPrevious: signal<boolean>(false)   // Can go to previous page
```

## 🎨 UI Features

### Pagination Controls
- **Previous/Next buttons**: Navigate between pages
- **Page numbers**: Click to jump to specific page
- **Ellipsis**: Shows "..." when many pages (smart pagination)
- **Page info**: Displays "Page X of Y (Z items)"
- **RTL support**: Works correctly in Arabic

### Smart Page Number Display
- Shows all pages if ≤ 7 pages
- Shows first, last, and pages around current if > 7 pages
- Uses ellipsis (...) for gaps

## 🔧 Methods

### Navigation
- `goToPage(page: number)`: Navigate to specific page
- `nextPage()`: Go to next page
- `previousPage()`: Go to previous page

### Filtering (Auto-resets to page 1)
- `handleSort()`: Changes sort, resets to page 1
- `applyPriceFilter()`: Applies price filter, resets to page 1
- `resetPriceFilter()`: Removes price filter, resets to page 1
- `resetTagFilter()`: Removes tag filter, resets to page 1
- `resetBrandFilter()`: Removes brand filter, resets to page 1

## 📝 Sort Mapping

Client-side sort options mapped to backend `sortBy`:
- `newest` → `dateDesc`
- `oldest` → `date`
- `price_asc` → `price`
- `price_desc` → `priceDesc`
- `name_asc` → `name`
- `name_desc` → `nameDesc`
- `itemRank_asc` → `name` (fallback)
- `itemRank_desc` → `nameDesc` (fallback)

## 🚀 Performance Optimizations

1. **Caching**: All products cached when tag/brand filter is first used
2. **Lazy Loading**: Only fetches all products when needed for client-side filtering
3. **Backend First**: Prefers backend pagination when possible
4. **Scroll to Top**: Automatically scrolls to top when page changes

## ✅ Testing Checklist

- [x] Backend pagination works with category filter
- [x] Backend pagination works with price filter
- [x] Backend pagination works with sorting
- [x] Client-side pagination works with tag filter
- [x] Client-side pagination works with brand filter
- [x] Page navigation (next/previous/jump) works
- [x] Pagination resets when filters change
- [x] Pagination displays correctly in RTL (Arabic)
- [x] Loading states work correctly
- [x] Empty states handled

## 📋 Backend Requirements

✅ **All requirements met!**
- Endpoint exists: `/api/Products/query`
- Supports pagination parameters
- Supports category filtering
- Supports price range filtering
- Supports sorting
- Returns pagination metadata

No backend changes needed! 🎉

