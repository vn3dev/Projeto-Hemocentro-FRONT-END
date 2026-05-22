import { Routes } from '@angular/router';
import { DoadoresList } from './components/doadores-list/doadores-list';
import { BolsaLista } from './components/bolsa-lista/bolsa-lista';

export const routes: Routes = [
  { path: '', redirectTo: 'doadores', pathMatch: 'full' },
  { path: 'doadores', component: DoadoresList },
  { path: 'bolsas', component: BolsaLista },
];
