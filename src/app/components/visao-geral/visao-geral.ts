import { Component, inject, OnInit, signal } from '@angular/core';
import { VisaoGeralService, VisaoGeralData, EstoqueTipo, Totais } from '../../services/visao-geral.service';

@Component({
  selector: 'app-visao-geral',
  standalone: true,
  imports: [],
  templateUrl: './visao-geral.html',
  styleUrl: './visao-geral.css',
})
export class VisaoGeral implements OnInit {
  private service = inject(VisaoGeralService);

  dados = signal<VisaoGeralData | null>(null);

  ngOnInit() {
    this.service.listar().subscribe(data => this.dados.set(data));
  }

  get porTipo(): EstoqueTipo[] {
    return this.dados()?.por_tipo ?? [];
  }

  get totais(): Totais {
    return this.dados()?.totais ?? {
      total_doadores: 0, doadores_aptos: 0,
      total_bolsas: 0, bolsas_validas: 0, total_ml_valido: 0
    };
  }

  get ultimosDoadores(): any[] { return this.dados()?.ultimos_doadores ?? []; }
  get ultimasBolsas(): any[]   { return this.dados()?.ultimas_bolsas   ?? []; }

  // ── Gota de sangue ──────────────────────────────────
  private get maxMl(): number {
    return Math.max(...this.porTipo.map(e => e.total_ml_valido), 1);
  }

  fillAltura(ml: number): number {
    return Math.round(Math.min(ml / this.maxMl, 1) * 115);
  }

  litros(ml: number): string {
    return (ml / 1000).toFixed(1);
  }

  // ── Utilitários ─────────────────────────────────────
  porcentagem(valor: number, total: number): number {
    if (!total) return 0;
    return Math.round((valor / total) * 100);
  }

  // stroke-dasharray para donut SVG (circunferência normalizada em 100)
  donut(valor: number, total: number): string {
    const pct = total ? Math.min((valor / total) * 100, 100) : 0;
    return `${pct.toFixed(1)} ${(100 - pct).toFixed(1)}`;
  }

  // Altura da barra no gráfico de barras (0–100%)
  get maxDoadores(): number {
    return Math.max(...this.porTipo.map(t => t.total_doadores), 1);
  }

  formatarData(data: string): string {
    if (!data) return '—';
    const [y, m, d] = data.split('-');
    return `${d}/${m}/${y}`;
  }

  getTipoSangue(d: any): string {
    return (d.tipoSangue ?? '') + (d.fatorRh ?? '');
  }

  mlParaLitros(ml: number): string {
    return ml >= 1000 ? `${(ml / 1000).toFixed(1)} L` : `${ml} ml`;
  }
}
