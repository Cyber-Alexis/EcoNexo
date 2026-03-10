import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { RegisterCliente } from './pages/register-cliente/register-cliente';
import { RegisterNegocio } from './pages/register-negocio/register-negocio';
import { Home } from './pages/home/home';
import { Negocios } from './pages/negocios/negocios';
import { About } from './pages/about/about';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', redirectTo: 'register/cliente', pathMatch: 'full' },
  { path: 'register/cliente', component: RegisterCliente },
  { path: 'register/negocio', component: RegisterNegocio },
  { path: 'home', component: Home },
  { path: 'negocios', component: Negocios },
  { path: 'about', component: About },
];
