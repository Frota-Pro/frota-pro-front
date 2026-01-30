import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { AbastecimentoApiService } from '../../core/api/abastecimento-api.service';
import { AbastecimentoRequest, AbastecimentoResponse } from '../../core/api/abastecimento-api.models';
import { CaminhaoApiService } from '../../core/api/caminhao-api.service';
import { CaminhaoResponse } from '../../core/api/caminhao-api.models';
import { MotoristaApiService } from '../../core/api/motorista-api.service';
import { MotoristaResponse } from '../../core/api/motorista-api.models';

type UUID = string;

type TipoCombustivel = 'DIESEL' | 'GASOLINA' | 'ETANOL' | 'DIESEL_S10' | 'GNV' | string;
type FormaPagamento = 'DINHEIRO' | 'CARTAO' | 'PIX' | 'BOLETO' | 'TRANSFERENCIA' | string;

interface AbastecimentoVM {
  id: UUID;
  codigo: string;
  dtAbastecimento: string; // ISO

  caminhao: {
    codigo?: string | null;
    placa?: string | null;
  };

  motorista?: {
    codigo?: string | null;
    nome?: string | null;
  } | null;

  kmOdometro?: number | null;
  qtLitros?: number | null;
  valorLitro?: number | null;
  valorTotal?: number | null;
  mediaKmLitro?: number | null;

  tipoCombustivel?: string | null;
  formaPagamento?: string | null;

  posto?: string | null;
  cidade?: string | null;
  uf?: string | null;

  numNotaOuCupom?: string | null;
}

@Component({
  selector: 'app-abastecimentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './abastecimentos.component.html',
  styleUrls: ['./abastecimentos.component.css'],
})
export class AbastecimentosComponent implements OnInit {
  // filtros
  searchTerm: string = '';
  filtroTipo: string = '';
  filtroCaminhao: string = '';
  filtroMotorista: string = '';
  filtroDataInicio: string = '';
  filtroDataFim: string = '';

  // expand
  expanded: string | null = null;

  // modal
  showAddModal = false;
  isEditing = false;
  editingCodigo: string | null = null; // (back usa "codigo" no PUT)

  // combos
  combustiveis: TipoCombustivel[] = ['DIESEL', 'DIESEL_S10', 'GASOLINA', 'ETANOL', 'GNV'];
  formasPagamento: FormaPagamento[] = ['DINHEIRO', 'CARTAO', 'PIX', 'BOLETO', 'TRANSFERENCIA'];

  caminhoes: CaminhaoResponse[] = [];
  motoristas: MotoristaResponse[] = [];

  // listagem
  carregando = false;
  erro: string | null = null;

  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;

  abastecimentos: AbastecimentoVM[] = [];

  // debounce para disparar buscar() quando filtros mudarem
  private filtroTimer: any = null;

  // form (modal) -> exatamente como seu HTML espera
  novo: any = this.novoVazio();

  constructor(
    private abastecimentoApi: AbastecimentoApiService,
    private caminhaoApi: CaminhaoApiService,
    private motoristaApi: MotoristaApiService,
  ) {}

  ngOnInit(): void {
    this.preloadCombos();
    this.buscar();
  }

  /**
   * Dispara a busca no BACK sempre que um filtro muda (com debounce).
   * Evita ficar chamando a API a cada tecla.
   */
  scheduleBuscar(): void {
    if (this.filtroTimer) clearTimeout(this.filtroTimer);
    this.filtroTimer = setTimeout(() => {
      this.buscar(0);
    }, 350);
  }

  private preloadCombos(): void {
    // carrega alguns itens (não depende disso para salvar, só ajuda a mapear nome etc.)
    this.caminhaoApi.listar({ page: 0, size: 200, sort: 'codigo,asc', ativo: true }).subscribe({
      next: (res) => (this.caminhoes = res.content || []),
      error: () => (this.caminhoes = []),
    });

    this.motoristaApi.listar({ page: 0, size: 200, sort: 'codigo,asc', ativo: true }).subscribe({
      next: (res) => (this.motoristas = res.content || []),
      error: () => (this.motoristas = []),
    });
  }

  // =========================
  // LISTAGEM (API)
  // =========================

