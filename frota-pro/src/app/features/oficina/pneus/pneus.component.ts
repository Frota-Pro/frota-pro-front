import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { PneuApiService } from '../../../core/api/pneu-api.service';
import { PneuRequest, PneuResponse, PneuVidaUtilResponse } from '../../../core/api/pneu-api.models';

type Alerta = 'TODOS' | 'OK' | 'PROXIMO_FIM' | 'VENCIDO';

@Component({
  selector: 'app-pneus',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pneus.component.html',
  styleUrls: ['./pneus.component.css'],
})
export class PneusComponent implements OnInit {

  q = '';
  statusFilter = 'TODOS';
  alertaFilter: Alerta = 'TODOS';

  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;

  loading = false;
  errorMsg: string | null = null;

  rows: PneuResponse[] = [];

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

  constructor(private api: PneuApiService, private router: Router) {}

  ngOnInit(): void {
    this.carregarPagina();
  }

  carregarPagina(page?: number): void {
    if (page != null) this.page = page;

    this.loading = true;
    this.errorMsg = null;

    const status = (this.statusFilter && this.statusFilter !== 'TODOS') ? this.statusFilter : undefined;
    const q = (this.q || '').trim() || undefined;

    this.api.listar({ q, status, page: this.page, size: this.size, sort: 'codigo,desc' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.totalPages = res.totalPages ?? 0;
          this.totalElements = res.totalElements ?? 0;
          this.rows = res.content ?? [];
          this.vidaMap = {};
          this.prefetchVidaUtil();
        },
        error: (err) => this.errorMsg = err?.error?.message || 'Erro ao carregar pneus.',
      });
  }

  aplicarFiltros(): void {
    this.page = 0;
    this.carregarPagina();
  }

  limparFiltros(): void {
    this.q = '';
    this.statusFilter = 'TODOS';
    this.alertaFilter = 'TODOS';
    this.aplicarFiltros();
  }

  abrirDetalhe(p: PneuResponse): void {
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

    if (!payload.kmMetaAtual || payload.kmMetaAtual <= 0) {
      alert('Informe a meta de KM (kmMetaAtual) do pneu (maior que zero).');
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
        error: (err) => this.errorMsg = err?.error?.message || 'Erro ao salvar pneu.',
      });
  }

  deletar(p: PneuResponse): void {
    if (!confirm(`Deseja excluir o pneu ${p.codigo}?`)) return;

    this.loading = true;
    this.errorMsg = null;

    this.api.deletar(p.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.carregarPagina(),
        error: (err) => this.errorMsg = err?.error?.message || 'Erro ao excluir pneu.',
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
