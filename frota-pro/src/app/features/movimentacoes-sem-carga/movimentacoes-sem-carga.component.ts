import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { CaminhaoApiService } from '../../core/api/caminhao-api.service';
import { CaminhaoResponse } from '../../core/api/caminhao-api.models';
import { MovimentacaoSemCargaApiService } from '../../core/api/movimentacao-sem-carga-api.service';
import {
  MovimentacaoSemCargaResponse,
  MovimentacaoSemCargaResumoResponse,
} from '../../core/api/movimentacao-sem-carga-api.models';

@Component({
  selector: 'app-movimentacoes-sem-carga',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movimentacoes-sem-carga.component.html',
  styleUrls: ['./movimentacoes-sem-carga.component.css'],
})
export class MovimentacoesSemCargaComponent implements OnInit, OnDestroy {
  filtros = {
    codigoCaminhao: '',
    inicio: '',
    fim: '',
  };

  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  loading = false;
  resumoLoading = false;
  errorMsg = '';
  resumoError = '';

  movimentacoes: MovimentacaoSemCargaResponse[] = [];
  resumo: MovimentacaoSemCargaResumoResponse | null = null;
  caminhoes: CaminhaoResponse[] = [];
  showSugCaminhao = false;
  readonly sugestoesMax = 8;
  private autocompleteBlurTimer: any = null;

  constructor(
    private api: MovimentacaoSemCargaApiService,
    private caminhaoApi: CaminhaoApiService
  ) {}

  ngOnInit(): void {
    this.definirPeriodoAtual();
    this.preloadCaminhoes();
    this.carregar();
  }

  ngOnDestroy(): void {
    if (this.autocompleteBlurTimer) {
      clearTimeout(this.autocompleteBlurTimer);
      this.autocompleteBlurTimer = null;
    }
  }

  carregar(resetPage = false): void {
    if (resetPage) this.page = 0;

    this.loading = true;
    this.errorMsg = '';

    this.api
      .listar({
        codigoCaminhao: this.codigoCaminhaoFiltro,
        inicio: this.filtros.inicio || null,
        fim: this.filtros.fim || null,
        page: this.page,
        size: this.size,
        sort: 'dataMovimentacao,desc',
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.movimentacoes = res.content || [];
          this.totalElements = res.totalElements || 0;
          this.totalPages = res.totalPages || 0;
        },
        error: (err) => {
          console.error(err);
          this.movimentacoes = [];
          this.totalElements = 0;
          this.totalPages = 0;
          this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar as movimentações sem carga.');
        },
      });

    this.carregarResumo();
  }

  carregarResumo(): void {
    this.resumo = null;
    this.resumoError = '';

    if (!this.codigoCaminhaoFiltro || !this.filtros.inicio || !this.filtros.fim) {
      return;
    }

    this.resumoLoading = true;
    this.api
      .resumo(this.codigoCaminhaoFiltro, this.filtros.inicio, this.filtros.fim)
      .pipe(finalize(() => (this.resumoLoading = false)))
      .subscribe({
        next: (res) => (this.resumo = res),
        error: (err) => {
          console.error(err);
          this.resumo = null;
          this.resumoError = extrairMensagemErro(err, 'Não foi possível carregar o resumo para o caminhão informado.');
        },
      });
  }

  limpar(): void {
    this.filtros.codigoCaminhao = '';
    this.definirPeriodoAtual();
    this.carregar(true);
  }

  prevPage(): void {
    if (this.page <= 0) return;
    this.page -= 1;
    this.carregar();
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.page += 1;
    this.carregar();
  }

  trackById(_: number, row: MovimentacaoSemCargaResponse): string {
    return row.id;
  }

  get sugestoesCaminhao(): CaminhaoResponse[] {
    const q = (this.filtros.codigoCaminhao || '').trim().toLowerCase();
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

  onFocusCaminhao(): void {
    this.showSugCaminhao = (this.filtros.codigoCaminhao || '').trim().length > 0;
  }

  onInputCaminhao(): void {
    this.showSugCaminhao = (this.filtros.codigoCaminhao || '').trim().length > 0;
  }

  onBlurSugestao(): void {
    if (this.autocompleteBlurTimer) clearTimeout(this.autocompleteBlurTimer);
    this.autocompleteBlurTimer = setTimeout(() => (this.showSugCaminhao = false), 140);
  }

  selectCaminhao(c: CaminhaoResponse): void {
    this.filtros.codigoCaminhao = c.codigo || c.codigoExterno || '';
    this.showSugCaminhao = false;
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

  formatNumber(value: number | null | undefined, dec = 0): string {
    if (value === null || value === undefined) return '—';
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  formatBRL(value: number | null | undefined): string {
    const n = Number(value || 0);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  get codigoCaminhaoFiltro(): string {
    return (this.filtros.codigoCaminhao || '').trim().toUpperCase();
  }

  private definirPeriodoAtual(): void {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    this.filtros.inicio = `${y}-${m}-01`;
    this.filtros.fim = `${y}-${m}-${d}`;
  }

  private preloadCaminhoes(): void {
    this.caminhaoApi.listar({ page: 0, size: 200, sort: 'codigo,asc', ativo: true }).subscribe({
      next: (res) => (this.caminhoes = res.content || []),
      error: () => (this.caminhoes = []),
    });
  }
}
