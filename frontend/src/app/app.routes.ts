import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { crearGuardDeRol } from './core/auth/rol.guard';
import { LoginComponent } from './core/auth/login/login.component';
import { InscribirAnimalComponent } from './features/animales/inscribir-animal.component';
import { BandejaFormalizacionComponent } from './features/formalizacion/bandeja-formalizacion.component';
import { MapaComponent } from './features/mapa/mapa.component';
import { BandejaValidacionComponent } from './features/validacion/bandeja-validacion.component';

export const routes: Routes = [
  { path: 'ingreso', component: LoginComponent },
  { path: '', component: MapaComponent, canActivate: [authGuard] },
  {
    path: 'animales/inscribir',
    component: InscribirAnimalComponent,
    canActivate: [crearGuardDeRol('COMUNIDAD', 'VETERINARIO', 'LIDER', 'ADMIN')],
  },
  {
    path: 'validacion',
    component: BandejaValidacionComponent,
    canActivate: [crearGuardDeRol('VETERINARIO', 'ADMIN')],
  },
  {
    path: 'formalizacion',
    component: BandejaFormalizacionComponent,
    canActivate: [crearGuardDeRol('LIDER', 'ADMIN')],
  },
];
