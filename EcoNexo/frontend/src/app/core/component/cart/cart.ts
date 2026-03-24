import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService, CartItem, CartGroup } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isOpen = false;
  groupedItems: CartGroup[] = [];
  totalCount = 0;
  subtotal = 0;

  ngOnInit(): void {
    this.cartService.isOpen$.subscribe(open => (this.isOpen = open));
    this.cartService.items$.subscribe(() => {
      this.groupedItems = this.cartService.groupedItems;
      this.totalCount = this.cartService.totalCount;
      this.subtotal = this.cartService.subtotal;
    });
  }

  close(): void { this.cartService.close(); }
  increment(item: CartItem): void { this.cartService.updateQuantity(item.id, item.quantity + 1); }
  decrement(item: CartItem): void { this.cartService.updateQuantity(item.id, item.quantity - 1); }
  remove(item: CartItem): void { this.cartService.removeItem(item.id); }
  clear(): void { this.cartService.clear(); }

  checkout(): void {
    if (!this.authService.isLoggedIn()) {
      this.close();
      this.router.navigate(['/login']);
      return;
    }

    this.close();
  }
}
