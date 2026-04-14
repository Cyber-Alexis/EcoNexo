import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { RegisterCliente } from './pages/register-cliente/register-cliente';
import { RegisterNegocio } from './pages/register-negocio/register-negocio';
import { Home } from './pages/home/home';
import { Negocios } from './pages/negocios/negocios';
import { Productos } from './pages/productos/productos';
import { About } from './pages/about/about';
import { NegocioDetalle } from './pages/negocio-detalle/negocio-detalle';
import { Perfil } from './pages/pages_consumer/perfil/perfil';
import { Configuracion } from './pages/pages_consumer/configuracion/configuracion';
import { Admin } from './pages/admin/admin';
import { adminGuard } from './core/guards/admin.guard';
import { Checkout } from './pages/proceso_pago/checkout/checkout';
import { authGuard } from './core/guards/auth.guard';
import { checkoutGuard } from './core/guards/checkout.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', redirectTo: 'register/cliente', pathMatch: 'full' },
  { path: 'register/cliente', component: RegisterCliente },
  { path: 'register/negocio', component: RegisterNegocio },
  { path: 'home', component: Home },
  { path: 'negocios', component: Negocios },
  { path: 'negocios/:id', component: NegocioDetalle },
  { path: 'productos', component: Productos },
  { path: 'about', component: About },
  { path: 'perfil', component: Perfil },
  { path: 'configuracion', component: Configuracion },
  { path: 'admin', component: Admin, canActivate: [adminGuard] },
  { path: 'admin', component: Admin },
  { path: 'checkout', component: Checkout, canActivate: [authGuard, checkoutGuard] },
];
