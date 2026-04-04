import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from './core/component/layout/header/header';
import { Footer } from './core/component/layout/footer/footer';
import { CartComponent } from './core/component/cart/cart';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, CartComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(private router: Router) {}

  isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }
}
