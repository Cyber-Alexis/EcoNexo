import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { adminGuard } from './core/guards/admin.guard';
import { businessGuard } from './core/guards/business.guard';
import { noBusinessGuard } from './core/guards/no-business.guard';
import { authGuard } from './core/guards/auth.guard';
import { checkoutGuard } from './core/guards/checkout.guard';
import { guestGuard } from './core/guards/guest.guard';
import { canDeactivateMiNegocioGuard } from './core/guards/can-deactivate-mi-negocio.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPassword, canActivate: [guestGuard] },
  { path: 'register', redirectTo: 'register/cliente', pathMatch: 'full' },
  { path: 'register/cliente', loadComponent: () => import('./pages/register-cliente/register-cliente').then(m => m.RegisterCliente), canActivate: [guestGuard] },
  { path: 'register/negocio', loadComponent: () => import('./pages/register-negocio/register-negocio').then(m => m.RegisterNegocio), canActivate: [guestGuard] },

  // Business dashboard
  { path: 'mi-negocio', loadComponent: () => import('./pages/pages_business/mi-negocio/mi-negocio').then(m => m.MiNegocio), canActivate: [businessGuard], canDeactivate: [canDeactivateMiNegocioGuard] },
  { path: 'mi-negocio/configuracion', loadComponent: () => import('./pages/pages_business/configuracion/configuracion').then(m => m.ConfiguracionBusiness), canActivate: [businessGuard] },
  { path: 'vista-negocio', loadComponent: () => import('./pages/pages_business/vista-negocio/vista-negocio').then(m => m.VistaNegocio), canActivate: [businessGuard] },
  { path: 'mis-productos', loadComponent: () => import('./pages/pages_business/mis-productos/mis-productos').then(m => m.MisProductos), canActivate: [businessGuard] },
  { path: 'mis-pedidos-productor', loadComponent: () => import('./pages/pages_business/mis-pedidos-productor/mis-pedidos-productor').then(m => m.MisPedidosProductor), canActivate: [businessGuard] },
  { path: 'estadisticas-productor', loadComponent: () => import('./pages/pages_business/estadisticas-productor/estadisticas-productor').then(m => m.EstadisticasProductor), canActivate: [businessGuard] },
  { path: 'calendario-productor', loadComponent: () => import('./pages/pages_business/calendario-productor/calendario-productor').then(m => m.CalendarioProductor), canActivate: [businessGuard] },

  // Public / Consumer
  { path: 'home', loadComponent: () => import('./pages/home/home').then(m => m.Home), canActivate: [noBusinessGuard] },
  { path: 'negocios', loadComponent: () => import('./pages/negocios/negocios').then(m => m.Negocios), canActivate: [noBusinessGuard] },
  { path: 'negocios/:id', loadComponent: () => import('./pages/negocio-detalle/negocio-detalle').then(m => m.NegocioDetalle), canActivate: [noBusinessGuard] },
  { path: 'productos', loadComponent: () => import('./pages/productos/productos').then(m => m.Productos), canActivate: [noBusinessGuard] },
  { path: 'about', loadComponent: () => import('./pages/about/about').then(m => m.About) },
  { path: 'perfil', loadComponent: () => import('./pages/pages_consumer/perfil/perfil').then(m => m.Perfil), canActivate: [noBusinessGuard] },
  { path: 'mis-resenas', loadComponent: () => import('./pages/pages_consumer/mis-resenas/mis-resenas').then(m => m.MisResenas), canActivate: [authGuard, noBusinessGuard] },
  { path: 'mis-pedidos', loadComponent: () => import('./pages/pages_consumer/mis-pedidos/mis-pedidos').then(m => m.MisPedidos), canActivate: [authGuard, noBusinessGuard] },
  { path: 'configuracion', loadComponent: () => import('./pages/pages_consumer/configuracion/configuracion').then(m => m.Configuracion), canActivate: [noBusinessGuard] },

  // Admin
  { path: 'admin', loadComponent: () => import('./pages/admin/admin').then(m => m.Admin), canActivate: [adminGuard] },

  // Checkout
  { path: 'checkout', loadComponent: () => import('./pages/proceso_pago/checkout/checkout').then(m => m.Checkout), canActivate: [authGuard, checkoutGuard] },

  // 404 - Must be last
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound) },
];
