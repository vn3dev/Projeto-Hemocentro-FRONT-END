import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DoadoresService } from '../../services/doadores.service';

@Component({
  selector: 'app-doadores-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './doadores-list.html',
  styleUrl: './doadores-list.css'
})
export class DoadoresList implements OnInit {
  private service = inject(DoadoresService);
  private route = inject(ActivatedRoute);

  doadores = signal<any[]>([]);
  busca = '';
  showModal = signal(false);
  modoEdicao = signal(false);
  idEditando = '';
  submitted = signal(false);
  errosModal = signal<string[]>([]);
  toast = signal<{ show: boolean; nome: string; acao: string }>({ show: false, nome: '', acao: '' });

  private readonly nomeCampos: Record<string, string> = {
    'nomeDoador': 'Nome completo',
    'cpfDoador': 'CPF',
    'telefoneDoador': 'Telefone',
    'sexoDoador': 'Sexo',
    'cidadeDoador': 'Cidade',
    'EstadoDoador': 'UF',
    'pesoDoador': 'Peso',
    'alturaDoador': 'Altura',
    'dataNascimentoDoador': 'Data de Nascimento',
    'tipoSangue': 'Tipo Sanguíneo',
    'fatorRh': 'Fator Rh',
    'alergiasDoador': 'Alergias',
    'medicamentosDoador': 'Medicamentos',
    'observacoes': 'Observações',
  };

