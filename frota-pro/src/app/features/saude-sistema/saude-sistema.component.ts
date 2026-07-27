import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { DashboardApiService } from '../../core/api/dashboard-api.service';
import { SaudeSistemaResponse } from '../../core/api/dashboard-api.models';

type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

@Component({
  selector: 'app-saude-sistema',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './saude-sistema.component.html',
  styleUrls: ['./saude-sistema.component.css'],
})
export class SaudeSistemaComponent implements OnInit, OnDestroy {
  inicio: string;
  fim: string;

  data: SaudeSistemaResponse | null = null;

  loading = false;
  errorMsg: string | null = null;

  toasts: ToastItem[] = [];
  private toastTimers: number[] = [];

  constructor(private api: DashboardApiService) {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.inicio = this.toIsoDate(primeiroDiaMes);
    this.fim = this.toIsoDate(hoje);
  }

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    this.toastTimers.forEach((t) => window.clearTimeout(t));
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private toast(type: ToastType, message: string, ttlMs = 4200): void {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.toasts = [{ id, type, message }, ...this.toasts].slice(0, 5);
    this.toastTimers.push(window.setTimeout(() => this.dismissToast(id), ttlMs));
  }

  dismissToast(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  private extractApiError(err: unknown): string {
    const e = err as HttpErrorResponse;
    const body: any = e?.error;
    if (typeof body?.message === 'string' && body.message.trim()) return body.message;
    if (typeof e?.message === 'string' && e.message.trim()) return e.message;
    return 'Ocorreu um erro ao carregar as métricas do sistema.';
  }

  carregar(): void {
    this.loading = true;
    this.errorMsg = null;

    this.api
      .getSaudeSistema(this.inicio || null, this.fim || null)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => (this.data = res),
        error: (err) => {
          console.error(err);
          this.data = null;
          this.errorMsg = this.extractApiError(err);
          this.toast('error', this.errorMsg);
        },
      });
  }

  aplicarPeriodo(): void {
    this.carregar();
  }

  diasSemAcessoLabel(dias: number | null): string {
    if (dias === null || dias === undefined) return 'Nunca acessou';
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Ontem';
    return `${dias} dias atrás`;
  }

  statusAcessoClass(dias: number | null): string {
    if (dias === null || dias === undefined) return 'inactive';
    if (dias <= 7) return 'success';
    if (dias <= 30) return 'warning';
    return 'inactive';
  }
}
