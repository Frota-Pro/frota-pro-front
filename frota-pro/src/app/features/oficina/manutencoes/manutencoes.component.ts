import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ManutencaoApiService } from '../../../core/api/manutencao-api.service';
import { ManutencaoRequest, ManutencaoResponse, ManutencaoItemRequest } from '../../../core/api/manutencao-api.models';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CaminhaoApiService } from '../../../core/api/caminhao-api.service';
import { CaminhaoResponse } from '../../../core/api/caminhao-api.models';
import { OficinaApiService } from '../../../core/api/oficina-api.service';
import { OficinaResponse } from '../../../core/api/oficina-api.models';

type StatusManutencao = 'ABERTA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA' | string;
type TipoManutencao = 'PREVENTIVA' | 'CORRETIVA' | string;
type TipoItemManutencao = 'PECA' | 'SERVICO' | string;
const MAX_CODIGO = 50;

interface ManutencaoVM extends ManutencaoResponse {
  _inicio?: string; // yyyy-MM-dd
  _fim?: string;    // yyyy-MM-dd
}

type ParadaSugestao = {
  id: string;
  numeroCarga: string;
};

@Component({
  selector: 'app-manutencoes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './manutencoes.component.html',
  styleUrls: ['./manutencoes.component.css'],
})
export class ManutencoesComponent implements OnInit, OnDestroy {

  // filtros
  search = '';
  statusFilter: '' | StatusManutencao = '';
  tipoFilter: '' | TipoManutencao = '';
  dataInicio = '';
  dataFim = '';
  caminhaoFilter = '';

  // paginação
  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;

  // estado
  loading = false;
  errorMsg: string | null = null;

  // dados
  rows: ManutencaoVM[] = [];
  filtered: ManutencaoVM[] = [];
  caminhoes: CaminhaoResponse[] = [];
  oficinas: OficinaResponse[] = [];

  // modal
  showModal = false;
  isEditing = false;
  editingCodigo: string | null = null;

  // form
  form = this.emptyForm();

  // debounce
  private filtroTimer: any = null;
  private autocompleteBlurTimer: any = null;

  // autocomplete modal
  showSugManCaminhao = false;
  showSugManOficina = false;
  showSugManParada = false;
  readonly sugestoesMax = 8;

  constructor(
    private api: ManutencaoApiService,
    private caminhaoApi: CaminhaoApiService,
    private oficinaApi: OficinaApiService,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.preloadCombos();
    this.setPeriodoMesAtual();
    this.carregarPagina();
  }

  ngOnDestroy(): void {
    if (this.filtroTimer) {
      clearTimeout(this.filtroTimer);
      this.filtroTimer = null;
    }
    this.resetAutoComplete();
  }

  setPeriodoMesAtual(): void {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    this.dataInicio = first.toISOString().slice(0, 10);
    this.dataFim = last.toISOString().slice(0, 10);
  }

  scheduleBuscar(): void {
    if (this.filtroTimer) clearTimeout(this.filtroTimer);
    this.filtroTimer = setTimeout(() => {
      this.page = 0;
      this.carregarPagina();
    }, 350);
  }

