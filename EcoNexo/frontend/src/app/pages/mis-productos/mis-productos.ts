import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

interface ProductImage {
  id: number;
  path: string;
  type: string | null;
}

interface ProductCategory {
  id: number;
  name: string;
}

interface BusinessProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  price_unit: string | null;
  stock: number;
  active: boolean;
  category: ProductCategory | null;
  images: ProductImage[];
}

@Component({
  selector: 'app-mis-productos',
  standalone: true,
  imports: [CommonModule, AsyncPipe, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './mis-productos.html',
  styleUrl: './mis-productos.css',
})
export class MisProductos implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly base = environment.apiUrl;
  private readonly destroy$ = new Subject<void>();

  // Reactive state
  private readonly productsSubject = new BehaviorSubject<BusinessProduct[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(true);
  private readonly searchSubject = new BehaviorSubject<string>('');
  private readonly categorySubject = new BehaviorSubject<string>('Todas');

  readonly loading$ = this.loadingSubject.asObservable();

  readonly filteredProducts$ = combineLatest([
    this.productsSubject,
    this.searchSubject.pipe(debounceTime(200), distinctUntilChanged()),
    this.categorySubject,
  ]).pipe(
    map(([products, search, category]) =>
      products.filter(p => {
        const matchesSearch = !search ||
          p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === 'Todas' ||
          p.category?.name === category;
        return matchesSearch && matchesCategory;
      })
    )
  );

  readonly uniqueCategories$ = this.productsSubject.pipe(
    map(products => {
      const cats = products.map(p => p.category?.name).filter((c): c is string => !!c);
      return [...new Set(cats)];
    })
  );

  // Keep plain properties only for UI state that doesn't need reactivity
  errorMessage = '';
  successMessage = '';
  hasBusiness = true;

  get searchQuery(): string { return this.searchSubject.value; }
  set searchQuery(v: string) { this.searchSubject.next(v); }

  get categoryFilter(): string { return this.categorySubject.value; }
  set categoryFilter(v: string) { this.categorySubject.next(v); }

  // Modal state
  modalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  editingProductId: number | null = null;
  modalSaving = false;
  modalError = '';

  // Image
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  readonly categoryOptions = [
    'Verduras',
    'Frutas',
    'Aceites',
    'Dulces',
    'Panadería',
    'Lácteos',
    'Carnes',
    'Bebidas',
    'Conservas',
    'Otros',
  ];

  readonly form = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.maxLength(1000)]],
    price:       [0.00, [Validators.required, Validators.min(0)]],
    price_unit:  ['unidad', [Validators.maxLength(50)]],
    stock:       [0, [Validators.required, Validators.min(0)]],
    category:    ['', [Validators.required]],
    active:      [true],
  });

  ngOnInit(): void {
    this.loadProducts();

    // Reload products on same-route navigation (e.g. sidebar link click)
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      filter((e: any) => e.urlAfterRedirects === '/mis-productos'),
      takeUntil(this.destroy$)
    ).subscribe(() => this.loadProducts());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get userName(): string {
    const u = this.auth.getUser();
    return u?.business_name || u?.name || 'Mi Tienda';
  }

  productImage(images: ProductImage[]): string {
    return images?.[0]?.path ?? '';
  }

  getStatusLabel(p: BusinessProduct): string {
    if (!p.active) return 'Inactivo';
    if (p.stock === 0) return 'Sin Stock';
    if (p.stock <= 5) return 'Stock Bajo';
    return 'Activo';
  }

  getStatusClass(p: BusinessProduct): string {
    if (!p.active) return 'status-inactive';
    if (p.stock === 0) return 'status-no-stock';
    if (p.stock <= 5) return 'status-low';
    return 'status-active';
  }

  loadProducts(): void {
    this.loadingSubject.next(true);
    this.errorMessage = '';
    this.http.get<{ products: BusinessProduct[] }>(`${this.base}/mis-productos`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.productsSubject.next(res.products);
          this.loadingSubject.next(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          if (err.status === 404) {
            this.hasBusiness = false;
            this.errorMessage = 'Necesitas crear un negocio antes de poder agregar productos.';
          } else {
            this.errorMessage = 'Error al cargar los productos.';
          }
          this.loadingSubject.next(false);
          this.cdr.markForCheck();
        },
      });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingProductId = null;
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.modalError = '';
    this.form.reset({
      name: '',
      description: '',
      price: 0.00,
      price_unit: 'unidad',
      stock: 0,
      category: '',
      active: true,
    });
    this.modalOpen = true;
  }

  openEditModal(product: BusinessProduct): void {
    this.modalMode = 'edit';
    this.editingProductId = product.id;
    this.selectedImageFile = null;
    this.imagePreview = this.productImage(product.images) || null;
    this.modalError = '';
    this.form.patchValue({
      name:        product.name,
      description: product.description ?? '',
      price:       product.price,
      price_unit:  product.price_unit ?? 'unidad',
      stock:       product.stock,
      category:    product.category?.name ?? '',
      active:      product.active,
    });
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSaveProduct(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.modalSaving = true;
    this.modalError = '';

    const formData = new FormData();
    const v = this.form.value;
    formData.append('name', v.name ?? '');
    formData.append('description', v.description ?? '');
    formData.append('price', String(v.price ?? 0));
    formData.append('price_unit', v.price_unit ?? 'unidad');
    formData.append('stock', String(v.stock ?? 0));
    formData.append('category', v.category ?? '');
    formData.append('active', (v.active ?? true) ? '1' : '0');

    if (this.selectedImageFile) {
      formData.append('image', this.selectedImageFile);
    }

    const url = this.modalMode === 'create'
      ? `${this.base}/mis-productos`
      : `${this.base}/mis-productos/${this.editingProductId}`;

    this.http.post<{ message: string; product: BusinessProduct }>(url, formData).subscribe({
      next: (res) => {
        this.modalSaving = false;
        this.modalOpen = false;
        this.successMessage = res.message;
        // Update observable immediately without full reload
        const current = this.productsSubject.value;
        if (this.modalMode === 'create') {
          this.productsSubject.next([res.product, ...current]);
        } else {
          this.productsSubject.next(current.map(p => p.id === res.product.id ? res.product : p));
        }
        this.cdr.markForCheck();
        setTimeout(() => { this.successMessage = ''; this.cdr.markForCheck(); }, 4000);
      },
      error: (err) => {
        this.modalSaving = false;
        if (err.error?.errors) {
          const msgs = Object.values(err.error.errors).flat().join(' ');
          this.modalError = msgs;
        } else {
          this.modalError = err.error?.message ?? 'Error al guardar el producto.';
        }
      },
    });
  }

  onToggleActive(product: BusinessProduct): void {
    this.http.patch<{ message: string; product: BusinessProduct }>(
      `${this.base}/mis-productos/${product.id}/toggle-active`, {}
    ).subscribe({
      next: (res) => {
        this.productsSubject.next(
          this.productsSubject.value.map(p => p.id === res.product.id ? res.product : p)
        );
        const action = res.product.active ? 'activado' : 'desactivado';
        this.successMessage = `Producto ${action} correctamente.`;
        this.cdr.markForCheck();
        setTimeout(() => { this.successMessage = ''; this.cdr.markForCheck(); }, 3000);
      },
      error: () => {
        this.errorMessage = 'No se pudo cambiar el estado del producto.';
        this.cdr.markForCheck();
        setTimeout(() => { this.errorMessage = ''; this.cdr.markForCheck(); }, 3000);
      },
    });
  }

  onDeleteProduct(product: BusinessProduct): void {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;

    this.http.delete<{ message: string }>(`${this.base}/mis-productos/${product.id}`).subscribe({
      next: (res) => {
        this.productsSubject.next(this.productsSubject.value.filter(p => p.id !== product.id));
        this.successMessage = res.message;
        this.cdr.markForCheck();
        setTimeout(() => { this.successMessage = ''; this.cdr.markForCheck(); }, 4000);
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar el producto.';
        this.cdr.markForCheck();
        setTimeout(() => { this.errorMessage = ''; this.cdr.markForCheck(); }, 4000);
      },
    });
  }

  onLogout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
