import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../../core/utils/api-error.util';
import { PneuApiService } from '../../../core/api/pneu-api.service';
import { PneuRequest, PneuResponse, PneuVidaUtilResponse } from '../../../core/api/pneu-api.models';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CaminhaoApiService } from '../../../core/api/caminhao-api.service';
import { CaminhaoResponse } from '../../../core/api/caminhao-api.models';

type Alerta = 'TODOS' | 'OK' | 'PROXIMO_FIM' | 'VENCIDO';
const PNEU_STATUS = ['ESTOQUE', 'EM_USO', 'EM_RECAPAGEM', 'DESCARTADO'] as const;
const MAX_CODIGO = 20;
const MAX_Q = 120;

@Component({
  selector: 'app-pneus',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pneus.component.html',
  styleUrls: ['./pneus.component.css'],
})
export class PneusComponent implements OnInit, OnDestroy {
  q = '';
  statusFilter = 'TODOS';
  alertaFilter: Alerta = 'TODOS';
  caminhaoFilter = '';

  // autocomplete do filtro de caminhão
  caminhoes: CaminhaoResponse[] = [];
  showSugFiltroCaminhao = false;
  readonly sugestoesMax = 8;
  private autocompleteBlurTimer: any = null;

  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;

  loading = false;
  errorMsg: string | null = null;

  rows: PneuResponse[] = [];
  private searchDebounceTimer?: number;
  private caminhaoDebounceTimer?: number;
  private lastSearchApplied = '';

  // cache de vida útil por código (para exibir barra e alerta na lista)
  vidaMap: Record<string, PneuVidaUtilResponse | undefined> = {};

  // Modal create/edit
  showModal = false;
  isEditing = false;
  editingCodigo: string | null = null;

  form: PneuRequest = {
    numeroSerie: '',
    marca: '',
    modelo: '',
    medida: '',
    nivelRecapagem: 0,
    status: 'ESTOQUE',
    kmMetaAtual: 0,
    dtCompra: null,
  };

  // confirmação de exclusão (modal estilizado, em vez do confirm() nativo)
  showDeleteConfirm = false;
  deleteAlvo: PneuResponse | null = null;
  deletando = false;

  constructor(
    private api: PneuApiService,
    private router: Router,
    private toast: ToastService,
    private caminhaoApi: CaminhaoApiService,
  ) {}

