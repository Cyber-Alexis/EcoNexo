import { Routes } from '@angular/router';
import { Login } from './login/login';
import { RegisterCliente } from './register-cliente/register-cliente';
import { RegisterNegocio } from './register-negocio/register-negocio';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', redirectTo: 'register/cliente', pathMatch: 'full' },
  { path: 'register/cliente', component: RegisterCliente },
  { path: 'register/negocio', component: RegisterNegocio },
  { path: 'home', component: Home },
];