  private traduzirMensagem(msg: string): string {
    let s = msg;
    for (const [campo, nome] of Object.entries(this.nomeCampos)) {
      s = s.replaceAll(campo, nome);
    }
    s = s.replace('deve ser um número', 'deve ser numérico');
    s = s.replace("'M' para masculino ou 'F' para feminino", '"M" para Masculino ou "F" para Feminino');
    s = s.replace('já cadastrado por outro doador', 'já pertence a outro doador cadastrado');
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

  // Filtros server-side
  filtroSexo = '';
  filtroTipoSangue = '';
  filtroApto = '';

  // Campos do formulário
  nomeDoador = '';
  cpfDoador = '';
  telefoneDoador = '';
  sexoDoador = 'M';
  cidadeDoador = '';
  estadoDoador = '';
  pesoDoador: number | null = null;
  alturaDoador: number | null = null;
  dataNascimentoDoador = '';
  tipoSangue = '';
  fatorRh = '';
  alergiasDoador = '';
  medicamentosDoador = '';
  observacoesDoador = '';

  readonly tiposSanguineos = ['A', 'B', 'AB', 'O'];  // usado no formulário
  readonly fatoresRh = ['+', '-'];                    // usado no formulário
  readonly tiposFiltro = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']; // chips de filtro

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
    return !!(this.filtroSexo || this.filtroTipoSangue || this.filtroApto);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const filter = params['filter'] || 'todos';
      if (filter === 'disponiveis') this.filtroApto = 'true';
      else if (filter === 'indisponiveis') this.filtroApto = 'false';
      else this.filtroApto = '';
      this.carregarDoadores();
    });
  }

  carregarDoadores() {
    const params: Record<string, string> = {};
    if (this.filtroSexo) params['sexoDoador'] = this.filtroSexo;
    if (this.filtroTipoSangue) {
      // filtroTipoSangue armazena o tipo completo ex: "A+", "AB-"
      // o fator é sempre o último caractere
      params['tipoSangue'] = this.filtroTipoSangue.slice(0, -1);
      params['fatorRh']    = this.filtroTipoSangue.slice(-1);
    }
    if (this.filtroApto) params['aptoParaDoacao'] = this.filtroApto;
    this.service.listar(params).subscribe(data => this.doadores.set(data));
  }

  setFiltroSexo(val: string) {
    this.filtroSexo = this.filtroSexo === val ? '' : val;
    this.carregarDoadores();
  }

  setFiltroTipoSangue(val: string) {
    this.filtroTipoSangue = this.filtroTipoSangue === val ? '' : val;
    this.carregarDoadores();
  }

  setFiltroApto(val: string) {
    this.filtroApto = this.filtroApto === val ? '' : val;
    this.carregarDoadores();
  }

  limparFiltros() {
    this.filtroSexo = '';
    this.filtroTipoSangue = '';
    this.filtroApto = '';
    this.carregarDoadores();
  }

  get doadoresFiltrados() {
    let lista = this.doadores();

    if (this.busca.trim()) {
      const q = this.busca.toLowerCase();
      lista = lista.filter(d =>
        d.nomeDoador?.toLowerCase().includes(q) ||
        d.telefoneDoador?.toLowerCase().includes(q) ||
        d.id?.toLowerCase().includes(q)
      );
    }

    if (this.sortCol) {
      lista = [...lista].sort((a, b) => {
        let va: any, vb: any;

        if (this.sortCol === 'tipoSangue') {
          va = (a.tipoSangue ?? '') + (a.fatorRh ?? '');
          vb = (b.tipoSangue ?? '') + (b.fatorRh ?? '');
        } else {
          va = a[this.sortCol] ?? '';
          vb = b[this.sortCol] ?? '';
        }

        // cada valor é normalizado de forma independente
        if (typeof va === 'boolean') va = va ? 1 : 0;
        if (typeof vb === 'boolean') vb = vb ? 1 : 0;
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();

        if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
        if (va > vb) return this.sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return lista;
  }

  getElegibilidade(doador: any): { text: string; type: 'sim' | 'dias' } {
    if (!doador.dataUltimaDoacao) return { text: 'Sim', type: 'sim' };
    const lastDonation = new Date(doador.dataUltimaDoacao);
    const today = new Date();
    const waitDays = doador.sexoDoador === 'M' ? 60 : 90;
    const eligibleDate = new Date(lastDonation.getTime() + waitDays * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.ceil((eligibleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining > 0) return { text: `${daysRemaining} Dias`, type: 'dias' };
    return { text: 'Sim', type: 'sim' };
  }

  getTipoSangueDisplay(doador: any): string {
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

  // ── Máscaras de input ────────────────────────────

  mascaraCpf(event: Event) {
    const el = event.target as HTMLInputElement;
    const d = el.value.replace(/\D/g, '').substring(0, 11);
    let v = d;
    if (d.length > 9)      v = `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
    else if (d.length > 6) v = `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    else if (d.length > 3) v = `${d.slice(0,3)}.${d.slice(3)}`;
    this.cpfDoador = v;
    el.value = v;
  }

  mascaraTelefone(event: Event) {
    const el = event.target as HTMLInputElement;
    const d = el.value.replace(/\D/g, '').substring(0, 11);
    let v = d;
    if (d.length > 7)      v = `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    else if (d.length > 2) v = `(${d.slice(0,2)}) ${d.slice(2)}`;
    else if (d.length > 0) v = `(${d}`;
    this.telefoneDoador = v;
    el.value = v;
  }

  mascaraDataNasc(event: Event) {
    const el = event.target as HTMLInputElement;
    const d = el.value.replace(/\D/g, '').substring(0, 8);
    let v = d;
    if (d.length > 4)      v = `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
    else if (d.length > 2) v = `${d.slice(0,2)}/${d.slice(2)}`;
    this.dataNascimentoDoador = v;
    el.value = v;
  }

  mascaraUF(event: Event) {
    const el = event.target as HTMLInputElement;
    const v = el.value.toUpperCase();
    this.estadoDoador = v;
    el.value = v;
  }


  abrirModal() {
    this.modoEdicao.set(false);
    this.idEditando = '';
    this.submitted.set(false);
    this.showModal.set(true);
  }

  abrirModalEdicao(doador: any) {
    this.modoEdicao.set(true);
    this.idEditando = doador.id;
    this.submitted.set(false);
    this.nomeDoador = doador.nomeDoador || '';
    this.cpfDoador = doador.cpfDoador || '';
    this.telefoneDoador = doador.telefoneDoador || '';
    this.sexoDoador = doador.sexoDoador || 'M';
    this.cidadeDoador = doador.cidadeDoador || '';
    this.estadoDoador = doador.EstadoDoador || '';
    this.pesoDoador = doador.pesoDoador ?? null;
    this.alturaDoador = doador.alturaDoador ?? null;
    this.dataNascimentoDoador = doador.dataNascimentoDoador ? this.formatarData(doador.dataNascimentoDoador) : '';
    this.tipoSangue = doador.tipoSangue || '';
    this.fatorRh = doador.fatorRh || '';
    this.alergiasDoador = doador.alergiasDoador || '';
    this.medicamentosDoador = doador.medicamentosDoador || '';
    this.observacoesDoador = doador.observacoes || '';
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
    this.nomeDoador = '';
    this.cpfDoador = '';
    this.telefoneDoador = '';
    this.sexoDoador = 'M';
    this.cidadeDoador = '';
    this.estadoDoador = '';
    this.pesoDoador = null;
    this.alturaDoador = null;
    this.dataNascimentoDoador = '';
    this.tipoSangue = '';
    this.fatorRh = '';
    this.alergiasDoador = '';
    this.medicamentosDoador = '';
    this.observacoesDoador = '';
    this.submitted.set(false);
  }

  get nomeComCaracteresInvalidos(): boolean {
    return !!this.nomeDoador.trim() && !/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(this.nomeDoador);
  }

  get camposInvalidos(): boolean {
    return !this.nomeDoador.trim() || this.nomeComCaracteresInvalidos || !this.tipoSangue || !this.fatorRh;
  }

  salvar() {
    this.submitted.set(true);
    this.errosModal.set([]);
    if (this.camposInvalidos) return;

    const nomeSalvo = this.nomeDoador;

    const dadosDoador = {
      nomeDoador: this.nomeDoador,
      cpfDoador: this.cpfDoador,
      telefoneDoador: this.telefoneDoador,
      sexoDoador: this.sexoDoador,
      cidadeDoador: this.cidadeDoador,
      EstadoDoador: this.estadoDoador,
      pesoDoador: this.pesoDoador,
      alturaDoador: this.alturaDoador,
      dataNascimentoDoador: this.paraISO(this.dataNascimentoDoador),
      tipoSangue: this.tipoSangue,
      fatorRh: this.fatorRh,
      alergiasDoador: this.alergiasDoador || null,
      medicamentosDoador: this.medicamentosDoador || null,
      observacoes: this.observacoesDoador || null,
    };

    if (this.modoEdicao()) {
      this.service.atualizar(this.idEditando, dadosDoador).subscribe({
        next: (atualizado) => {
          this.carregarDoadores();
          this.showModal.set(false);
          this.modoEdicao.set(false);
          this.idEditando = '';
          this.limparCampos();
          this.mostrarToast(nomeSalvo || atualizado.nomeDoador, 'atualizado');
        },
        error: (err) => this.errosModal.set(this.parsearErro(err))
      });
    } else {
      this.service.criar(dadosDoador).subscribe({
        next: (criado) => {
          this.carregarDoadores();
          this.showModal.set(false);
          this.limparCampos();
          this.mostrarToast(nomeSalvo || criado.nomeDoador, 'cadastrado');
        },
        error: (err) => this.errosModal.set(this.parsearErro(err))
      });
    }
  }

  mostrarToast(nome: string, acao: string) {
    this.toast.set({ show: true, nome, acao });
    setTimeout(() => this.toast.set({ show: false, nome: '', acao: '' }), 5000);
  }

  fecharToast() {
    this.toast.set({ show: false, nome: '', acao: '' });
  }

  deletar(id: string) {
    if (confirm('Tem certeza que deseja remover este doador?')) {
      this.service.deletar(id).subscribe({
        next: () => this.carregarDoadores(),
        error: () => alert('Erro ao remover doador.')
      });
    }
  }
}
