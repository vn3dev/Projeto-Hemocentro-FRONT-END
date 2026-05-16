import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BolsasService } from '../../services/sangue';
import { DoadoresService } from '../../services/doadores.service';

@Component({
  selector: 'app-bolsa-lista',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './bolsa-lista.html',
  styleUrl: './bolsa-lista.css'
})
export class BolsaLista implements OnInit {
  private bolsasService = inject(BolsasService);
  private doadoresService = inject(DoadoresService);

  bolsas = signal<any[]>([]);
  doadores = signal<any[]>([]);
  busca = '';
  filtroTipoSangue = '';
  filtroValida = '';
  showModal = signal(false);
  modoEdicao = signal(false);
  idEditando = '';
  submitted = signal(false);
  errosModal = signal<string[]>([]);
  toast = signal<{ show: boolean; id: string; acao: string }>({ show: false, id: '', acao: '' });

  private readonly nomeCampos: Record<string, string> = {
    'tipo_sangue': 'Tipo Sanguíneo',
    'quantidade_ml': 'Quantidade (ml)',
    'data_coleta': 'Data de Coleta',
    'solucao_conservante': 'Solução Conservante',
    'id_doador': 'Doador',
  };

  private traduzirMensagem(msg: string): string {
    let s = msg;
    for (const [campo, nome] of Object.entries(this.nomeCampos)) {
      s = s.replaceAll(campo, nome);
    }
    s = s.replace('Use o formato YYYY-MM-DD', 'verifique se dia e mês são válidos');
    s = s.replace('não pode ser uma data futura', 'não pode ser uma data futura — corrija o campo Data de Coleta');
    s = s.replace('invalido.', 'inválido.');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private parsearErro(error: any): string[] {
    const body = error?.error;
    if (!body) return ['Erro de comunicação com o servidor.'];
    const mensagem: string = body.erro ?? '';
    const campos: string[] = body.campos ?? [];
    if (campos.length && mensagem.toLowerCase().includes('obrigat')) {
      const nomes = campos.map((c: string) => this.nomeCampos[c] ?? c).join(', ');
      return [`Campos obrigatórios não preenchidos: ${nomes}.`];
    }
    if (campos.length) return campos.map((c: string) => this.traduzirMensagem(c));
    if (mensagem)      return [this.traduzirMensagem(mensagem)];
    return ['Erro inesperado. Tente novamente.'];
  }

  idDoadorSelecionado = '';
  quantidadeMl: number | null = null;
  solucaoConservante = '';
  dataColeta = '';
  observacoes = '';

  readonly tiposSanguineos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Ordenação
  sortCol = '';
  sortDir: 'asc' | 'desc' = 'asc';

  setSort(col: string) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
  }

  get temFiltros(): boolean {
    return !!(this.filtroTipoSangue || this.filtroValida);
  }

  ngOnInit() {
    this.carregarBolsas();
    this.doadoresService.listar().subscribe(data => this.doadores.set(data));
  }

  carregarBolsas() {
    const params: Record<string, string> = {};
    if (this.filtroTipoSangue) params['tipo_sangue'] = this.filtroTipoSangue;
    if (this.filtroValida) params['valida'] = this.filtroValida;
    this.bolsasService.listar(params).subscribe(data => this.bolsas.set(data));
  }

  setFiltroTipoSangue(val: string) {
    this.filtroTipoSangue = this.filtroTipoSangue === val ? '' : val;
    this.carregarBolsas();
  }

  setFiltroValida(val: string) {
    this.filtroValida = this.filtroValida === val ? '' : val;
    this.carregarBolsas();
  }

  limparFiltros() {
    this.filtroTipoSangue = '';
    this.filtroValida = '';
    this.carregarBolsas();
  }

