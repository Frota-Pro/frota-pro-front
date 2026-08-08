import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { CidadeApiService } from '../../core/api/cidade-api.service';
import { CidadeResumoResponse } from '../../core/api/cidade-api.models';
import { ClienteHistoricoRotaResponse } from '../../core/api/rota-api.models';
import { RotasListComponent } from '../rotas/rotas-list/rotas-list.component';

type TabKey = 'cidades' | 'rotas';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

@Component({
  selector: 'app-roteirizacao',
  standalone: true,
  imports: [CommonModule, RotasListComponent],
  templateUrl: './roteirizacao.component.html',
  styleUrls: ['./roteirizacao.component.css'],
})
export class RoteirizacaoComponent implements OnInit {
  tab: TabKey = 'cidades';

  // Cidades
  cidades: CidadeResumoResponse[] = [];
  loading = false;
  errorMsg: string | null = null;
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  // Modal clientes da cidade
  showClientesModal = false;
  cidadeSelecionada: string | null = null;
  clientesLoading = false;
  clientes: ClienteHistoricoRotaResponse[] = [];

  // toasts
  toasts: ToastItem[] = [];

  constructor(private api: CidadeApiService) {}

  ngOnInit(): void {
    this.carregarCidades();
  }

  setTab(tab: TabKey): void {
    this.tab = tab;
  }

  private toast(type: ToastType, message: string, ttlMs = 4200): void {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.toasts = [{ id, type, message }, ...this.toasts].slice(0, 5);
    window.setTimeout(() => this.dismissToast(id), ttlMs);
  }

  dismissToast(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  carregarCidades(): void {
    this.loading = true;
    this.errorMsg = null;

    this.api
      .listar({ page: this.page, size: this.size })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.cidades = res.content || [];
          this.totalElements = res.totalElements || 0;
          this.totalPages = res.totalPages || 0;
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'Não foi possível carregar as cidades.';
          this.toast('error', extrairMensagemErro(err) || this.errorMsg);
        },
      });
  }

  prevPage(): void {
    if (this.page <= 0) return;
    this.page -= 1;
    this.carregarCidades();
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.page += 1;
    this.carregarCidades();
  }

  abrirClientes(cidade: string): void {
    this.cidadeSelecionada = cidade;
    this.clientes = [];
    this.showClientesModal = true;
    this.clientesLoading = true;

    this.api
      .clientes(cidade)
      .pipe(finalize(() => (this.clientesLoading = false)))
      .subscribe({
        next: (res) => (this.clientes = res || []),
        error: (err) => {
          console.error(err);
          this.toast('error', extrairMensagemErro(err) || 'Não foi possível carregar os clientes dessa cidade.');
        },
      });
  }

  closeClientesModal(): void {
    this.showClientesModal = false;
    this.cidadeSelecionada = null;
    this.clientes = [];
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