  ngOnInit(): void {
    this.preloadCombos();
    this.carregarPagina();
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      window.clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = undefined;
    }
    if (this.caminhaoDebounceTimer) {
      window.clearTimeout(this.caminhaoDebounceTimer);
      this.caminhaoDebounceTimer = undefined;
    }
    if (this.autocompleteBlurTimer) {
      clearTimeout(this.autocompleteBlurTimer);
      this.autocompleteBlurTimer = null;
    }
  }

  private preloadCombos(): void {
    this.caminhaoApi.listar({ page: 0, size: 200, sort: 'codigo,asc', ativo: true }).subscribe({
      next: (res) => (this.caminhoes = res.content || []),
      error: () => (this.caminhoes = []),
    });
  }

  carregarPagina(page?: number): void {
    if (page != null) this.page = page;

    if (this.q && this.q.length > MAX_Q) {
      this.toast.warn(`Busca deve ter no máximo ${MAX_Q} caracteres.`);
      return;
    }
    if (this.statusFilter !== 'TODOS' && !PNEU_STATUS.includes(this.statusFilter as any)) {
      this.toast.warn('Status inválido. Selecione um status válido.');
      return;
    }

    this.loading = true;
    this.errorMsg = null;

    const status = (this.statusFilter && this.statusFilter !== 'TODOS') ? this.statusFilter : undefined;
    const q = (this.q || '').trim() || undefined;
    const caminhao = (this.caminhaoFilter || '').trim() || undefined;
    this.lastSearchApplied = q || '';

    this.api.listar({ q, status, caminhao, page: this.page, size: this.size, sort: 'codigo,desc' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.totalPages = res.totalPages ?? 0;
          this.totalElements = res.totalElements ?? 0;
          this.rows = res.content ?? [];
          this.vidaMap = {};
          this.prefetchVidaUtil();
        },
        error: (err) => this.errorMsg = extrairMensagemErro(err, 'Erro ao carregar pneus.'),
      });
  }

  aplicarFiltros(): void {
    this.page = 0;
    this.carregarPagina();
  }

  onSearchChange(): void {
    if (this.searchDebounceTimer) {
      window.clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = window.setTimeout(() => {
      const current = (this.q || '').trim();
      if (current === this.lastSearchApplied) return;
      this.page = 0;
      this.carregarPagina();
    }, 350);
  }

  limparFiltros(): void {
    this.q = '';
    this.statusFilter = 'TODOS';
    this.alertaFilter = 'TODOS';
    this.caminhaoFilter = '';
    this.aplicarFiltros();
  }

  // ===== autocomplete do filtro de caminhão =====
  get sugestoesFiltroCaminhao(): CaminhaoResponse[] {
    const q = String(this.caminhaoFilter || '').trim().toLowerCase();
    if (!q) return [];

    return (this.caminhoes || [])
      .filter((c) => {
        const hay = [c.codigo, c.codigoExterno, c.placa, c.descricao]
          .map((x) => String(x || '').toLowerCase())
          .join(' | ');
        return hay.includes(q);
      })
      .slice(0, this.sugestoesMax);
  }

  onFocusFiltroCaminhao(): void {
    this.showSugFiltroCaminhao = true;
  }

  onCaminhaoFilterChange(): void {
    if (this.caminhaoDebounceTimer) window.clearTimeout(this.caminhaoDebounceTimer);
    this.caminhaoDebounceTimer = window.setTimeout(() => this.aplicarFiltros(), 350);
  }

  onBlurFiltroSugestao(): void {
    if (this.autocompleteBlurTimer) clearTimeout(this.autocompleteBlurTimer);
    this.autocompleteBlurTimer = setTimeout(() => (this.showSugFiltroCaminhao = false), 140);
  }

  selecionarFiltroCaminhao(c: CaminhaoResponse): void {
    this.caminhaoFilter = c.codigo || c.codigoExterno || '';
    this.showSugFiltroCaminhao = false;
    this.aplicarFiltros();
  }

  abrirDetalhe(p: PneuResponse): void {
    if (!p?.codigo) {
      this.toast.warn('Código do pneu é obrigatório.');
      return;
    }
    if (p.codigo.length > MAX_CODIGO) {
      this.toast.warn(`Código do pneu deve ter no máximo ${MAX_CODIGO} caracteres.`);
      return;
    }
    this.router.navigate(['/dashboard/pneus', p.codigo]);
  }

  trackByCodigo(_: number, item: PneuResponse): string {
    return item.codigo;
  }

  countStatus(status: string): number {
    return (this.rows || []).filter(r => r.status === status).length;
  }

  // ========= Vida útil na lista =========

  prefetchVidaUtil(): void {
    // Carrega vida útil apenas para pneus EM_USO
    const targets = this.rows.filter(r => r.status === 'EM_USO');
    for (const p of targets) {
      this.api.vidaUtil(p.codigo).subscribe({
        next: (v) => this.vidaMap[p.codigo] = v,
        error: () => { /* ignora para não travar a lista */ }
      });
    }
  }

  getPercent(codigo: string): number {
    const v = this.vidaMap[codigo];
    const p = Number(v?.percentualVida ?? 0);
    if (!Number.isFinite(p)) return 0;
    return Math.max(0, Math.min(1, p));
  }

  getAlerta(codigo: string): Alerta {
    const v = this.vidaMap[codigo];
    if (!v) return 'OK';
    const p = this.getPercent(codigo);
    if (p >= 1) return 'VENCIDO';
    if (p >= 0.85) return 'PROXIMO_FIM';
    return 'OK';
  }

  passaFiltroAlerta(p: PneuResponse): boolean {
    if (this.alertaFilter === 'TODOS') return true;

    // se não tiver vida, considera OK
    const a = this.getAlerta(p.codigo);
    if (this.alertaFilter === 'OK') return a === 'OK';
    if (this.alertaFilter === 'PROXIMO_FIM') return a === 'PROXIMO_FIM';
    if (this.alertaFilter === 'VENCIDO') return a === 'VENCIDO';
    return true;
  }

  // ========= Modal =========

  openNovo(): void {
    this.isEditing = false;
    this.editingCodigo = null;
    this.form = {
      numeroSerie: '',
      marca: '',
      modelo: '',
      medida: '',
      nivelRecapagem: 0,
      status: 'ESTOQUE',
      kmMetaAtual: 0,
      dtCompra: null,
    };
    this.showModal = true;
  }

  openEditar(p: PneuResponse): void {
    this.isEditing = true;
    this.editingCodigo = p.codigo;
    this.form = {
      numeroSerie: p.numeroSerie ?? '',
      marca: p.marca ?? '',
      modelo: p.modelo ?? '',
      medida: p.medida ?? '',
      nivelRecapagem: p.nivelRecapagem ?? 0,
      status: p.status,
      kmMetaAtual: Number(p.kmMetaAtual ?? 0),
      dtCompra: p.dtCompra ?? null,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  salvar(): void {
    const payload: PneuRequest = {
      numeroSerie: (this.form.numeroSerie || '').trim() || null,
      marca: (this.form.marca || '').trim() || null,
      modelo: (this.form.modelo || '').trim() || null,
      medida: (this.form.medida || '').trim() || null,
      nivelRecapagem: Number(this.form.nivelRecapagem ?? 0),
      status: this.form.status || 'ESTOQUE',
      kmMetaAtual: Number(this.form.kmMetaAtual ?? 0),
      dtCompra: this.form.dtCompra || null,
    };

    if (!PNEU_STATUS.includes(payload.status as any)) {
      this.toast.warn('Status do pneu inválido.');
      return;
    }
    if (!payload.kmMetaAtual || payload.kmMetaAtual <= 0) {
      this.toast.warn('Informe a meta de KM (kmMetaAtual) do pneu (maior que zero).');
      return;
    }
    if (this.isEditing && this.editingCodigo && this.editingCodigo.length > MAX_CODIGO) {
      this.toast.warn(`Código do pneu deve ter no máximo ${MAX_CODIGO} caracteres.`);
      return;
    }

    this.loading = true;
    this.errorMsg = null;

    const req$ = (this.isEditing && this.editingCodigo)
      ? this.api.atualizar(this.editingCodigo, payload)
      : this.api.criar(payload);

    req$
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => { this.closeModal(); this.carregarPagina(); },
        error: (err) => this.errorMsg = extrairMensagemErro(err, 'Erro ao salvar pneu.'),
      });
  }

  deletar(p: PneuResponse): void {
    if (!p?.codigo) {
      this.toast.warn('Código do pneu é obrigatório.');
      return;
    }
    if (p.codigo.length > MAX_CODIGO) {
      this.toast.warn(`Código do pneu deve ter no máximo ${MAX_CODIGO} caracteres.`);
      return;
    }
    this.deleteAlvo = p;
    this.showDeleteConfirm = true;
  }

  cancelarExclusao(): void {
    if (this.deletando) return;
    this.showDeleteConfirm = false;
    this.deleteAlvo = null;
  }

  confirmarExclusao(): void {
    const p = this.deleteAlvo;
    if (!p?.codigo) return;

    this.deletando = true;
    this.errorMsg = null;

    this.api.deletar(p.codigo)
      .pipe(finalize(() => (this.deletando = false)))
      .subscribe({
        next: () => {
          this.showDeleteConfirm = false;
          this.deleteAlvo = null;
          this.toast.success('Pneu excluído.');
          this.carregarPagina();
        },
        error: (err) => this.toast.error(extrairMensagemErro(err, 'Erro ao excluir pneu.')),
      });
  }

  // ========= Utils =========

  formatMoneyBRL(v?: number | null): string {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return 'R$ 0,00';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatKm(v?: number | null): string {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return '0 km';
    return `${n.toLocaleString('pt-BR')} km`;
  }
}
