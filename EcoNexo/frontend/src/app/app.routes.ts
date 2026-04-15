import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { RegisterCliente } from './pages/register-cliente/register-cliente';
import { RegisterNegocio } from './pages/register-negocio/register-negocio';
import { MiNegocio } from './pages/pages_business/mi-negocio/mi-negocio';
import { Home } from './pages/home/home';
import { Negocios } from './pages/negocios/negocios';
import { Productos } from './pages/productos/productos';
import { About } from './pages/about/about';
import { NegocioDetalle } from './pages/negocio-detalle/negocio-detalle';
import { Perfil } from './pages/pages_consumer/perfil/perfil';
import { Configuracion } from './pages/pages_consumer/configuracion/configuracion';
import { Admin } from './pages/admin/admin';
import { adminGuard } from './core/guards/admin.guard';
import { businessGuard } from './core/guards/business.guard';
import { noBusinessGuard } from './core/guards/no-business.guard';
import { Checkout } from './pages/proceso_pago/checkout/checkout';
import { authGuard } from './core/guards/auth.guard';
import { checkoutGuard } from './core/guards/checkout.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', redirectTo: 'register/cliente', pathMatch: 'full' },
  { path: 'register/cliente', component: RegisterCliente },
  { path: 'register/negocio', component: RegisterNegocio },
  { path: 'mi-negocio', component: MiNegocio, canActivate: [businessGuard] },
  { path: 'home', component: Home, canActivate: [noBusinessGuard] },
  { path: 'negocios', component: Negocios, canActivate: [noBusinessGuard] },
  { path: 'negocios/:id', component: NegocioDetalle, canActivate: [noBusinessGuard] },
  { path: 'productos', component: Productos, canActivate: [noBusinessGuard] },
  { path: 'about', component: About },
  { path: 'perfil', component: Perfil, canActivate: [noBusinessGuard] },
  { path: 'configuracion', component: Configuracion, canActivate: [noBusinessGuard] },
  { path: 'admin', component: Admin, canActivate: [adminGuard] },
  { path: 'checkout', component: Checkout, canActivate: [authGuard, checkoutGuard, noBusinessGuard] },
];
