import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './core/auth/login/login.component';
import { MapaComponent } from './features/mapa/mapa.component';

export const routes: Routes = [
  { path: 'ingreso', component: LoginComponent },
  { path: '', component: MapaComponent, canActivate: [authGuard] },
];
