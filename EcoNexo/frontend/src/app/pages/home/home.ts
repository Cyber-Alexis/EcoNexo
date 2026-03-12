import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BusinessService } from '../../core/services/business.service';
import { ApiBusinessListItem } from '../../core/models/business.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  businesses: ApiBusinessListItem[] = [];

  products = [
    { name: 'Tomates',     price: '3€/uds', img: 'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=300&q=80' },
    { name: 'Barra de pan', price: '2€/uds', img: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=300&q=80' },
    { name: 'Limones',     price: '4€/uds', img: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300&q=80' },
    { name: 'Melon',       price: '1€/uds', img: 'https://images.unsplash.com/photo-1571575309859-32d8a5b7ee0e?w=300&q=80' },
    { name: 'Sandía',      price: '3€/uds', img: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=300&q=80' },
    { name: 'Espinacas',   price: '2€/uds', img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&q=80' },
    { name: 'Brocoli',     price: '1€/uds', img: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=300&q=80' },
    { name: 'Garbanzos',   price: '1€/uds', img: 'https://images.unsplash.com/photo-1515543904379-3d757afa55cf?w=300&q=80' },
    { name: 'Lentejas',    price: '1€/uds', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80' },
    { name: 'Pollo',       price: '1€/uds', img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&q=80' },
    { name: 'Panzeta',     price: '4€/uds', img: 'https://images.unsplash.com/photo-1588600619048-83c42f4e17a2?w=300&q=80' },
  ];

  constructor(private businessService: BusinessService) {}

  ngOnInit() {
    this.businessService.getAll().subscribe({
      next: (data) => {
        this.businesses = data.slice(0, 4);
      },
    });
  }

  businessImage(b: ApiBusinessListItem): string {
    return b.images?.[0]?.path ?? 'https://placehold.co/500x300?text=Sin+imagen';
  }
}

