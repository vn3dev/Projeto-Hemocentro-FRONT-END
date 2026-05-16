import { Routes } from '@angular/router';
import { DoadoresList } from './components/doadores-list/doadores-list';
import { BolsaLista } from './components/bolsa-lista/bolsa-lista';
import { VisaoGeral } from './components/visao-geral/visao-geral';

export const routes: Routes = [
  { path: '', redirectTo: 'doadores', pathMatch: 'full' },
  { path: 'doadores', component: DoadoresList },
  { path: 'bolsas', component: BolsaLista },
  { path: 'visao-geral', component: VisaoGeral },
];
