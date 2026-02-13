import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { CargaApiService } from '../../../core/api/carga-api.service';
import { CargaMinResponse } from '../../../core/api/carga-api.models';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
}

@Component({
  selector: 'app-cargas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cargas-list.component.html',
  styleUrls: ['./cargas-list.component.css'],
})
export class CargasListComponent implements OnInit {
  loading = false;
  errorMsg: string | null = null;

  page = 0;
  size = 10;
  totalPages = 0;

  q = '';
  inicio: string | null = null; // yyyy-MM-dd
  fim: string | null = null; // yyyy-MM-dd

  rows: CargaMinResponse[] = [];

  // ===== Toasts =====
  toasts: ToastItem[] = [];
  private toastSeq = 0;

  // ===== Validações UI =====
  periodoErro: string | null = null;

  constructor(private api: CargaApiService, private router: Router) {}

  ngOnInit(): void {
    this.carregarPagina();
  }

  // =======================
  // Toast helpers
  // =======================
  toast(type: ToastType, message: string, title?: string, ms = 3200): void {
    const id = ++this.toastSeq;
    this.toasts.push({ id, type, title, message });
    window.setTimeout(() => this.dismissToast(id), ms);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  // =======================
  // Datas / validações
  // =======================
  private parseDateOnly(iso: string): Date | null {
    // iso esperado: yyyy-MM-dd
    if (!iso) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);

    const dt = new Date(y, mo - 1, d);
    if (Number.isNaN(dt.getTime())) return null;
    // garante que bate com a data (evita 2026-02-31 virar março)
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;

    dt.setHours(0, 0, 0, 0);
    return dt;
  }

  private validarPeriodo(): boolean {
    this.periodoErro = null;

    const hasInicio = !!(this.inicio && this.inicio.trim());
    const hasFim = !!(this.fim && this.fim.trim());

    // se preencher um, exige o outro
    if ((hasInicio && !hasFim) || (!hasInicio && hasFim)) {
      this.periodoErro = 'Informe as duas datas (início e fim) para pesquisar por período.';
      this.toast('info', this.periodoErro, 'Período');
      return false;
    }

    if (!hasInicio && !hasFim) return true;

    const di = this.parseDateOnly(this.inicio!);
    const df = this.parseDateOnly(this.fim!);

    if (!di || !df) {
      this.periodoErro = 'Data inválida no filtro de período.';
      this.toast('error', this.periodoErro, 'Período');
      return false;
    }

    if (di.getTime() > df.getTime()) {
      this.periodoErro = 'A data de início não pode ser maior que a data de fim.';
      this.toast('error', this.periodoErro, 'Período');
      return false;
    }

    // (opcional) trava período absurdo (ex.: 5 anos) — se quiser, comente
    const diffDays = Math.ceil((df.getTime() - di.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      this.periodoErro = 'Período muito grande. Use no máximo 12 meses para evitar lentidão.';
      this.toast('info', this.periodoErro, 'Período');
      return false;
    }

    return true;
  }

  // =======================
  // API / Tela
  // =======================
  carregarPagina(): void {
    // se o usuário deixou período inconsistente, não chama API
    if (!this.validarPeriodo()) return;

    this.loading = true;
    this.errorMsg = null;

    const q = this.q?.trim() ? this.q.trim() : null;

    this.api
      .listar({
        q,
        inicio: this.inicio || null,
        fim: this.fim || null,
        page: this.page,
        size: this.size,
        sort: 'dtSaida,desc',
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (p) => {
          this.rows = p.content || [];
          this.totalPages = p.totalPages ?? 0;
        },
        error: (err) => {
          console.error(err);
          this.rows = [];
          this.totalPages = 0;
          this.errorMsg = 'Não foi possível carregar as cargas.';
          this.toast('error', this.errorMsg, 'Erro');
        },
      });
  }

  aplicarFiltros(): void {
    if (!this.validarPeriodo()) return;
    this.page = 0;
    this.toast('info', 'Aplicando filtros...', 'Cargas', 1200);
    this.carregarPagina();
  }

  limparFiltros(): void {
    this.q = '';
    this.inicio = null;
    this.fim = null;
    this.periodoErro = null;
    this.page = 0;
    this.toast('success', 'Filtros limpos.', 'Cargas', 1500);
    this.carregarPagina();
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.page++;
    this.carregarPagina();
  }

  prevPage(): void {
    if (this.page <= 0) return;
    this.page--;
    this.carregarPagina();
  }

  abrirDetalhe(c: CargaMinResponse): void {
    this.router.navigate(['/dashboard/cargas', c.numeroCarga]);
  }

  labelStatus(status: string): string {
    switch (status) {
      case 'EM_ROTA':
        return 'Em rota';
      case 'FINALIZADA':
        return 'Finalizada';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return status;
    }
  }

  formatMoneyBRL(v?: number | string | null): string {
    if (v === null || v === undefined) {
      return (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    let n: number;

    if (typeof v === 'number') {
      n = v;
    } else {
      const raw = v
        .trim()
        .replace(/\s/g, '')
        .replace(/^R\$/i, '')
        .replace(/\./g, '')
        .replace(',', '.');

      n = Number(raw);
    }

    if (!Number.isFinite(n)) n = 0;

    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
