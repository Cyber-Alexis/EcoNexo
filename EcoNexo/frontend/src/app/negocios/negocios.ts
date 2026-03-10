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
  selectedFilter = 'Todos';

  businesses = [
    {
      name: 'Panadería Forn de la Plaça',
      category: 'Panadería',
      badge: '',
      rating: 4.9,
      reviews: 99,
      desc: 'Panadería artesanal con más de 50 años de tradición. Pan de masa madre y bollería con recetas artesanales.',
      location: 'Plaça Sant Joan, Lleida',
      img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80',
    },
    {
      name: 'Floristería Flora María',
      category: 'Floristería',
      badge: 'Ecológico',
      rating: 4.9,
      reviews: 67,
      desc: 'Floristerías con arreglos personalizados para todos los eventos. Envíos a domicilio en toda la zona.',
      location: 'El Commercial, Lleida',
      img: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&q=80',
    },
    {
      name: 'Cal Pep - Frutas y Verduras',
      category: 'Frutas y Verduras',
      badge: 'Ecológico',
      rating: 4.8,
      reviews: 124,
      desc: 'Productos frescos directamente del campo de Lleida. Frutas y verduras de temporada de máxima calidad.',
      location: 'Centre Històric, Lleida',
      img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
    },
    {
      name: 'Vinya del Segre',
      category: 'Vinos',
      badge: 'Ecológico',
      rating: 4.7,
      reviews: 86,
      desc: 'Bodega familiar con vino D.O. Costers del Segre. Visitas guiadas y catas personalizadas.',
      location: 'Raimat, Lleida',
      img: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=500&q=80',
    },
    {
      name: 'Carnicería Carne Artesanos Macià',
      category: 'Carnicería',
      badge: '',
      rating: 4.8,
      reviews: 78,
      desc: 'Carnicería artesana con productos de km 0. Elaborados artesanos de alta calidad con recetas traditioneles.',
      location: 'Cappont, Lleida',
      img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&q=80',
    },
    {
      name: 'Artesanías Artisanes del Segre',
      category: 'Artesanía',
      badge: '',
      rating: 4.5,
      reviews: 54,
      desc: 'Productos artesanales hechos a mano. Cerámica, cerámica y decoración tradicional única.',
      location: 'Ronda, Lleida',
      img: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&q=80',
    },
  ];

  filteredBusinesses = [...this.businesses];

  filterByCategory(category: string) {
    this.selectedFilter = category;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.businesses;

    if (this.selectedFilter !== 'Todos') {
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

    this.filteredBusinesses = filtered;
  }

  onSearchChange() {
    this.applyFilters();
  }

  get categories() {
    const cats = new Set(this.businesses.map(b => b.category));
    return ['Todos', ...Array.from(cats)];
  }
}
