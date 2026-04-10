import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService, CartGroup } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { PasoDatos, ContactData } from '../paso-datos/paso-datos';
import { PasoEntrega, DeliveryData } from '../paso-entrega/paso-entrega';
import { PasoPago, PaymentData } from '../paso-pago/paso-pago';
import { Confirmacion, ConfirmedOrder } from '../confirmacion/confirmacion';
import { Subscription, concatMap, from, toArray } from 'rxjs';

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
export class Checkout implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private cartSubscription?: Subscription;

  readonly homeDeliveryFee = 3.5;

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
    this.cartService.refreshFromServer();
    this.cartSubscription = this.cartService.items$.subscribe(() => {
      this.cartGroups = this.cartService.groupedItems;
      this.triggerUiUpdate();
    });
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
  }

  get subtotal(): number {
    return this.cartService.subtotal;
  }

  get deliveryFee(): number {
    return this.state.delivery?.method === 'delivery' ? this.homeDeliveryFee : 0;
  }

  get total(): number {
    return this.subtotal + this.deliveryFee;
  }

  onDatosNext(data: ContactData): void {
    this.state.contact = data;
    this.step = 2;
    this.triggerUiUpdate();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onEntregaBack(): void {
    this.step = 1;
    this.triggerUiUpdate();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDeliveryChange(data: DeliveryData): void {
    queueMicrotask(() => {
      this.state.delivery = data;
      this.triggerUiUpdate();
    });
  }

  onEntregaNext(data: DeliveryData): void {
    this.state.delivery = data;
    this.step = 3;
    this.triggerUiUpdate();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPagoBack(): void {
    this.step = 2;
    this.triggerUiUpdate();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPagoConfirm(data: PaymentData): void {
    if (this.submitting) return;

    if (!this.authService.isLoggedIn()) {
      this.submitError = 'Tu sesión ha caducado. Inicia sesión de nuevo para finalizar el pedido.';
      this.triggerUiUpdate();
      return;
    }

    if (!this.state.delivery) {
      this.submitError = 'Completa primero los datos de entrega.';
      this.triggerUiUpdate();
      return;
    }

    if (this.cartGroups.length === 0) {
      this.submitError = 'Tu carrito está vacío.';
      this.triggerUiUpdate();
      return;
    }

    this.state.payment = data;
    this.submitting = true;
    this.submitError = '';
    this.triggerUiUpdate();

    const delivery = this.state.delivery;
    const notes = this.buildOrderNotes();

    from(this.cartGroups)
      .pipe(
        concatMap((group) =>
          this.orderService.createOrder({
            business_id: group.businessId,
            payment_method: 'card',
            delivery_method: delivery.method,
            notes,
            items: group.items.map((i) => ({
              product_id: i.productId,
              quantity: i.quantity,
              unit_price: i.price,
            })),
          }),
        ),
        toArray(),
      )
      .subscribe({
        next: (responses) => {
          this.state.confirmedOrders = responses.map((r) => ({
            business: r.business_name,
            code: r.code,
            total: r.total_price,
          }));
          this.cartService.clear();
          this.cartService.close();
          this.cartGroups = [];
          this.submitting = false;

          requestAnimationFrame(() => {
            this.step = 4;
            this.triggerUiUpdate();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        },
        error: (error) => {
          console.error('Error al procesar el pedido', error);
          this.submitting = false;
          this.submitError = error?.status === 401
            ? 'Tu sesión ha caducado o no es válida. Vuelve a iniciar sesión para finalizar el pedido.'
            : 'No se pudo procesar el pedido. Inténtalo de nuevo.';
          this.triggerUiUpdate();
        },
      });
  }

  groupSubtotal(group: CartGroup): string {
    return group.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
  }

  private buildOrderNotes(): string | undefined {
    const notes: string[] = [];
    const contactNotes = this.state.contact?.notes?.trim();

    if (contactNotes) {
      notes.push(contactNotes);
    }

    if (this.state.delivery?.date) {
      const deliveryLabel = this.state.delivery.method === 'delivery' ? 'Entrega' : 'Recogida';
      notes.push(`${deliveryLabel}: ${this.formatDeliveryDate(this.state.delivery.date)}`);
    }

    if (this.state.delivery?.method === 'delivery') {
      const addressParts = [
        this.state.delivery.address,
        this.state.delivery.city,
        this.state.delivery.postalCode,
      ].filter((part): part is string => !!part);

      if (addressParts.length > 0) {
        notes.push(`Dirección: ${addressParts.join(', ')}`);
      }
    }

    return notes.length > 0 ? notes.join(' | ') : undefined;
  }

  private formatDeliveryDate(dateValue: string): string {
    const [year, month, day] = dateValue.split('-').map(Number);
    if (!year || !month || !day) {
      return dateValue;
    }

    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(year, month - 1, day));
  }

  private triggerUiUpdate(): void {
    queueMicrotask(() => {
      this.cdr.markForCheck();
      requestAnimationFrame(() => this.cdr.detectChanges());
    });
  }
}
