import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface EstoqueTipo {
  tipo_sangue: string;
  total_doadores: number;
  doadores_aptos: number;
  total_bolsas: number;
  bolsas_validas: number;
  total_ml_valido: number;
}

export interface Totais {
  total_doadores: number;
  doadores_aptos: number;
  total_bolsas: number;
  bolsas_validas: number;
  total_ml_valido: number;
}

export interface VisaoGeralData {
  por_tipo: EstoqueTipo[];
  totais: Totais;
  ultimos_doadores: any[];
  ultimas_bolsas: any[];
}

@Injectable({ providedIn: 'root' })
export class VisaoGeralService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/visao-geral';

  listar() {
    return this.http.get<VisaoGeralData>(this.apiUrl);
  }
}
