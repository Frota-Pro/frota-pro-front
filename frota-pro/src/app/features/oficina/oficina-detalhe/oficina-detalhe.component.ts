import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { OficinaApiService } from '../../../core/api/oficina-api.service';
import { OficinaResponse } from '../../../core/api/oficina-api.models';
import { OficinaDashboardResponse } from '../../../core/api/oficina-dashboard.models';

@Component({
  selector: 'app-oficina-detalhe',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './oficina-detalhe.component.html',
  styleUrls: ['./oficina-detalhe.component.css'],
})
export class OficinaDetalheComponent implements OnInit {

  codigo = '';
  loading = false;
  erro: string | null = null;

  oficina: OficinaResponse | null = null;
  dash: OficinaDashboardResponse | null = null;

  // período (default: mês atual)
  inicio = '';
  fim = '';

  constructor(
    private route: ActivatedRoute,
    private api: OficinaApiService,
  ) {}

  ngOnInit(): void {
    this.codigo = this.route.snapshot.paramMap.get('codigo') || '';
    this.setPeriodoMesAtual();
    this.carregarOficina();
    this.carregarDashboard();
  }

  setPeriodoMesAtual(): void {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0..11

    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);

    this.inicio = first.toISOString().slice(0, 10);
    this.fim = last.toISOString().slice(0, 10);
  }

  carregarOficina(): void {
    this.loading = true;
    this.erro = null;

    this.api.buscarPorCodigo(this.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (o) => this.oficina = o,
        error: (err) => this.erro = err?.error?.message || 'Erro ao carregar oficina.',
      });
  }

  carregarDashboard(): void {
    if (!this.inicio || !this.fim) return;

    this.loading = true;
    this.erro = null;

    this.api.dashboard(this.codigo, this.inicio, this.fim)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (d) => this.dash = d,
        error: (err) => this.erro = err?.error?.message || 'Erro ao carregar dashboard.',
      });
  }

  formatMoneyBRL(v?: number | null): string {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return 'R$ 0,00';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
