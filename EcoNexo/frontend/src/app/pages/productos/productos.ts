import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-productos',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos {
  searchQuery = '';
  selectedFilter = 'Todas';
  selectedSort = 'name-asc';
  cartItems = 0;

  readonly categoryOptions = [
    'Todas',
    'Frutas y Verduras',
    'Panadería',
    'Carnicería',
    'Vinos',
    'Floristería',
    'Artesanía',
    'Moda',
  ];

  products = [
    {
      name: 'Cava Brut Nature',
      category: 'Vinos',
      badge: '',
      price: 9.50,
      priceUnit: 'unidad',
      desc: 'Cava espumoso de excelente calidad',
      location: 'Penedès',
      img: 'https://images.unsplash.com/photo-1510812431401-41d2cab2707d?w=500&q=80',
    },
    {
      name: 'Chuleta de Ternera',
      category: 'Carnicería',
      badge: '',
      price: 22.00,
      priceUnit: 'kg',
      desc: 'Carne fresca de primera calidad',
      location: 'Local',
      img: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=500&q=80',
    },
    {
      name: 'Coca de Reçapte',
      category: 'Panadería',
      badge: '',
      price: 12.50,
      priceUnit: 'unidad',
      desc: 'Tradicional coca de recapte artesana',
      location: 'Local',
      img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80',
    },
    {
      name: 'Croissant de Mortadella',
      category: 'Panadería',
      badge: '',
      price: 3.00,
      priceUnit: 'unidad',
      desc: 'Croissants rellenos con mortadela de calidad',
      location: 'Local',
      img: 'https://images.unsplash.com/photo-1585518419759-aedc8dbd1e5a?w=500&q=80',
    },
    {
      name: 'Lechuga Ecológica',
      category: 'Frutas y Verduras',
      badge: 'Bio',
      price: 1.50,
      priceUnit: 'unidad',
      desc: 'Lechuga fresca de cultivo ecológico',
      location: 'Eco Farm',
      img: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd37e06?w=500&q=80',
    },
    {
      name: 'Manzanas Golden',
      category: 'Frutas y Verduras',
      badge: 'De Temporada',
      price: 2.80,
      priceUnit: 'kg',
      desc: 'Manzanas Golden de temporada, dulces y crujientes',
      location: 'Eco Farm',
      img: 'https://images.unsplash.com/photo-1560806887-1295c3f759a8?w=500&q=80',
    },
    {
      name: 'Tomates de Pera',
      category: 'Frutas y Verduras',
      badge: 'De Temporada',
      price: 2.80,
      priceUnit: 'kg',
      desc: 'Tomates de pera frescos y sabrosos',
      location: 'Eco Farm',
      img: 'https://images.unsplash.com/photo-1657360435199-4ca2f2a01d47?w=500&q=80',
    },
    {
      name: 'Naranjas de Valencia',
      category: 'Frutas y Verduras',
      badge: 'De Temporada',
      price: 2.20,
      priceUnit: 'kg',
      desc: 'Naranjas de Valencia, jugosas y aromáticas',
      location: 'Valencia',
      img: 'https://images.unsplash.com/photo-1582979519885-69613b4c54fd?w=500&q=80',
    },
    {
      name: 'Pan de Masa Madre',
      category: 'Panadería',
      badge: '',
      price: 4.20,
      priceUnit: 'unidad',
      desc: 'Pan artesano hecho con masa madre tradicional',
      location: 'Local',
      img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80',
    },
    {
      name: 'Plato de Cerámica Artesanal',
      category: 'Artesanía',
      badge: '',
      price: 25.00,
      priceUnit: 'unidad',
      desc: 'Plato de cerámica hecho a mano',
      location: 'Local',
      img: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&q=80',
    },
    {
      name: 'Ramo de Rosas',
      category: 'Floristería',
      badge: 'De Temporada',
      price: 18.00,
      priceUnit: 'unidad',
      desc: 'Ramo de rosas frescas de temporada',
      location: 'Local',
      img: 'https://images.unsplash.com/photo-1577279607108-7b3e14675d94?w=500&q=80',
    },
    {
      name: 'Vino Blanco Joven',
      category: 'Vinos',
      badge: '',
      price: 12.00,
      priceUnit: 'botella',
      desc: 'Vino blanco joven criado en bodega',
      location: 'Local',
      img: 'https://images.unsplash.com/photo-1510812431401-41d2cab2707d?w=500&q=80',
    },
  ];

  filteredProducts = [...this.products];

  filterByCategory(category: string) {
    this.selectedFilter = category;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.products];

    if (this.selectedFilter !== 'Todas') {
      filtered = filtered.filter(p => p.category === this.selectedFilter);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.desc.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query)
      );
    }

    switch (this.selectedSort) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name, 'es'));
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name, 'es'));
        break;
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        break;
    }

    this.filteredProducts = filtered;
  }

  onSearchChange() {
    this.applyFilters();
  }

  addToCart(product: any) {
    this.cartItems++;
    console.log(`${product.name} añadido al carrito`);
  }

  get categories() {
    const usedCategories = new Set(this.products.map(product => product.category));
    const presentOptions = this.categoryOptions.filter(cat => cat === 'Todas' || usedCategories.has(cat) || cat === 'Moda');
    const extraCategories = this.products
      .map(product => product.category)
      .filter((cat, index, all) => !this.categoryOptions.includes(cat) && all.indexOf(cat) === index);

    return [...presentOptions, ...extraCategories];
  }
}