  get bolsasFiltradas() {
    let lista = this.bolsas();

    if (this.busca.trim()) {
      const q = this.busca.toLowerCase();
      lista = lista.filter(b =>
        b.tipo_sangue?.toLowerCase().includes(q) ||
        b.data_validade?.toLowerCase().includes(q) ||
        b.id?.toLowerCase().includes(q)
      );
    }

    if (this.sortCol) {
      lista = [...lista].sort((a, b) => {
        let va: any = a[this.sortCol] ?? '';
        let vb: any = b[this.sortCol] ?? '';

        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();

        if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
        if (va > vb) return this.sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return lista;
  }

  get tipoSangueSelecionado(): string {
    const doador = this.doadores().find(d => d.id === this.idDoadorSelecionado);
    if (!doador) return '';
    return (doador.tipoSangue || '') + (doador.fatorRh || '');
  }

  formatarId(id: string): string {
    return id ? id.substring(0, 8) + '...' : '';
  }

  formatarData(data: string): string {
    if (!data) return '-';
    const [year, month, day] = data.split('-');
    return `${day}/${month}/${year}`;
  }

  // dd/mm/aaaa → aaaa-mm-dd para o backend
  private paraISO(data: string): string {
    if (!data || !data.includes('/')) return data;
    const [d, m, y] = data.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  mascaraData(event: Event) {
    const el = event.target as HTMLInputElement;
    const d = el.value.replace(/\D/g, '').substring(0, 8);
    let v = d;
    if (d.length > 4)      v = `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
    else if (d.length > 2) v = `${d.slice(0,2)}/${d.slice(2)}`;
    this.dataColeta = v;
    el.value = v;
  }

  abrirModal() {
    this.modoEdicao.set(false);
    this.idEditando = '';
    this.submitted.set(false);
    this.showModal.set(true);
  }

  abrirModalEdicao(bolsa: any) {
    this.modoEdicao.set(true);
    this.idEditando = bolsa.id;
    this.submitted.set(false);
    this.idDoadorSelecionado = bolsa.id_doador || '';
    this.quantidadeMl = bolsa.quantidade_ml ?? null;
    this.solucaoConservante = bolsa.solucao_conservante || '';
    this.dataColeta = bolsa.data_coleta ? this.formatarData(bolsa.data_coleta) : '';
    this.observacoes = '';
    this.showModal.set(true);
  }

  fecharModal() {
    this.showModal.set(false);
    this.modoEdicao.set(false);
    this.idEditando = '';
    this.errosModal.set([]);
    this.limparCampos();
  }

  limparCampos() {
    this.idDoadorSelecionado = '';
    this.quantidadeMl = null;
    this.solucaoConservante = '';
    this.dataColeta = '';
    this.observacoes = '';
    this.submitted.set(false);
  }

  get camposInvalidos(): boolean {
    return !this.idDoadorSelecionado || !this.quantidadeMl || this.quantidadeMl <= 0 || !this.dataColeta;
  }

  salvar() {
    this.submitted.set(true);
    this.errosModal.set([]);
    if (this.camposInvalidos) return;

    const dadosBolsa = {
      tipo_sangue: this.tipoSangueSelecionado,
      quantidade_ml: this.quantidadeMl,
      data_coleta: this.paraISO(this.dataColeta),
      solucao_conservante: this.solucaoConservante,
      id_doador: this.idDoadorSelecionado,
    };

    if (this.modoEdicao()) {
      this.bolsasService.atualizar(this.idEditando, dadosBolsa).subscribe({
        next: (atualizada) => {
          this.carregarBolsas();
          this.showModal.set(false);
          this.modoEdicao.set(false);
          this.idEditando = '';
          this.limparCampos();
          this.mostrarToast(atualizada.id || this.idEditando, 'atualizada');
        },
        error: (err) => this.errosModal.set(this.parsearErro(err))
      });
    } else {
      this.bolsasService.criar(dadosBolsa).subscribe({
        next: (criada) => {
          this.carregarBolsas();
          this.showModal.set(false);
          this.limparCampos();
          this.mostrarToast(criada.id || '', 'cadastrada');
        },
        error: (err) => this.errosModal.set(this.parsearErro(err))
      });
    }
  }

  mostrarToast(id: string, acao: string) {
    this.toast.set({ show: true, id, acao });
    setTimeout(() => this.toast.set({ show: false, id: '', acao: '' }), 5000);
  }

  fecharToast() {
    this.toast.set({ show: false, id: '', acao: '' });
  }

  deletar(id: string) {
    if (confirm('Tem certeza que deseja remover esta bolsa?')) {
      this.bolsasService.deletar(id).subscribe({
        next: () => this.carregarBolsas(),
        error: () => alert('Erro ao remover bolsa.')
      });
    }
  }
}
