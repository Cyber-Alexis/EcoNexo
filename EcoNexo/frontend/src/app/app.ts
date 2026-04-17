import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from './core/component/layout/header/header';
import { Footer } from './core/component/layout/footer/footer';
import { CartComponent } from './core/component/cart/cart';
import { SessionMonitorService } from './core/services/session-monitor.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, CartComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(
    private router: Router,
    private sessionMonitor: SessionMonitorService,
  ) {
    this.sessionMonitor.start();
  }

  isAdminRoute(): boolean {
    const url = this.router.url || '';
    return url.startsWith('/admin') || url.startsWith('/mi-negocio') || url.startsWith('/mis-productos');
  }

  isProfileRoute(): boolean {
    const url = this.router.url || '';
    return url.startsWith('/perfil')
      || url.startsWith('/configuracion')
      || url.startsWith('/mis-pedidos')
      || url.startsWith('/mis-resenas')
      || url.includes('/perfil/');
  }
}
