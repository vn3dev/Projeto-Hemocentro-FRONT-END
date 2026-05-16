import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DoadoresService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/doadores';

  listar(params: Record<string, string> = {}) {
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  criar(doador: any) {
    return this.http.post<any>(this.apiUrl, doador);
  }

  atualizar(id: string, doador: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, doador);
  }

  deletar(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
