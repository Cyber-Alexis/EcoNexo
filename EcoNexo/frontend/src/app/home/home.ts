import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  businesses = [
    {
      name: 'Cal Pep - Frutas y Verduras',
      category: 'Frutas y Verduras',
      badge: 'Ecológico',
      rating: 4.9,
      reviews: 171,
      desc: 'Fruta de temporada y verduras del campo de Lleida',
      location: 'Centre Històric, Lleida',
      img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
    },
    {
      name: 'Forn de la Plaça',
      category: 'Panadería',
      badge: '',
      rating: 4.9,
      reviews: 20,
      desc: 'Panadería artesanal con más de 50 años de tradición. Pan de masa madre y bollía con recetas artesanales de siempre.',
      location: 'Plaça Sant Joan, Lleida',
      img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80',
    },
    {
      name: 'Vinya del Segre',
      category: 'Vinos',
      badge: 'Ecológico',
      rating: 4.7,
      reviews: 100,
      desc: 'Bodega familiar con vino D.O. costers del segre. Visitas guiadas y catas.',
      location: 'Raimat, Lleida',
      img: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=500&q=80',
    },
    {
      name: 'Carne Artesanos Macià',
      category: 'Carnicería',
      badge: '',
      rating: 4.6,
      reviews: 56,
      desc: 'Carnicería artesana con productos de km 0. Elaborados artesanos de alta calidad.',
      location: 'Cappont, Lleida',
      img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&q=80',
    },
  ];

  products = [
    { name: 'Tomates',    price: '3€/uds', img: 'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=300&q=80' },
    { name: 'Barra de pan', price: '2€/uds', img: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=300&q=80' },
    { name: 'Limones',    price: '4€/uds', img: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300&q=80' },
    { name: 'Melon',      price: '1€/uds', img: 'https://images.unsplash.com/photo-1571575309859-32d8a5b7ee0e?w=300&q=80' },
    { name: 'Sandía',     price: '3€/uds', img: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=300&q=80' },
    { name: 'Espinacas',  price: '2€/uds', img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&q=80' },
    { name: 'Brocoli',    price: '1€/uds', img: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=300&q=80' },
    { name: 'Garbanzos',  price: '1€/uds', img: 'https://images.unsplash.com/photo-1515543904379-3d757afa55cf?w=300&q=80' },
    { name: 'Lentejas',   price: '1€/uds', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80' },
    { name: 'Pollo',      price: '1€/uds', img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&q=80' },
    { name: 'Panzeta',    price: '4€/uds', img: 'https://images.unsplash.com/photo-1588600619048-83c42f4e17a2?w=300&q=80' },
  ];
}
