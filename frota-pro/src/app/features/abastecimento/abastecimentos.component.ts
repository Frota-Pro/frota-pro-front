import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ToastService } from '../../shared/ui/toast/toast.service';

import { AbastecimentoApiService } from '../../core/api/abastecimento-api.service';
import { AbastecimentoRequest, AbastecimentoResponse } from '../../core/api/abastecimento-api.models';
import { CaminhaoApiService } from '../../core/api/caminhao-api.service';
import { CaminhaoResponse } from '../../core/api/caminhao-api.models';
import { MotoristaApiService } from '../../core/api/motorista-api.service';
import { MotoristaResponse } from '../../core/api/motorista-api.models';

type UUID = string;

type CombustivelValue =
  | 'DIESEL_S10'
  | 'DIESEL_S500'
  | 'DIESEL_COMUM'
  | 'GASOLINA_COMUM'
  | 'GASOLINA_ADITIVADA'
  | 'GASOLINA_PREMIUM'
  | 'ETANOL'
  | 'ETANOL_ADITIVADO'
  | 'GNV'
  | 'ARLA32'
  | 'ELETRICO'
  | 'HIBRIDO';

type PagamentoValue =
  | 'DINHEIRO'
  | 'CARTAO_DEBITO'
  | 'CARTAO_CREDITO'
  | 'PIX'
  | 'TRANSFERENCIA'
  | 'CHEQUE'
  | 'BOLETO'
  | 'VALE_COMBUSTIVEL'
  | 'CONVENIO'
  | 'FATURADO'
  | 'NOTA_DE_CREDITO'
  | 'OUTROS';

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

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

  // combos (AGORA IGUAL AOS ENUMS DA API)
  combustiveis: SelectOption<CombustivelValue>[] = [
    { value: 'DIESEL_S10', label: 'Diesel S-10' },
    { value: 'DIESEL_S500', label: 'Diesel S-500' },
    { value: 'DIESEL_COMUM', label: 'Diesel Comum' },
    { value: 'GASOLINA_COMUM', label: 'Gasolina Comum' },
    { value: 'GASOLINA_ADITIVADA', label: 'Gasolina Aditivada' },
    { value: 'GASOLINA_PREMIUM', label: 'Gasolina Premium' },
    { value: 'ETANOL', label: 'Etanol' },
    { value: 'ETANOL_ADITIVADO', label: 'Etanol Aditivado' },
    { value: 'GNV', label: 'Gás Natural Veicular' },
    { value: 'ARLA32', label: 'ARLA 32' },
    { value: 'ELETRICO', label: 'Elétrico' },
    { value: 'HIBRIDO', label: 'Híbrido' },
  ];

  formasPagamento: SelectOption<PagamentoValue>[] = [
    { value: 'DINHEIRO', label: 'Dinheiro' },
    { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
    { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
    { value: 'PIX', label: 'PIX' },
    { value: 'TRANSFERENCIA', label: 'Transferência Bancária' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'BOLETO', label: 'Boleto Bancário' },
    { value: 'VALE_COMBUSTIVEL', label: 'Vale Combustível' },
    { value: 'CONVENIO', label: 'Convênio' },
    { value: 'FATURADO', label: 'Faturado para Empresa' },
    { value: 'NOTA_DE_CREDITO', label: 'Nota de Crédito' },
    { value: 'OUTROS', label: 'Outros' },
  ];

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
    private toast: ToastService,
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
    if (!this.validarPeriodoPesquisa(true)) return;

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
  // ENUMS (labels)
  // =========================

  getCombustivelLabel(value?: string | null): string {
    if (!value) return '—';
    return this.combustiveis.find((x) => x.value === value)?.label ?? value;
  }

  getPagamentoLabel(value?: string | null): string {
    if (!value) return '—';
    return this.formasPagamento.find((x) => x.value === value)?.label ?? value;
  }

  private normalizeLegacyCombustivel(value?: string | null): CombustivelValue {
    const v = String(value || '').trim().toUpperCase();

    // compatibilidade com valores antigos do front
    if (v === 'DIESEL') return 'DIESEL_S10';
    if (v === 'GASOLINA') return 'GASOLINA_COMUM';

    const allowed = new Set(this.combustiveis.map((x) => x.value));
    return allowed.has(v as any) ? (v as CombustivelValue) : 'DIESEL_S10';
  }

  private normalizeLegacyPagamento(value?: string | null): PagamentoValue {
    const v = String(value || '').trim().toUpperCase();

    if (v === 'CARTAO') return 'CARTAO_CREDITO';

    const allowed = new Set(this.formasPagamento.map((x) => x.value));
    return allowed.has(v as any) ? (v as PagamentoValue) : 'DINHEIRO';
  }

  // =========================
  // VALIDAÇÕES
  // =========================

  private parseDateOnly(d: string): Date | null {
    if (!d) return null;
    const x = new Date(`${d}T00:00:00`);
    return isNaN(x.getTime()) ? null : x;
  }

  private validarPeriodoPesquisa(showToast = true): boolean {
    if (!this.filtroDataInicio || !this.filtroDataFim) return true;

    const ini = this.parseDateOnly(this.filtroDataInicio);
    const fim = this.parseDateOnly(this.filtroDataFim);

    if (!ini || !fim) return true;

    if (fim < ini) {
      if (showToast) this.toast.warn('A data final não pode ser menor que a data inicial.', 'Filtro de período');
      return false;
    }
    return true;
  }

  private validarCadastro(): boolean {
    if (!this.novo?.dtAbastecimento) {
      this.toast.warn('Informe a data/hora do abastecimento.', 'Validação');
      return false;
    }

    const caminhaoIdent = String(this.novo?.caminhao?.codigo || this.novo?.caminhao?.placa || '').trim();
    if (!caminhaoIdent) {
      this.toast.warn('Informe a placa ou o código do caminhão.', 'Validação');
      return false;
    }

    const tipo = String(this.novo?.tipoCombustivel || '').trim();
    if (!tipo) {
      this.toast.warn('Selecione o tipo de combustível.', 'Validação');
      return false;
    }
    const combustiveisSet = new Set(this.combustiveis.map((x) => x.value));
    if (!combustiveisSet.has(tipo as any)) {
      this.toast.error('Tipo de combustível inválido. Selecione uma opção válida.', 'Validação');
      return false;
    }

    const fp = String(this.novo?.formaPagamento || '').trim();
    const pagamentosSet = new Set(this.formasPagamento.map((x) => x.value));
    if (!fp || !pagamentosSet.has(fp as any)) {
      this.toast.warn('Selecione uma forma de pagamento válida.', 'Validação');
      return false;
    }

    const litros = Number(this.novo?.qtLitros);
    if (!Number.isFinite(litros) || litros <= 0) {
      this.toast.warn('Litros deve ser maior que zero.', 'Validação');
      return false;
    }

    const valorLitro = Number(this.novo?.valorLitro);
    if (!Number.isFinite(valorLitro) || valorLitro <= 0) {
      this.toast.warn('Valor/L deve ser maior que zero.', 'Validação');
      return false;
    }

    if (this.novo?.kmOdometro !== null && this.novo?.kmOdometro !== undefined && this.novo?.kmOdometro !== '') {
      const km = Number(this.novo?.kmOdometro);
      if (!Number.isFinite(km) || km < 0) {
        this.toast.warn('Odômetro não pode ser negativo.', 'Validação');
        return false;
      }
    }

    if (this.novo?.mediaKmLitro !== null && this.novo?.mediaKmLitro !== undefined && this.novo?.mediaKmLitro !== '') {
      const mk = Number(this.novo?.mediaKmLitro);
      if (!Number.isFinite(mk) || mk < 0) {
        this.toast.warn('Média km/L não pode ser negativa.', 'Validação');
        return false;
      }
    }

    const uf = String(this.novo?.uf || '').trim();
    if (uf && uf.length !== 2) {
      this.toast.warn('UF deve ter 2 letras (ex: PB).', 'Validação');
      return false;
    }

    return true;
  }

  // =========================
  // LISTAGEM (API)
  // =========================

  buscar(page: number = 0): void {
    if (!this.validarPeriodoPesquisa(true)) return;

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
      if (tipo && String(a.tipoCombustivel || '').toLowerCase() !== tipo) return false;

      if (caminhao) {
        const c1 = String(a.caminhao?.placa || '').toLowerCase();
        const c2 = String(a.caminhao?.codigo || '').toLowerCase();
        if (!c1.includes(caminhao) && !c2.includes(caminhao)) return false;
      }

      if (motorista) {
        const m1 = String(a.motorista?.nome || '').toLowerCase();
        const m2 = String(a.motorista?.codigo || '').toLowerCase();
        if (!m1.includes(motorista) && !m2.includes(motorista)) return false;
      }

      if (ini || fim) {
        const d = this.safeDate(a.dtAbastecimento);
        if (!d) return false;
        if (ini && d < ini) return false;
        if (fim && d > fim) return false;
      }

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
  // KPIs
  // =========================

  private get kpiBase(): AbastecimentoVM[] {
    return this.abastecimentosFiltrados || [];
  }

  get litersThisMonth(): number {
    const base = this.kpiBase;

    if (this.filtroDataInicio || this.filtroDataFim) {
      return base.reduce((acc, a) => acc + Number(a.qtLitros || 0), 0);
    }

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

        const kx = Number(x.kmOdometro ?? NaN);
        const ky = Number(y.kmOdometro ?? NaN);
        if (Number.isFinite(kx) && Number.isFinite(ky) && kx !== ky) return kx - ky;

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

    this.novo.codigo = a.codigo || '';
    this.novo.dtAbastecimento = this.toDatetimeLocal(a.dtAbastecimento);
    this.novo.tipoCombustivel = this.normalizeLegacyCombustivel(a.tipoCombustivel);

    this.novo.qtLitros = a.qtLitros ?? null;
    this.novo.valorLitro = a.valorLitro ?? null;
    this.novo.valorTotal = a.valorTotal ?? null;
    this.novo.kmOdometro = a.kmOdometro ?? null;

    this.novo.caminhao.placa = a.caminhao?.placa || '';
    this.novo.caminhao.codigo = a.caminhao?.codigo || '';

    this.novo.motorista.nome = a.motorista?.codigo || a.motorista?.nome || '';

    this.novo.formaPagamento = this.normalizeLegacyPagamento(a.formaPagamento);
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
    if (!this.validarCadastro()) return;

    const caminhaoIdent = String(this.novo?.caminhao?.codigo || this.novo?.caminhao?.placa || '').trim();

    const motoristaIdent = String(this.novo?.motorista?.nome || '').trim();

    const payload: AbastecimentoRequest = {
      caminhao: caminhaoIdent,
      motorista: motoristaIdent ? motoristaIdent : null,
      dtAbastecimento: this.normalizeDatetimeLocalToIso(this.novo.dtAbastecimento),

      kmOdometro: this.novo.kmOdometro ?? null,
      qtLitros: this.novo.qtLitros != null ? Number(this.novo.qtLitros) : null,
      valorLitro: this.novo.valorLitro != null ? Number(this.novo.valorLitro) : null,

      valorTotal: this.novo.valorTotal != null ? Number(this.novo.valorTotal) : null,

      tipoCombustivel: String(this.novo.tipoCombustivel),
      formaPagamento: String(this.novo.formaPagamento),

      posto: this.novo.posto || null,
      cidade: this.novo.cidade || null,
      uf: (this.novo.uf || null) ? String(this.novo.uf).trim().toUpperCase() : null,
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
          this.toast.success(this.isEditing ? 'Abastecimento atualizado.' : 'Abastecimento cadastrado.');
          this.buscar(0);
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Falha ao salvar abastecimento.');
        },
      });
  }

  deleteAbastecimento(id: string) {
    const item = (this.abastecimentos || []).find((x) => x.id === id);
    if (!item?.codigo) {
      this.toast.error('Não foi possível identificar o código do abastecimento para excluir.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este abastecimento?')) return;

    this.carregando = true;
    this.abastecimentoApi
      .deletar(item.codigo)
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: () => {
          this.toast.success('Abastecimento excluído.');
          this.buscar(0);
        },
        error: (err) => this.toast.error(err?.error?.message || 'Falha ao excluir abastecimento.'),
      });
  }

  private normalizeDatetimeLocalToIso(dtLocal: string): string {
    if (!dtLocal) return dtLocal;
    return dtLocal.length === 16 ? `${dtLocal}:00` : dtLocal;
  }

  private toDatetimeLocal(iso: string): string {
    if (!iso) return '';
    const dt = new Date(iso);
    if (isNaN(dt.getTime())) return '';
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  private nowAsDatetimeLocal(): string {
    const dt = new Date();
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  private novoVazio(): any {
    return {
      codigo: '',
      dtAbastecimento: '',
      tipoCombustivel: 'DIESEL_S10',
      qtLitros: null,
      valorLitro: null,
      valorTotal: null,
      kmOdometro: null,

      caminhao: { placa: '', codigo: '' },
      motorista: { nome: '' },

      formaPagamento: 'DINHEIRO',
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
