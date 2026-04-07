import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartGroup } from '../../../core/services/cart.service';

export interface DeliveryData {
  method: 'pickup' | 'delivery';
}

@Component({
  selector: 'app-paso-entrega',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paso-entrega.html',
  styleUrl: './paso-entrega.css',
})
export class PasoEntrega {
  @Input() groups: CartGroup[] = [];
  @Input() deliveryFee = 3.5;
  @Input() initialMethod: 'pickup' | 'delivery' = 'pickup';
  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<DeliveryData>();

  selectedMethod: 'pickup' | 'delivery' = 'pickup';

  ngOnInit(): void {
    this.selectedMethod = this.initialMethod;
  }

  selectMethod(method: 'pickup' | 'delivery'): void {
    this.selectedMethod = method;
  }

  onContinuar(): void {
    this.next.emit({ method: this.selectedMethod });
  }
}
