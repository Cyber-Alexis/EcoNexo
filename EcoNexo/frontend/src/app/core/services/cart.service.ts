import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  priceUnit: string;
  img: string;
  quantity: number;
  business: string;
}

export interface CartGroup {
  business: string;
  items: CartItem[];
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = new BehaviorSubject<CartItem[]>([]);
  private readonly _isOpen = new BehaviorSubject<boolean>(false);

  readonly items$ = this._items.asObservable();
  readonly isOpen$ = this._isOpen.asObservable();

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
    return Array.from(map.entries()).map(([business, items]) => ({ business, items }));
  }

  open(): void { this._isOpen.next(true); }
  close(): void { this._isOpen.next(false); }
  toggle(): void { this._isOpen.next(!this._isOpen.value); }

  addItem(
    product: { name: string; price: number; priceUnit: string; img: string; business: string },
    quantity = 1
  ): void {
    const current = [...this._items.value];
    const key = `${product.business}::${product.name}`;
    const idx = current.findIndex(i => i.id === key);
    if (idx >= 0) {
      current[idx] = { ...current[idx], quantity: current[idx].quantity + quantity };
    } else {
      current.push({
        id: key,
        name: product.name,
        price: product.price,
        priceUnit: product.priceUnit,
        img: product.img,
        quantity,
        business: product.business,
      });
    }
    this._items.next(current);
  }

  updateQuantity(id: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(id);
      return;
    }
    this._items.next(this._items.value.map(i => i.id === id ? { ...i, quantity } : i));
  }

  removeItem(id: string): void {
    this._items.next(this._items.value.filter(i => i.id !== id));
  }

  clear(): void {
    this._items.next([]);
  }
}
