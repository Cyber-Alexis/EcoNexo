import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-negocios',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './negocios.html',
  styleUrl: './negocios.css',
})
export class Negocios {
  searchQuery = '';
  selectedFilter = 'Todas';
  selectedSort = 'rating-desc';

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

  businesses = [
    {
      name: 'Forn de la Plaça',
      category: 'Panadería',
      badge: '',
      rating: 4.9,
      reviews: 89,
      desc: 'Panadería artesanal con más de 50 años de tradición. Pan de masa madre y bollería casera.',
      location: 'Plaça Sant Joan, Lleida',
      img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80',
    },
    {
      name: 'Flors Maria',
      category: 'Floristería',
      badge: 'Ecológico',
      rating: 4.9,
      reviews: 67,
      desc: 'Floristería con arreglos personalizados para todas las ocasiones. Flores frescas cada día.',
      location: 'Eix Comercial, Lleida',
      img: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&q=80',
    },
    {
      name: 'Cal Pep - Frutas y Verduras',
      category: 'Frutas y Verduras',
      badge: 'Ecológico',
      rating: 4.8,
      reviews: 124,
      desc: 'Productos frescos directamente del campo de Lleida. Fruta de temporada y verduras ecológicas.',
      location: 'Centre Històric, Lleida',
      img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
    },
    {
      name: 'Vinya del Segre',
      category: 'Vinos',
      badge: 'Ecológico',
      rating: 4.7,
      reviews: 56,
      desc: 'Bodega familiar con vinos D.O. Costers del Segre. Visitas guiadas y catas.',
      location: 'Raimat, Lleida',
      img: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=500&q=80',
    },
    {
      name: 'Carns Artesanes Macià',
      category: 'Carnicería',
      badge: '',
      rating: 4.6,
      reviews: 78,
      desc: 'Carnicería tradicional con productos de km 0. Embutidos artesanales y carnes selectas.',
      location: 'Cappont, Lleida',
      img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&q=80',
    },
    {
      name: 'Artesanies del Segre',
      category: 'Artesanía',
      badge: 'Ecológico',
      rating: 4.5,
      reviews: 34,
      desc: 'Productos artesanales hechos a mano. Cerámica, cestería y decoración tradicional.',
      location: 'Bordeta, Lleida',
      img: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&q=80',
    },
  ];

  filteredBusinesses = [...this.businesses];

  filterByCategory(category: string) {
    this.selectedFilter = category;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.businesses];

    if (this.selectedFilter !== 'Todas') {
      filtered = filtered.filter(b => b.category === this.selectedFilter);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(query) ||
        b.desc.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query)
      );
    }

    switch (this.selectedSort) {
      case 'reviews-desc':
        filtered.sort((a, b) => b.reviews - a.reviews);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        break;
      default:
        filtered.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
        break;
    }

    this.filteredBusinesses = filtered;
  }

  onSearchChange() {
    this.applyFilters();
  }

  get categories() {
    const usedCategories = new Set(this.businesses.map(b => b.category));
    const presentOptions = this.categoryOptions.filter(cat => cat === 'Todas' || usedCategories.has(cat) || cat === 'Moda');
    const extraCategories = this.businesses
      .map(b => b.category)
      .filter((cat, index, all) => !this.categoryOptions.includes(cat) && all.indexOf(cat) === index);

    return [...presentOptions, ...extraCategories];
  }
}
