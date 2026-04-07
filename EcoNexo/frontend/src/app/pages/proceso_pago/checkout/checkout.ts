import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService, CartGroup } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { PasoDatos, ContactData } from '../paso-datos/paso-datos';
import { PasoEntrega, DeliveryData } from '../paso-entrega/paso-entrega';
import { PasoPago, PaymentData } from '../paso-pago/paso-pago';
import { Confirmacion, ConfirmedOrder } from '../confirmacion/confirmacion';
import { forkJoin } from 'rxjs';

interface CheckoutState {
  contact: ContactData | null;
  delivery: DeliveryData | null;
  payment: PaymentData | null;
  confirmedOrders: ConfirmedOrder[];
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, PasoDatos, PasoEntrega, PasoPago, Confirmacion],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);

  step = 1;
  submitting = false;
  submitError = '';
  cartGroups: CartGroup[] = [];

  state: CheckoutState = {
    contact: null,
    delivery: null,
    payment: null,
    confirmedOrders: [],
  };

  ngOnInit(): void {
    this.cartGroups = this.cartService.groupedItems;
  }

  get subtotal(): number {
    return this.cartService.subtotal;
  }

  get deliveryFee(): number {
    return this.state.delivery?.method === 'delivery' ? 3.5 : 0;
  }

  get total(): number {
    return this.subtotal + this.deliveryFee;
  }

  onDatosNext(data: ContactData): void {
    this.state.contact = data;
    this.step = 2;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onEntregaBack(): void {
    this.step = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onEntregaNext(data: DeliveryData): void {
    this.state.delivery = data;
    this.step = 3;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPagoBack(): void {
    this.step = 2;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPagoConfirm(data: PaymentData): void {
    if (this.submitting) return;
    this.state.payment = data;
    this.submitting = true;
    this.submitError = '';

    const requests = this.cartGroups.map(group =>
      this.orderService.createOrder({
        business_id: group.businessId,
        payment_method: 'card',
        delivery_method: this.state.delivery?.method ?? 'pickup',
        notes: this.state.contact?.notes ?? undefined,
        items: group.items.map(i => ({
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: i.price,
        })),
      })
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        this.state.confirmedOrders = responses.map(r => ({
          business: r.business_name,
          code: r.code,
          total: r.total_price,
        }));
        this.cartService.clear();
        this.submitting = false;
        this.step = 4;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        this.submitting = false;
        this.submitError = 'No se pudo procesar el pedido. Inténtalo de nuevo.';
      },
    });
  }

  groupSubtotal(group: CartGroup): string {
    return group.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
  }
}
