import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { ProductService, ApiProductWithBusiness, PaginatedResponse } from '../../core/services/product.service';

@Component({
  selector: 'app-productos',
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit, OnDestroy {
  searchQuery = '';
  selectedFilter = 'Todas';
  selectedSort = 'name-asc';
  
  // All products cache (loaded once)
  allProducts: ApiProductWithBusiness[] = [];
  
  // Displayed products (current page)
  products: ApiProductWithBusiness[] = [];
  filteredProducts: ApiProductWithBusiness[] = [];
  productQty = new Map<number, number>();
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  perPage = 12;
  totalProducts = 0;
  loading = false;
  
  // Categories from API
  availableCategories: string[] = ['Todas'];

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load categories first
    this.loadCategories();
    
    // Initial load - get ALL products at once for better UX
    this.loadAllProducts();
    
    // Polling disabled by default for better pagination stability
    // If you need real-time updates, set POLLING_INTERVAL to 30000 (30 seconds)
  }
  
  ngOnDestroy(): void {
    // Clean up if needed
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (response) => {
        this.availableCategories = ['Todas', ...response.categories];
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadAllProducts(): void {
    this.loading = true;
    
    // Load ALL products in a single request (no pagination on backend)
    this.productService.getAll({ per_page: 1000 }).subscribe({
      next: (response: PaginatedResponse<ApiProductWithBusiness>) => {
        this.allProducts = response.data;
        
        // Initialize quantities for all products
        this.allProducts.forEach(p => {
          if (!this.productQty.has(p.id)) {
            this.productQty.set(p.id, 1);
          }
        });
        
        // Apply filters and show first page
        this.applyFiltersAndPagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

  private applyFiltersAndPagination(): void {
    let filtered = [...this.allProducts];

    // Filter by category
    if (this.selectedFilter !== 'Todas') {
      filtered = filtered.filter(p => p.category?.name === this.selectedFilter);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description ?? '').toLowerCase().includes(query) ||
        p.business?.name.toLowerCase().includes(query) ||
        p.category?.name.toLowerCase().includes(query)
      );
    }

    // Sort
    const [sortBy, sortOrder] = this.parseSortValue(this.selectedSort);
    filtered.sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'price') {
        compareValue = Number(a.price) - Number(b.price);
      } else {
        compareValue = a.name.localeCompare(b.name, 'es');
      }
      return sortOrder === 'desc' ? -compareValue : compareValue;
    });

    // Calculate pagination
    this.totalProducts = filtered.length;
    this.totalPages = Math.ceil(this.totalProducts / this.perPage);
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    // Get products for current page
    const startIndex = (this.currentPage - 1) * this.perPage;
    const endIndex = startIndex + this.perPage;
    this.products = filtered.slice(startIndex, endIndex);
    this.filteredProducts = this.products;
    
    // Force Angular to detect changes and update the view
    this.cdr.detectChanges();
  }

  loadProducts(): void {
    // Legacy method - now just applies filters locally
    this.applyFiltersAndPagination();
  }

  parseSortValue(value: string): ['name' | 'price', 'asc' | 'desc'] {
    if (value === 'price-asc') return ['price', 'asc'];
    if (value === 'price-desc') return ['price', 'desc'];
    return ['name', 'asc'];
  }

  filterByCategory(category: string): void {
    this.selectedFilter = category;
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.applyFiltersAndPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get paginationPages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const delta = 2;
    const left = Math.max(2, this.currentPage - delta);
    const right = Math.min(this.totalPages - 1, this.currentPage + delta);

    pages.push(1);

    if (left > 2) pages.push('...');

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < this.totalPages - 1) pages.push('...');

    if (this.totalPages > 1) pages.push(this.totalPages);

    return pages;
  }

  addToCart(product: ApiProductWithBusiness): void {
    const qty = this.getQty(product.id);
    this.cartService.addItem({
      productId: product.id,
      businessId: product.business.id,
      name: product.name,
      price: Number(product.price),
      priceUnit: this.getDisplayPriceUnit(product),
      img: this.getProductImage(product),
      business: product.business.name,
      openingHours: product.business.opening_hours ?? undefined,
    }, qty);
    this.productQty.set(product.id, 1);
    this.cartService.open();
  }

  getProductImage(product: ApiProductWithBusiness): string {
    return product.images?.[0]?.path ?? 'https://placehold.co/300x300?text=Sin+imagen';
  }

  getDisplayPriceUnit(product: { price_unit?: string | null; category?: { name: string } | null }): string {
    const directUnit = product.price_unit?.trim();
    if (directUnit) {
      return directUnit;
    }

    const categoryName = product.category?.name?.trim().toLowerCase() ?? '';

    if (['frutas', 'verdures', 'fruits secs', 'vedella', 'porc', 'aus'].includes(categoryName)) {
      return 'kg';
    }

    if (['vins negres', 'vins blancs', 'caves i escumosos'].includes(categoryName)) {
      return 'botella';
    }

    if (categoryName === 'rams i bouquets') {
      return 'ramo';
    }

    return 'unidad';
  }

  getQty(id: number): number {
    return this.productQty.get(id) ?? 1;
  }

  incrementQty(id: number): void {
    this.productQty.set(id, this.getQty(id) + 1);
  }

  decrementQty(id: number): void {
    const current = this.getQty(id);
    if (current > 1) this.productQty.set(id, current - 1);
  }

  get categories(): string[] {
    return this.availableCategories;
  }
}
