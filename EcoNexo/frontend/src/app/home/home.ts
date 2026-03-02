import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Business {
  id: number;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  image: string;
  description: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  isLoggedIn = false;
  userName = '';

  categories: Category[] = [
    { id: 1, name: 'Frutas y Verduras', icon: '🥕' },
    { id: 2, name: 'Panadería', icon: '🥖' },
    { id: 3, name: 'Carnicería', icon: '🥩' },
    { id: 4, name: 'Vinos y Licores', icon: '🍇' },
    { id: 5, name: 'Floristería', icon: '🌸' },
    { id: 6, name: 'Waste Local', icon: '♻️' },
    { id: 7, name: 'Artesanos', icon: '🔨' },
    { id: 8, name: 'Arte y Diseño', icon: '🎨' },
  ];

  featuredBusinesses: Business[] = [
    {
      id: 1,
      name: 'Cal Teta - Frutas y Verduras',
      category: 'Frutas y Verduras',
      rating: 4.8,
      reviews: 324,
      image: 'assets/business-1.jpg',
      description: 'Frutas de temporada y verduras de proximidad.',
    },
    {
      id: 2,
      name: 'Forn de la Plaça',
      category: 'Panadería',
      rating: 4.9,
      reviews: 287,
      image: 'assets/business-2.jpg',
      description: 'Pan de cada día y bollería casera artesanal de la zona.',
    },
    {
      id: 3,
      name: 'Vinya del Segre',
      category: 'Vinos y Licores',
      rating: 4.7,
      reviews: 156,
      image: 'assets/business-3.jpg',
      description: 'Bodega artesanal con más de 20 años de experiencia vinícola.',
    },
    {
      id: 4,
      name: 'Carns d Alesança Macià',
      category: 'Carnicería',
      rating: 4.8,
      reviews: 198,
      image: 'assets/business-4.jpg',
      description: 'Carnes de selecta',
    },
  ];

  popularProducts: Product[] = [
    { id: 1, name: 'Tomates', price: '3.50€', image: 'assets/tomato.jpg' },
    { id: 2, name: 'Barra de pan', price: '1.20€', image: 'assets/bread.jpg' },
    { id: 3, name: 'Limones', price: '2.80€', image: 'assets/lemon.jpg' },
    { id: 4, name: 'Melón', price: '5.00€', image: 'assets/melon.jpg' },
    { id: 5, name: 'Sardis', price: '12.50€', image: 'assets/sardis.jpg' },
    { id: 6, name: 'Espinacas', price: '2.30€', image: 'assets/spinach.jpg' },
    { id: 7, name: 'Brócoli', price: '3.10€', image: 'assets/broccoli.jpg' },
    { id: 8, name: 'Garbanzos', price: '4.20€', image: 'assets/chickpeas.jpg' },
    { id: 9, name: 'Lentejas', price: '3.80€', image: 'assets/lentils.jpg' },
    { id: 10, name: 'Pollo', price: '8.50€', image: 'assets/chicken.jpg' },
    { id: 11, name: 'Panzeta', price: '6.75€', image: 'assets/panzeta.jpg' },
    { id: 12, name: 'Tus productos', price: '', image: 'assets/more-products.jpg' },
  ];

  constructor(private router: Router) {
    this.checkLogin();
  }

  ngOnInit(): void {
    this.checkLogin();
  }

  checkLogin(): void {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      this.isLoggedIn = true;
      this.userName = userData.name || userData.email;
    }
  }

  logout(): void {
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

  searchBusinesses(): void {
    // Implementar búsqueda
  }
}
