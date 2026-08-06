import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../../core/utils/api-error.util';
import { RotaApiService } from '../../../core/api/rota-api.service';
import { ClienteHistoricoRotaResponse, RotaRequest, RotaResponse } from '../../../core/api/rota-api.models';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface GrupoClientesPorCidade {
  cidade: string;
  clientes: ClienteHistoricoRotaResponse[];
}

@Component({
  selector: 'app-rotas-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rotas-list.component.html',
  styleUrls: ['./rotas-list.component.css'],
})
export class RotasListComponent implements OnInit, OnDestroy {
  // paginação
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  // dados
  rotas: RotaResponse[] = [];

  // ui
  loading = false;
  errorMsg: string | null = null;

  // toasts
  toasts: ToastItem[] = [];

  // modal criar/editar rota
  showRotaModal = false;
  isEditing = false;
  editCodigo: string | null = null;
  form: RotaRequest = {
    cidadeInicio: '',
    cidades: [],
    quantidadeDeDias: 0,
  };
  cidadesTexto = '';

  // modal clientes históricos
  showClientesModal = false;
  clientesLoading = false;
  clientesRotaCodigo: string | null = null;
  clientesHistorico: ClienteHistoricoRotaResponse[] = [];

  constructor(private api: RotaApiService) {}

  private toast(type: ToastType, message: string, ttlMs = 4200): void {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.toasts = [{ id, type, message }, ...this.toasts].slice(0, 5);
    window.setTimeout(() => this.dismissToast(id), ttlMs);
  }

  dismissToast(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  private extractApiError(err: unknown): string {
    return extrairMensagemErro(err);
  }

  ngOnInit(): void {
    this.carregarPagina();
  }

  ngOnDestroy(): void {}

  carregarPagina(): void {
    this.loading = true;
    this.errorMsg = null;

    this.api
      .listar({ page: this.page, size: this.size, sort: 'codigo,asc' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rotas = res.content || [];
          this.totalElements = res.totalElements || 0;
          this.totalPages = res.totalPages || 0;
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'Não foi possível carregar as rotas.';
          this.toast('error', this.extractApiError(err) || this.errorMsg);
        },
      });
  }

  prevPage(): void {
    if (this.page <= 0) return;
    this.page -= 1;
    this.carregarPagina();
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.page += 1;
    this.carregarPagina();
  }

  // ------------------ MODAL CRIAR/EDITAR ------------------
  openNovaRota(): void {
    this.isEditing = false;
    this.editCodigo = null;
    this.form = { cidadeInicio: '', cidades: [], quantidadeDeDias: 0 };
    this.cidadesTexto = '';
    this.showRotaModal = true;
  }

  openEditarRota(r: RotaResponse): void {
    this.isEditing = true;
    this.editCodigo = r.codigo;
    this.form = {
      cidadeInicio: r.cidadeInicio,
      cidades: [...(r.cidades || [])],
      quantidadeDeDias: r.quantidadeDeDias,
    };
    this.cidadesTexto = (r.cidades || []).join(', ');
    this.showRotaModal = true;
  }

  closeRotaModal(): void {
    this.showRotaModal = false;
    this.isEditing = false;
    this.editCodigo = null;
  }

  salvarRota(): void {
    const cidadeInicio = (this.form.cidadeInicio || '').trim();
    const cidades = this.cidadesTexto
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (!cidadeInicio) return this.toast('warning', 'Informe a cidade de início.');
    if (cidades.length === 0) return this.toast('warning', 'Informe ao menos uma cidade na rota.');

    const payload: RotaRequest = {
      cidadeInicio,
      cidades,
      quantidadeDeDias: Number(this.form.quantidadeDeDias) || 0,
    };

    this.loading = true;

    const req$ = this.isEditing && this.editCodigo
      ? this.api.atualizar(this.editCodigo, payload)
      : this.api.criar(payload);

    req$.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.closeRotaModal();
        this.carregarPagina();
        this.toast('success', 'Rota salva com sucesso.');
      },
      error: (err) => {
        console.error(err);
        this.toast('error', this.extractApiError(err) || 'Não foi possível salvar a rota.');
      },
    });
  }

  excluir(r: RotaResponse): void {
    if (!confirm(`Deseja excluir a rota ${r.codigo} (${r.cidadeInicio})?`)) return;

    this.loading = true;
    this.api
      .deletar(r.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.carregarPagina();
          this.toast('success', 'Rota excluída com sucesso.');
        },
        error: (err) => this.toast('error', this.extractApiError(err) || 'Não foi possível excluir a rota.'),
      });
  }

  // ------------------ MODAL CLIENTES HISTÓRICO ------------------
  verClientes(r: RotaResponse): void {
    this.clientesRotaCodigo = r.codigo;
    this.clientesHistorico = [];
    this.showClientesModal = true;
    this.clientesLoading = true;

    this.api
      .clientesHistorico(r.codigo)
      .pipe(finalize(() => (this.clientesLoading = false)))
      .subscribe({
        next: (res) => (this.clientesHistorico = res || []),
        error: (err) => {
          console.error(err);
          this.toast('error', this.extractApiError(err) || 'Não foi possível carregar os clientes da rota.');
        },
      });
  }

  closeClientesModal(): void {
    this.showClientesModal = false;
    this.clientesRotaCodigo = null;
    this.clientesHistorico = [];
  }

  /** Agrupa a lista (já vem ordenada por cidade da API) em blocos por cidade,
   * para exibir "cidade -> clientes daquela cidade" no modal. Clientes sem
   * cidade cadastrada no WinThor caem no grupo "Sem cidade". */
  get clientesAgrupadosPorCidade(): GrupoClientesPorCidade[] {
    const grupos: GrupoClientesPorCidade[] = [];

    for (const c of this.clientesHistorico) {
      const cidade = (c.cidade || '').trim() || 'Sem cidade';
      let grupo = grupos.find((g) => g.cidade === cidade);
      if (!grupo) {
        grupo = { cidade, clientes: [] };
        grupos.push(grupo);
      }
      grupo.clientes.push(c);
    }

    return grupos;
  }

  formatDateBr(value: string | null | undefined): string {
    const v = String(value || '').trim();
    if (!v) return '—';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split('-');
      return `${d}/${m}/${y}`;
    }
    return v;
  }
}
