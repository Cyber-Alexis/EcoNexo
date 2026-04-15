import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, catchError, debounceTime, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CartItem {
  id: string;
  productId: number;
  businessId: number;
  name: string;
  price: number;
  priceUnit: string;
  img: string;
  quantity: number;
  business: string;
  openingHours?: string;
}

export interface CartGroup {
  business: string;
  businessId: number;
  openingHours?: string;
  items: CartItem[];
}

interface CartSyncPayload {
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly STORAGE_KEY = 'econexo_cart_items';
  private readonly REMOTE_SYNC_DEBOUNCE_MS = 150;
  private readonly _items = new BehaviorSubject<CartItem[]>([]);
  private readonly _isOpen = new BehaviorSubject<boolean>(false);
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;
  private readonly syncRequests = new Subject<CartItem[]>();

  readonly items$ = this._items.asObservable();
  readonly isOpen$ = this._isOpen.asObservable();

  constructor() {
    this.syncRequests
      .pipe(
        debounceTime(this.REMOTE_SYNC_DEBOUNCE_MS),
        switchMap((items) => {
          if (!this.hasToken()) return of(null);
          return items.length > 0 ? this.syncRemoteCart(items) : this.clearRemoteCart();
        }),
      )
      .subscribe();

    const restoredItems = this.restoreItemsFromStorage();
    this._items.next(restoredItems);
    this.hydrateCart();
  }

  get totalCount(): number {
    return this._items.value.reduce((sum, i) => sum + i.quantity, 0);
  }

  get subtotal(): number {
    return this._items.value.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  get groupedItems(): CartGroup[] {
    const map = new Map<string, CartItem[]>();
    for (const item of this._items.value) {
      if (!map.has(item.business)) map.set(item.business, []);
      map.get(item.business)!.push(item);
    }
    return Array.from(map.entries()).map(([business, items]) => ({
      business,
      businessId: items[0]?.businessId ?? 0,
      openingHours: items.find((item) => item.openingHours?.trim())?.openingHours,
      items,
    }));
  }

  hydrateCart(): void {
    const restoredItems = this.restoreItemsFromStorage();
    if (restoredItems.length > 0) {
      this._items.next(this.normalizeItems(restoredItems));
    }

    if (!this.hasToken()) {
      return;
    }

    if (restoredItems.length > 0) {
      this.syncRemoteCart(restoredItems).subscribe();
      return;
    }

    this.fetchRemoteCart().subscribe();
  }

  refreshFromServer(): void {
    if (this.hasToken()) {
      this.fetchRemoteCart().subscribe();
      return;
    }

    this.setItems(this.restoreItemsFromStorage(), false);
  }

  open(): void { this._isOpen.next(true); }
  close(): void { this._isOpen.next(false); }
  toggle(): void { this._isOpen.next(!this._isOpen.value); }

  addItem(
    product: { productId: number; businessId: number; name: string; price: number; priceUnit: string; img: string; business: string; openingHours?: string },
    quantity = 1
  ): void {
    if (quantity <= 0) return;

    const current = [...this._items.value];
    const key = this.buildItemId(product.businessId, product.productId);
    const idx = current.findIndex(
      (item) => item.id === key || (item.productId === product.productId && item.businessId === product.businessId),
    );

    if (idx >= 0) {
      current[idx] = {
        ...current[idx],
        id: key,
        quantity: current[idx].quantity + quantity,
        openingHours: current[idx].openingHours ?? product.openingHours,
      };
    } else {
      current.push({
        id: key,
        productId: product.productId,
        businessId: product.businessId,
        name: product.name,
        price: product.price,
        priceUnit: product.priceUnit,
        img: product.img,
        quantity,
        business: product.business,
        openingHours: product.openingHours,
      });
    }

    this.setItems(current);
  }

  updateQuantity(id: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(id);
      return;
    }

    this.setItems(this._items.value.map((item) => item.id === id ? { ...item, quantity } : item));
  }

  removeItem(id: string): void {
    this.setItems(this._items.value.filter((item) => item.id !== id));
  }

  clear(): void {
    this.setItems([]);
  }

  /** Clears the cart locally only — no remote DELETE is sent. Use during logout. */
  clearLocally(): void {
    this.setItems([], false);
  }

  private setItems(items: CartItem[], persistRemote = true): void {
    const normalized = this.normalizeItems(items);
    this._items.next(normalized);
    this.storeItemsInStorage(normalized);

    if (!persistRemote || !this.hasToken()) {
      return;
    }

    this.enqueueRemoteRequest(normalized);
  }

  private fetchRemoteCart() {
    return this.http.get<CartItem[]>(`${this.base}/cart`).pipe(
      tap((items) => this.setItems(items, false)),
      catchError((error) => {
        console.error('No se pudo recuperar el carrito desde el servidor', error);
        return of(this._items.value);
      }),
    );
  }

  private enqueueRemoteRequest(items: CartItem[]): void {
    this.syncRequests.next(items);
  }

  private syncRemoteCart(items: CartItem[]) {
    const payload: CartSyncPayload = {
      items: items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
    };

    return this.http.put<CartItem[]>(`${this.base}/cart`, payload).pipe(
      tap((serverItems) => this.setItems(serverItems, false)),
      catchError((error) => {
        console.error('No se pudo sincronizar el carrito con el servidor', error);
        return of(this._items.value);
      }),
    );
  }

  private clearRemoteCart() {
    return this.http.delete<{ message: string }>(`${this.base}/cart`).pipe(
      catchError((error) => {
        console.error('No se pudo vaciar el carrito en el servidor', error);
        return of({ message: 'No se pudo vaciar el carrito en el servidor.' });
      }),
    );
  }

  private restoreItemsFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as CartItem[];
      return this.normalizeItems(parsed);
    } catch {
      return [];
    }
  }

  private storeItemsInStorage(items: CartItem[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }

  private normalizeItems(items: CartItem[]): CartItem[] {
    return items
      .filter((item) => !!item?.productId && !!item?.businessId && (item.quantity ?? 0) > 0)
      .map((item) => ({
        id: this.buildItemId(item.businessId, item.productId),
        productId: Number(item.productId),
        businessId: Number(item.businessId),
        name: item.name,
        price: Number(item.price),
        priceUnit: item.priceUnit ?? 'unidad',
        img: item.img,
        quantity: Number(item.quantity),
        business: item.business,
        openingHours: item.openingHours,
      }));
  }

  private buildItemId(businessId: number, productId: number): string {
    return `${businessId}::${productId}`;
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }
}
