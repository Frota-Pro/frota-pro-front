import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { OficinaApiService } from '../../../core/api/oficina-api.service';
import { OficinaRequest, OficinaResponse } from '../../../core/api/oficina-api.models';
import { ToastService } from '../../../shared/ui/toast/toast.service';

const MAX_CODIGO = 50;

@Component({
  selector: 'app-oficinas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './oficinas.component.html',
  styleUrls: ['./oficinas.component.css'],
})
export class OficinasComponent implements OnInit, OnDestroy {

  search = '';

  // paginação
  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;

  loading = false;
  errorMsg: string | null = null;

  rows: OficinaResponse[] = [];
  filtered: OficinaResponse[] = [];

  // modal
  showModal = false;
  isEditing = false;
  editingCodigo: string | null = null;

  form: OficinaRequest = { nome: '' };

  private filtroTimer: any = null;

  constructor(
    private api: OficinaApiService,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.carregarPagina();
  }

  ngOnDestroy(): void {
    if (this.filtroTimer) {
      clearTimeout(this.filtroTimer);
      this.filtroTimer = null;
    }
  }

  scheduleBuscar(): void {
    if (this.filtroTimer) clearTimeout(this.filtroTimer);
    this.filtroTimer = setTimeout(() => {
      this.page = 0;
      this.carregarPagina();
    }, 300);
  }

  carregarPagina(page?: number): void {
    if (page != null) this.page = page;

    this.loading = true;
    this.errorMsg = null;

    this.api.listar({ page: this.page, size: this.size, sort: 'nome,asc' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.totalPages = res.totalPages ?? 0;
          this.totalElements = res.totalElements ?? 0;
          this.rows = res.content ?? [];
          this.applyLocalFilter();
        },
        error: (err) => this.errorMsg = err?.error?.message || 'Erro ao carregar oficinas.',
      });
  }

  applyLocalFilter(): void {
    const q = (this.search || '').trim().toLowerCase();
    this.filtered = this.rows.filter(o => {
      if (!q) return true;
      const hay = `${o.codigo} ${o.nome}`.toLowerCase();
      return hay.includes(q);
    });
  }

  abrirDetalhe(o: OficinaResponse): void {
    this.router.navigate(['/dashboard/oficinas', o.codigo]);
  }

  // modal
  openNova(): void {
    this.isEditing = false;
    this.editingCodigo = null;
    this.form = { nome: '' };
    this.showModal = true;
  }

  openEditar(o: OficinaResponse): void {
    this.isEditing = true;
    this.editingCodigo = o.codigo;
    this.form = { nome: o.nome };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingCodigo = null;
    this.form = { nome: '' };
  }

  salvar(): void {
    if (!this.form.nome || !this.form.nome.trim()) {
      this.toast.warn('Informe o nome da oficina.');
      return;
    }
    if (this.isEditing && this.editingCodigo && this.editingCodigo.length > MAX_CODIGO) {
      this.toast.warn(`Código da oficina deve ter no máximo ${MAX_CODIGO} caracteres.`);
      return;
    }

    this.loading = true;
    this.errorMsg = null;

    const payload: OficinaRequest = { nome: this.form.nome.trim() };
    const req$ = (this.isEditing && this.editingCodigo)
      ? this.api.atualizar(this.editingCodigo, payload)
      : this.api.criar(payload);

    req$
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => { this.closeModal(); this.carregarPagina(); },
        error: (err) => this.errorMsg = err?.error?.message || 'Erro ao salvar oficina.',
      });
  }

  deletar(o: OficinaResponse): void {
    if (!o?.codigo) {
      this.toast.warn('Código da oficina é obrigatório.');
      return;
    }
    if (o.codigo.length > MAX_CODIGO) {
      this.toast.warn(`Código da oficina deve ter no máximo ${MAX_CODIGO} caracteres.`);
      return;
    }
    if (!confirm(`Deseja excluir a oficina ${o.codigo}?`)) return;

    this.loading = true;
    this.errorMsg = null;

    this.api.deletar(o.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.carregarPagina(),
        error: (err) => this.errorMsg = err?.error?.message || 'Erro ao excluir oficina.',
      });
  }
}