  carregarPagina(page?: number): void {
    if (page != null) this.page = page;

    if (!this.dataInicio || !this.dataFim) {
      this.toast.warn('Informe início e fim para buscar manutenções.');
      return;
    }
    if (this.caminhaoFilter && this.caminhaoFilter.length > MAX_CODIGO) {
      this.toast.warn(`Código do caminhão deve ter no máximo ${MAX_CODIGO} caracteres.`);
      return;
    }

    this.loading = true;
    this.errorMsg = null;

    // Se seu back não tiver filtros na rota /manutencao, ainda funciona:
    // a gente busca paginado e filtra local.
    this.api.listar({
      page: this.page,
      size: this.size,
      sort: 'dataInicioManutencao,desc',
      q: this.search || null,
      inicio: this.dataInicio || null,
      fim: this.dataFim || null,
      status: this.statusFilter || null,
      tipo: this.tipoFilter || null,
      caminhao: this.caminhaoFilter || null,
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.totalPages = res.totalPages ?? 0;
          this.totalElements = res.totalElements ?? 0;

          this.rows = (res.content ?? []).map(r => ({
            ...r,
            _inicio: (r.dataInicioManutencao || '')?.slice(0, 10),
            _fim: (r.dataFimManutencao || '')?.slice(0, 10),
          }));

          this.applyLocalFilter();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message || 'Erro ao carregar manutenções.';
        },
      });
  }

  applyLocalFilter(): void {
    const q = (this.search || '').trim().toLowerCase();
    const st = (this.statusFilter || '').trim();
    const tp = (this.tipoFilter || '').trim();
    const di = this.dataInicio || '';
    const df = this.dataFim || '';
    const cam = (this.caminhaoFilter || '').trim().toLowerCase();

    this.filtered = this.rows.filter(r => {
      const blob = [
        r.codigo,
        r.descricao,
        r.codigoCaminhao,
        r.caminhao,
        r.codigoOficina,
        r.oficina,
        r.parada?.numeroCarga,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (q && !blob.includes(q)) return false;
      if (cam && !blob.includes(cam)) return false;
      if (st && (r.statusManutencao || '') !== st) return false;
      if (tp && (r.tipoManutencao || '') !== tp) return false;

      if (di && (!r._inicio || r._inicio < di)) return false;
      if (df && (!r._inicio || r._inicio > df)) return false;

      return true;
    });
  }

  abrirDetalhe(m: ManutencaoVM): void {
    this.router.navigate(['/dashboard/manutencoes', m.codigo]);
  }

  // ====== modal ======

  openNovaManutencao(): void {
    this.isEditing = false;
    this.editingCodigo = null;
    this.form = this.emptyForm();
    this.resetAutoComplete();
    this.showModal = true;
  }

  openEditar(m: ManutencaoVM): void {
    this.isEditing = true;
    this.editingCodigo = m.codigo;

    this.form = this.emptyForm();
    this.form.descricao = m.descricao || '';
    this.form.caminhao = m.codigoCaminhao || '';
    this.form.oficina = m.codigoOficina || '';
    this.form.tipoManutencao = m.tipoManutencao || 'CORRETIVA';
    this.form.statusManutencao = m.statusManutencao || 'ABERTA';
    this.form.dataInicioManutencao = (m.dataInicioManutencao || '').slice(0, 10);
    this.form.dataFimManutencao = (m.dataFimManutencao || '').slice(0, 10);
    this.form.observacoes = m.observacoes || '';
    this.form.paradaId = m.parada?.id || '';

    // itens
    this.form.itens = (m.itens || []).map(i => ({
      tipo: i.tipo,
      descricao: i.descricao,
      quantidade: Number(i.quantidade || 0),
      valorUnitario: Number(i.valorUnitario || 0),
    }));

    if (!this.form.itens?.length) {
      this.form.itens = [this.emptyItem()];
    }

    this.recalcularTotal();
    this.resetAutoComplete();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingCodigo = null;
    this.form = this.emptyForm();
    this.resetAutoComplete();
  }

  emptyItem(): ManutencaoItemRequest {
    return { tipo: 'SERVICO', descricao: '', quantidade: 1, valorUnitario: 0 };
  }

  emptyForm(): ManutencaoRequest {
    return {
      descricao: '',
      dataInicioManutencao: new Date().toISOString().slice(0, 10),
      dataFimManutencao: null,
      tipoManutencao: 'CORRETIVA',
      statusManutencao: 'ABERTA',
      caminhao: '',
      oficina: '',
      paradaId: '',
      observacoes: '',
      itens: [this.emptyItem()],
      valor: 0,
    };
  }

  addItem(): void {
    this.form.itens = this.form.itens || [];
    this.form.itens.push(this.emptyItem());
    this.recalcularTotal();
  }

  removeItem(idx: number): void {
    this.form.itens = this.form.itens || [];
    if (this.form.itens.length <= 1) return;
    this.form.itens.splice(idx, 1);
    this.recalcularTotal();
  }

  onItemChange(): void {
    this.recalcularTotal();
  }

  recalcularTotal(): void {
    const itens = (this.form.itens || [])
      .filter(i => (i.descricao || '').trim().length > 0);

    let total = 0;
    for (const it of itens) {
      const qtd = Number(it.quantidade || 0);
      const v = Number(it.valorUnitario || 0);
      total += (qtd * v);
    }
    this.form.valor = total;
  }

  salvar(): void {
    if (!this.form.descricao || !this.form.descricao.trim()) {
      this.toast.warn('Informe a descrição.');
      return;
    }
    if (!this.form.caminhao || !this.form.caminhao.trim()) {
      this.toast.warn('Informe o código do caminhão.');
      return;
    }
    if (this.form.caminhao.trim().length > MAX_CODIGO) {
      this.toast.warn(`Código do caminhão deve ter no máximo ${MAX_CODIGO} caracteres.`);
      return;
    }
    if (!this.form.oficina || !this.form.oficina.trim()) {
      this.toast.warn('Informe o código da oficina.');
      return;
    }
    if (this.form.oficina.trim().length > MAX_CODIGO) {
      this.toast.warn(`Código da oficina deve ter no máximo ${MAX_CODIGO} caracteres.`);
      return;
    }
    if (!this.form.dataInicioManutencao) {
      this.toast.warn('Informe a data de início.');
      return;
    }
    if (this.isEditing && this.editingCodigo && this.editingCodigo.length > MAX_CODIGO) {
      this.toast.warn(`Código da manutenção deve ter no máximo ${MAX_CODIGO} caracteres.`);
      return;
    }

    // normaliza
    const payload: ManutencaoRequest = {
      ...this.form,
      oficina: this.form.oficina?.trim() ? this.form.oficina.trim() : null,
      paradaId: this.form.paradaId?.trim() ? this.form.paradaId.trim() : null,
      dataFimManutencao: this.form.dataFimManutencao?.trim() ? this.form.dataFimManutencao : null,
      itens: (this.form.itens || []).map(i => ({
        tipo: (i.tipo || 'SERVICO') as TipoItemManutencao,
        descricao: i.descricao,
        quantidade: Number(i.quantidade || 0),
        valorUnitario: Number(i.valorUnitario || 0),
      })),
      valor: Number(this.form.valor || 0),
    };

    this.loading = true;
    this.errorMsg = null;

    const req$ = (this.isEditing && this.editingCodigo)
      ? this.api.atualizar(this.editingCodigo, payload)
      : this.api.criar(payload);

    req$.pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.closeModal();
          this.carregarPagina();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message || 'Erro ao salvar manutenção.';
        }
      });
  }

  deletar(m: ManutencaoVM): void {
    if (!m?.codigo) {
      this.toast.warn('Código da manutenção é obrigatório.');
      return;
    }
    if (m.codigo.length > MAX_CODIGO) {
      this.toast.warn(`Código da manutenção deve ter no máximo ${MAX_CODIGO} caracteres.`);
      return;
    }
    const ok = confirm(`Deseja excluir a manutenção ${m.codigo}?`);
    if (!ok) return;

    this.loading = true;
    this.errorMsg = null;

    this.api.deletar(m.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.carregarPagina(),
        error: (err) => {
          this.errorMsg = err?.error?.message || 'Erro ao excluir manutenção.';
        },
      });
  }

  formatMoneyBRL(v?: number | null): string {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return 'R$ 0,00';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // ===== autocomplete =====
  get sugestoesManCaminhao(): CaminhaoResponse[] {
    const q = String(this.form.caminhao || '').trim().toLowerCase();
    if (!q) return [];

    return (this.caminhoes || [])
      .filter((c) => c.ativo !== false)
      .filter((c) => {
        const hay = [c.codigo, c.codigoExterno, c.placa, c.descricao, c.marca, c.modelo]
          .map((x) => String(x || '').toLowerCase())
          .join(' | ');
        return hay.includes(q);
      })
      .slice(0, this.sugestoesMax);
  }

  get sugestoesManOficina(): OficinaResponse[] {
    const q = String(this.form.oficina || '').trim().toLowerCase();
    if (!q) return [];

    return (this.oficinas || [])
      .filter((o) => {
        const hay = [o.codigo, o.nome]
          .map((x) => String(x || '').toLowerCase())
          .join(' | ');
        return hay.includes(q);
      })
      .slice(0, this.sugestoesMax);
  }

  get sugestoesManParada(): ParadaSugestao[] {
    const q = String(this.form.paradaId || '').trim().toLowerCase();
    if (!q) return [];

    return this.paradasIndex
      .filter((p) => {
        const hay = [p.id, p.numeroCarga].join(' | ').toLowerCase();
        return hay.includes(q);
      })
      .slice(0, this.sugestoesMax);
  }

  onFocusManCaminhao(): void {
    this.closeAllSugestoes();
    this.showSugManCaminhao = true;
  }

  onFocusManOficina(): void {
    this.closeAllSugestoes();
    this.showSugManOficina = true;
  }

  onFocusManParada(): void {
    this.closeAllSugestoes();
    this.showSugManParada = true;
  }

  onBlurManSugestao(): void {
    if (this.autocompleteBlurTimer) clearTimeout(this.autocompleteBlurTimer);
    this.autocompleteBlurTimer = setTimeout(() => this.closeAllSugestoes(), 140);
  }

  selectManCaminhao(c: CaminhaoResponse): void {
    this.form.caminhao = c.codigo || c.codigoExterno || '';
    this.closeAllSugestoes();
  }

  selectManOficina(o: OficinaResponse): void {
    this.form.oficina = o.codigo || '';
    this.closeAllSugestoes();
  }

  selectManParada(p: ParadaSugestao): void {
    this.form.paradaId = p.id;
    this.closeAllSugestoes();
  }

  private get paradasIndex(): ParadaSugestao[] {
    const uniq = new Map<string, ParadaSugestao>();

    for (const r of this.rows || []) {
      const id = String(r.parada?.id || '').trim();
      if (!id) continue;
      if (!uniq.has(id)) {
        uniq.set(id, {
          id,
          numeroCarga: String(r.parada?.numeroCarga || '').trim() || '-',
        });
      }
    }

    return Array.from(uniq.values());
  }

  private preloadCombos(): void {
    this.caminhaoApi.listar({ page: 0, size: 200, sort: 'codigo,asc', ativo: true }).subscribe({
      next: (res) => (this.caminhoes = res.content || []),
      error: () => (this.caminhoes = []),
    });
    this.oficinaApi.listar({ page: 0, size: 200, sort: 'codigo,asc' }).subscribe({
      next: (res) => (this.oficinas = res.content || []),
      error: () => (this.oficinas = []),
    });
  }

  private closeAllSugestoes(): void {
    this.showSugManCaminhao = false;
    this.showSugManOficina = false;
    this.showSugManParada = false;
  }

  private resetAutoComplete(): void {
    this.closeAllSugestoes();
    if (this.autocompleteBlurTimer) {
      clearTimeout(this.autocompleteBlurTimer);
      this.autocompleteBlurTimer = null;
    }
  }
}
