import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class BolsasService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/bolsas';

  listar(params: Record<string, string> = {}) {
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  criar(bolsa: any) {
    return this.http.post<any>(this.apiUrl, bolsa);
  }

  atualizar(id: string, bolsa: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, bolsa);
  }

  deletar(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