  buscar(page: number = 0): void {
    this.page = page;
    this.carregando = true;
    this.erro = null;

    const q = this.searchTerm?.trim() ? this.searchTerm.trim() : null;
    const motorista = this.filtroMotorista?.trim() ? this.filtroMotorista.trim() : null;

    const inicio = this.filtroDataInicio ? `${this.filtroDataInicio}T00:00:00` : null;
    const fim = this.filtroDataFim ? `${this.filtroDataFim}T23:59:59` : null;

    this.abastecimentoApi
      .filtrar({
        q,
        caminhao: this.filtroCaminhao?.trim() || null,
        motorista,
        tipo: this.filtroTipo || null,
        inicio,
        fim,
        page: this.page,
        size: this.size,
        sort: 'dtAbastecimento,desc',
      })
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (res) => {
          this.totalPages = res.totalPages ?? 0;
          this.totalElements = res.totalElements ?? 0;
          this.abastecimentos = (res.content || []).map((a) => this.toVM(a));
        },
        error: (err) => {
          this.erro = err?.error?.message || 'Falha ao carregar abastecimentos.';
          this.abastecimentos = [];
        },
      });
  }

  limparFiltros(): void {
    this.searchTerm = '';
    this.filtroTipo = '';
    this.filtroCaminhao = '';
    this.filtroMotorista = '';
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
    this.buscar(0);
  }

  private toVM(a: AbastecimentoResponse): AbastecimentoVM {
    const motoristaNome =
      this.motoristas.find((m) => m.codigo === a.motoristaCodigo)?.nome
      ?? this.motoristas.find((m) => m.codigoExterno === a.motoristaCodigo)?.nome
      ?? null;

    return {
      id: a.id,
      codigo: a.codigo,
      dtAbastecimento: a.dtAbastecimento,

      caminhao: {
        codigo: a.caminhaoCodigo ?? null,
        placa: a.caminhaoPlaca ?? null,
      },

      motorista: a.motoristaCodigo
        ? { codigo: a.motoristaCodigo ?? null, nome: motoristaNome }
        : null,

      kmOdometro: a.kmOdometro ?? null,
      qtLitros: a.qtLitros ?? null,
      valorLitro: a.valorLitro ?? null,
      valorTotal: a.valorTotal ?? null,
      mediaKmLitro: a.mediaKmLitro ?? null,

      tipoCombustivel: a.tipoCombustivel ?? null,
      formaPagamento: a.formaPagamento ?? null,

      posto: a.posto ?? null,
      cidade: a.cidade ?? null,
      uf: a.uf ?? null,

      numNotaOuCupom: a.numNotaOuCupom ?? null,
    };
  }

  // =========================
  // FILTRO LOCAL (mantém HTML usando abastecimentosFiltrados)
  // =========================

  get abastecimentosFiltrados(): AbastecimentoVM[] {
    const term = (this.searchTerm || '').trim().toLowerCase();
    const tipo = (this.filtroTipo || '').trim().toLowerCase();
    const caminhao = (this.filtroCaminhao || '').trim().toLowerCase();
    const motorista = (this.filtroMotorista || '').trim().toLowerCase();

    const ini = this.filtroDataInicio ? new Date(`${this.filtroDataInicio}T00:00:00`) : null;
    const fim = this.filtroDataFim ? new Date(`${this.filtroDataFim}T23:59:59`) : null;

    return (this.abastecimentos || []).filter((a) => {
      // tipo
      if (tipo && String(a.tipoCombustivel || '').toLowerCase() !== tipo) return false;

      // caminhao (placa/codigo)
      if (caminhao) {
        const c1 = String(a.caminhao?.placa || '').toLowerCase();
        const c2 = String(a.caminhao?.codigo || '').toLowerCase();
        if (!c1.includes(caminhao) && !c2.includes(caminhao)) return false;
      }

      // motorista (nome/codigo)
      if (motorista) {
        const m1 = String(a.motorista?.nome || '').toLowerCase();
        const m2 = String(a.motorista?.codigo || '').toLowerCase();
        if (!m1.includes(motorista) && !m2.includes(motorista)) return false;
      }

      // data
      if (ini || fim) {
        const d = this.safeDate(a.dtAbastecimento);
        if (!d) return false;
        if (ini && d < ini) return false;
        if (fim && d > fim) return false;
      }

      // term geral
      if (term) {
        const hay = [
          a.codigo,
          a.tipoCombustivel,
          a.formaPagamento,
          a.posto,
          a.cidade,
          a.uf,
          a.numNotaOuCupom,
          a.caminhao?.placa,
          a.caminhao?.codigo,
          a.motorista?.nome,
          a.motorista?.codigo,
        ]
          .map((x) => String(x || '').toLowerCase())
          .join(' | ');

        if (!hay.includes(term)) return false;
      }

      return true;
    });
  }

  private safeDate(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  // =========================
  // KPIs (sempre respeitam os filtros do usuário)
  // =========================

  private get kpiBase(): AbastecimentoVM[] {
    return this.abastecimentosFiltrados || [];
  }

  get litersThisMonth(): number {
    const base = this.kpiBase;

    // Se o usuário definiu período, o KPI vira "litros no período".
    if (this.filtroDataInicio || this.filtroDataFim) {
      return base.reduce((acc, a) => acc + Number(a.qtLitros || 0), 0);
    }

    // Caso contrário mantém a ideia do card: "litros do mês atual" (mas respeitando os demais filtros)
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return base
      .filter((a) => {
        const d = this.safeDate(a.dtAbastecimento);
        return !!d && d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((acc, a) => acc + Number(a.qtLitros || 0), 0);
  }

  get totalSpent(): number {
    return this.kpiBase.reduce((acc, a) => acc + Number(a.valorTotal || 0), 0);
  }

  get avgPricePerLiter(): number {
    const litros = this.kpiBase.reduce((acc, a) => acc + Number(a.qtLitros || 0), 0);
    if (!litros) return 0;
    return this.totalSpent / litros;
  }

  get avgConsumption(): number {
    return this.calcAvgConsumption(this.kpiBase);
  }

  /**
   * Consumo médio (km/L): calcula por diferença de odômetro entre abastecimentos consecutivos.
   * - Agrupa por caminhão
   * - Ordena por data
   * - Soma km rodado e litros do abastecimento "atual" (o que reabasteceu)
   * - Fallback: usa média simples do mediaKmLitro do back quando existir
   */
  private calcAvgConsumption(items: AbastecimentoVM[]): number {
    if (!items?.length) return 0;

    const byTruck = new Map<string, AbastecimentoVM[]>();
    for (const a of items) {
      const key = String(a.caminhao?.codigo || a.caminhao?.placa || '—');
      if (!byTruck.has(key)) byTruck.set(key, []);
      byTruck.get(key)!.push(a);
    }

    let totalKm = 0;
    let totalLitros = 0;

    for (const arr of byTruck.values()) {
      const sorted = [...arr].sort((x, y) => {
        const tx = this.safeDate(x.dtAbastecimento)?.getTime() ?? 0;
        const ty = this.safeDate(y.dtAbastecimento)?.getTime() ?? 0;
        if (tx !== ty) return tx - ty;

        // desempate 1: odômetro (se ambos existirem)
        const kx = Number(x.kmOdometro ?? NaN);
        const ky = Number(y.kmOdometro ?? NaN);
        if (Number.isFinite(kx) && Number.isFinite(ky) && kx !== ky) return kx - ky;

        // desempate 2: código/id (mantém ordenação estável)
        return String(x.codigo || '').localeCompare(String(y.codigo || ''));
      });

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const cur = sorted[i];

        const kmPrev = Number(prev.kmOdometro ?? NaN);
        const kmCur = Number(cur.kmOdometro ?? NaN);
        const litrosCur = Number(cur.qtLitros ?? 0);

        if (!Number.isFinite(kmPrev) || !Number.isFinite(kmCur)) continue;
        const delta = kmCur - kmPrev;
        if (delta <= 0) continue;
        if (litrosCur <= 0) continue;

        totalKm += delta;
        totalLitros += litrosCur;
      }
    }

    if (totalLitros > 0) return totalKm / totalLitros;

    // fallback: quando não dá pra calcular por odômetro, tenta usar o campo do back
    const vals = items.map((a) => Number(a.mediaKmLitro || 0)).filter((x) => x > 0);
    if (!vals.length) return 0;
    return vals.reduce((acc, x) => acc + x, 0) / vals.length;
  }

  // =========================
  // EXPAND
  // =========================

  toggleExpand(id: UUID) {
    this.expanded = this.expanded === id ? null : id;
  }

  isExpanded(id: UUID) {
    return this.expanded === id;
  }

  trackById(index: number, item: AbastecimentoVM) {
    return item.id;
  }

  // =========================
  // MODAL / CRUD
  // =========================

  openAddModal() {
    this.isEditing = false;
    this.editingCodigo = null;

    this.novo = this.novoVazio();
    this.novo.dtAbastecimento = this.nowAsDatetimeLocal(); // datetime-local

    this.showAddModal = true;
  }

  openEditModal(a: AbastecimentoVM) {
    this.isEditing = true;
    this.editingCodigo = a.codigo; // PUT usa /{codigo}

    this.novo = this.novoVazio();

    // codigo existe no template (required). No back ele não existe no request (não tem problema).
    this.novo.codigo = a.codigo || '';
    this.novo.dtAbastecimento = this.toDatetimeLocal(a.dtAbastecimento);
    this.novo.tipoCombustivel = a.tipoCombustivel || 'DIESEL';

    this.novo.qtLitros = a.qtLitros ?? null;
    this.novo.valorLitro = a.valorLitro ?? null;
    this.novo.valorTotal = a.valorTotal ?? null;
    this.novo.kmOdometro = a.kmOdometro ?? null;

    this.novo.caminhao.placa = a.caminhao?.placa || '';
    this.novo.caminhao.codigo = a.caminhao?.codigo || '';

    // HTML usa novo.motorista.nome (mantive assim)
    this.novo.motorista.nome = a.motorista?.codigo || a.motorista?.nome || '';

    this.novo.formaPagamento = a.formaPagamento || 'CARTAO';
    this.novo.posto = a.posto || '';
    this.novo.cidade = a.cidade || '';
    this.novo.uf = a.uf || '';
    this.novo.numNotaOuCupom = a.numNotaOuCupom || '';
    this.novo.mediaKmLitro = a.mediaKmLitro ?? null;

    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  saveAbastecimento() {
    if (!this.novo.dtAbastecimento) {
      alert('Informe a data/hora.');
      return;
    }

    // caminhão: no HTML tem placa e código -> a API espera um identificador (codigo/codigoExterno/placa)
    const caminhaoIdent = String(this.novo?.caminhao?.codigo || this.novo?.caminhao?.placa || '').trim();
    if (!caminhaoIdent) {
      alert('Informe a placa ou o código do caminhão.');
      return;
    }

    // motorista: HTML usa "novo.motorista.nome" (mantive), mas a API espera codigo/codigoExterno
    const motoristaIdent = String(this.novo?.motorista?.nome || '').trim();

    const payload: AbastecimentoRequest = {
      caminhao: caminhaoIdent,
      motorista: motoristaIdent ? motoristaIdent : null,
      dtAbastecimento: this.normalizeDatetimeLocalToIso(this.novo.dtAbastecimento),

      kmOdometro: this.novo.kmOdometro ?? null,
      qtLitros: this.novo.qtLitros != null ? Number(this.novo.qtLitros) : null,
      valorLitro: this.novo.valorLitro != null ? Number(this.novo.valorLitro) : null,

      // se não vier, o back calcula (qtLitros * valorLitro)
      valorTotal: this.novo.valorTotal != null ? Number(this.novo.valorTotal) : null,

      tipoCombustivel: String(this.novo.tipoCombustivel),
      formaPagamento: String(this.novo.formaPagamento),

      posto: this.novo.posto || null,
      cidade: this.novo.cidade || null,
      uf: this.novo.uf || null,
      numNotaOuCupom: this.novo.numNotaOuCupom || null,
    };

    this.carregando = true;

    const req$ =
      this.isEditing && this.editingCodigo
        ? this.abastecimentoApi.atualizar(this.editingCodigo, payload)
        : this.abastecimentoApi.criar(payload);

    req$
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: () => {
          this.closeAddModal();
          this.buscar(0);
        },
        error: (err) => {
          alert(err?.error?.message || 'Falha ao salvar abastecimento.');
        },
      });
  }

  /**
   * HTML chama deleteAbastecimento(a.id)
   * Porém o BACK deleta por {codigo}
   * Então resolvemos aqui: recebe ID -> encontra o item -> deleta pelo codigo
   */
  deleteAbastecimento(id: string) {
    const item = (this.abastecimentos || []).find((x) => x.id === id);
    if (!item?.codigo) {
      alert('Não foi possível identificar o código do abastecimento para excluir.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este abastecimento?')) return;

    this.carregando = true;
    this.abastecimentoApi
      .deletar(item.codigo)
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: () => this.buscar(0),
        error: (err) => alert(err?.error?.message || 'Falha ao excluir abastecimento.'),
      });
  }

  private normalizeDatetimeLocalToIso(dtLocal: string): string {
    // input: yyyy-MM-ddTHH:mm
    if (!dtLocal) return dtLocal;
    return dtLocal.length === 16 ? `${dtLocal}:00` : dtLocal; // yyyy-MM-ddTHH:mm:ss
  }

  private toDatetimeLocal(iso: string): string {
    // iso: yyyy-MM-ddTHH:mm:ss (ou com timezone)
    if (!iso) return '';
    // Se vier com timezone, Date() pode ajustar; aqui queremos somente "texto" local para o input
    // então tentamos manter a parte inicial "yyyy-MM-ddTHH:mm"
    const base = String(iso).slice(0, 16);
    return base;
  }

  private nowAsDatetimeLocal(): string {
    const dt = new Date();
    // converte para "local" (sem Z) no padrão do datetime-local
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  }

  private novoVazio(): any {
    return {
      codigo: '',
      dtAbastecimento: '',
      tipoCombustivel: 'DIESEL',
      qtLitros: null,
      valorLitro: null,
      valorTotal: null,
      kmOdometro: null,

      caminhao: { placa: '', codigo: '' },
      motorista: { nome: '' },

      formaPagamento: 'CARTAO',
      posto: '',
      cidade: '',
      uf: '',
      numNotaOuCupom: '',
      mediaKmLitro: null,
    };
  }

  // =========================
  // PAGINAÇÃO
  // =========================

  prevPage(): void {
    if (this.page <= 0) return;
    this.buscar(this.page - 1);
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.buscar(this.page + 1);
  }
}
