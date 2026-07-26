import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { MotoristaApiService } from '../../core/api/motorista-api.service';
import { MotoristaDispositivoAppResponse } from '../../core/api/motorista-api.models';

type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

@Component({
  selector: 'app-motoristas-dispositivo-app',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './motoristas-dispositivo-app.component.html',
  styleUrls: ['./motoristas-dispositivo-app.component.css'],
})
export class MotoristasDispositivoAppComponent implements OnInit, OnDestroy {
  q = '';

  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  linhas: MotoristaDispositivoAppResponse[] = [];

  loading = false;
  errorMsg: string | null = null;

  toasts: ToastItem[] = [];
  private searchDebounceTimer?: number;

  constructor(private api: MotoristaApiService) {}

  ngOnInit(): void {
    this.carregarPagina();
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      window.clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = undefined;
    }
  }

  private toast(type: ToastType, message: string, ttlMs = 4200): void {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.toasts = [{ id, type, message }, ...this.toasts].slice(0, 5);
    window.setTimeout(() => this.dismissToast(id), ttlMs);
  }

  dismissToast(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  private extractApiError(err: unknown): string {
    const e = err as HttpErrorResponse;
    const body: any = e?.error;

    if (body?.errors && Array.isArray(body.errors) && body.errors.length) {
      const msgs = body.errors.map((x: any) => x?.message).filter(Boolean);
      if (msgs.length) return msgs.join(' • ');
    }

    if (typeof body?.error === 'string' && body.error.trim()) return body.error;
    if (typeof body?.message === 'string' && body.message.trim()) return body.message;
    if (typeof e?.message === 'string' && e.message.trim()) return e.message;

    return 'Ocorreu um erro ao carregar as versões instaladas.';
  }

  onSearchChange(): void {
    if (this.searchDebounceTimer) {
      window.clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = window.setTimeout(() => {
      this.page = 0;
      this.carregarPagina();
    }, 350);
  }

  carregarPagina(): void {
    this.loading = true;
    this.errorMsg = null;

    this.api.listarDispositivosApp({ page: this.page, size: this.size, q: this.q || null })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.linhas = res.content || [];
          this.totalElements = res.totalElements || 0;
          this.totalPages = res.totalPages || 0;
        },
        error: (err) => {
          console.error(err);
          this.linhas = [];
          this.errorMsg = 'Não foi possível carregar as versões instaladas.';
          this.toast('error', this.extractApiError(err) || this.errorMsg);
        }
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
}
