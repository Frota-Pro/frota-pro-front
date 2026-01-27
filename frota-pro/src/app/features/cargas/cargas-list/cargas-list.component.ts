import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { CargaApiService } from '../../../core/api/carga-api.service';
import { CargaMinResponse } from '../../../core/api/carga-api.models';

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

  constructor(private api: CargaApiService, private router: Router) {}

  ngOnInit(): void {
    this.carregarPagina();
  }

  carregarPagina(): void {
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
        },
      });
  }

  aplicarFiltros(): void {
    this.page = 0;
    this.carregarPagina();
  }

  limparFiltros(): void {
    this.q = '';
    this.inicio = null;
    this.fim = null;
    this.page = 0;
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
      // limpa "R$", espaços e separadores
      const raw = v
        .trim()
        .replace(/\s/g, '')
        .replace(/^R\$/i, '')
        .replace(/\./g, '')   // remove separador de milhar
        .replace(',', '.');   // troca decimal pt-BR para padrão JS

      n = Number(raw);
    }

    if (!Number.isFinite(n)) n = 0;

    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
