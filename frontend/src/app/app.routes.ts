import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { crearGuardDeRol } from './core/auth/rol.guard';
import { LoginComponent } from './core/auth/login/login.component';
import { HojaVidaComponent } from './features/animales/hoja-vida.component';
import { InscribirAnimalComponent } from './features/animales/inscribir-animal.component';
import { BandejaFormalizacionComponent } from './features/formalizacion/bandeja-formalizacion.component';
import { MapaComponent } from './features/mapa/mapa.component';
import { AnimalPublicoComponent } from './features/publico/animal-publico.component';
import { HojaVidaPublicaComponent } from './features/publico/hoja-vida-publica.component';
import { MapaPublicoComponent } from './features/publico/mapa-publico.component';
import { PanelIndicadoresComponent } from './features/indicadores/panel-indicadores.component';
import { BandejaReportesComponent } from './features/reportes/bandeja-reportes.component';
import { BandejaValidacionComponent } from './features/validacion/bandeja-validacion.component';

export const routes: Routes = [
  { path: 'ingreso', component: LoginComponent },
  { path: '', component: MapaPublicoComponent },
  { path: 'vbp/:id', component: HojaVidaPublicaComponent },
  { path: 'v/:codigo', component: AnimalPublicoComponent },
  { path: 'mapa', component: MapaComponent, canActivate: [authGuard] },
  {
    path: 'animales/inscribir',
    component: InscribirAnimalComponent,
    canActivate: [crearGuardDeRol('COMUNIDAD', 'VETERINARIO', 'LIDER', 'ADMIN')],
  },
  { path: 'animales/:id', component: HojaVidaComponent, canActivate: [authGuard] },
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
  {
    path: 'reportes',
    component: BandejaReportesComponent,
    canActivate: [authGuard],
  },
  {
    path: 'indicadores',
    component: PanelIndicadoresComponent,
    canActivate: [authGuard],
  },
];
