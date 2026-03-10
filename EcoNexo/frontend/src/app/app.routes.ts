import { Routes } from '@angular/router';
import { Login } from './login/login';
import { RegisterCliente } from './register-cliente/register-cliente';
import { RegisterNegocio } from './register-negocio/register-negocio';
import { Home } from './home/home';
<<<<<<< Updated upstream
import { Negocios } from './negocios/negocios';
=======
import { About } from './about/about';
>>>>>>> Stashed changes

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', redirectTo: 'register/cliente', pathMatch: 'full' },
  { path: 'register/cliente', component: RegisterCliente },
  { path: 'register/negocio', component: RegisterNegocio },
  { path: 'home', component: Home },
<<<<<<< Updated upstream
  { path: 'negocios', component: Negocios },
=======
  { path: 'about', component: About },
>>>>>>> Stashed changes
];
