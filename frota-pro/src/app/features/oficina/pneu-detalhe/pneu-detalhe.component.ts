import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { PneuApiService } from '../../../core/api/pneu-api.service';
import {
  PneuResponse,
  PneuVidaUtilResponse,
  PneuMovimentacaoRequest,
  PneuMovimentacaoResponse
} from '../../../core/api/pneu-api.models';

@Component({
  selector: 'app-pneu-detalhe',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pneu-detalhe.component.html',
  styleUrls: ['./pneu-detalhe.component.css'],
})
export class PneuDetalheComponent implements OnInit {

  codigo = '';
  loading = false;
  errorMsg: string | null = null;

  pneu: PneuResponse | null = null;
  vida: PneuVidaUtilResponse | null = null;

  // timeline (se tiver endpoint no back)
  movPage = 0;
  movSize = 10;
  movTotalPages = 0;
  movimentacoes: PneuMovimentacaoResponse[] = [];

  // modal evento
  showEvento = false;
  evento: PneuMovimentacaoRequest = {
    tipo: 'RODIZIO',
    kmEvento: null,
    observacao: '',
    caminhaoId: null,
    manutencaoId: null,
    paradaId: null,
    eixoNumero: null,
    lado: null,
    posicao: null,
    kmInstalacao: null,
  };

  constructor(private route: ActivatedRoute, private api: PneuApiService) {}

  ngOnInit(): void {
    this.codigo = this.route.snapshot.paramMap.get('codigo') || '';
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.errorMsg = null;

    this.api.buscar(this.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (p) => {
          this.pneu = p;
          this.carregarVida();
          this.carregarMovimentacoes();
        },
        error: (err) => this.errorMsg = err?.error?.message || 'Erro ao carregar pneu.',
      });
  }

  carregarVida(): void {
    this.api.vidaUtil(this.codigo).subscribe({
      next: (v) => this.vida = v,
      error: () => { /* não bloqueia */ }
    });
  }

  carregarMovimentacoes(page?: number): void {
    if (page != null) this.movPage = page;

    // Se você não tiver endpoint no back, comente isso (não quebra o resto)
    this.api.listarMovimentacoes(this.codigo, this.movPage, this.movSize)
      .subscribe({
        next: (res) => {
          this.movTotalPages = res.totalPages ?? 0;
          this.movimentacoes = res.content ?? [];
        },
        error: () => { /* ignora */ }
      });
  }

  // ===== Evento =====
  openEvento(tipo?: string): void {
    this.evento = {
      tipo: tipo || 'RODIZIO',
      kmEvento: null,
      observacao: '',
      caminhaoId: null,
      manutencaoId: null,
      paradaId: null,
      eixoNumero: null,
      lado: null,
      posicao: null,
      kmInstalacao: null,
    };
    this.showEvento = true;
  }

  closeEvento(): void {
    this.showEvento = false;
  }

  salvarEvento(): void {
    const tipo = this.evento.tipo;

    // validações mínimas
    if (tipo === 'INSTALACAO') {
      if (!this.evento.caminhaoId) return alert('caminhaoId é obrigatório em INSTALACAO.');
      if (this.evento.kmInstalacao == null) return alert('kmInstalacao é obrigatório em INSTALACAO.');
      if (this.evento.eixoNumero == null || !this.evento.lado || !this.evento.posicao) {
        return alert('eixoNumero, lado e posicao são obrigatórios em INSTALACAO.');
      }
    }

    if ((tipo === 'REMOVER' || tipo === 'RODIZIO' || tipo === 'TROCA_MANUTENCAO') && this.evento.kmEvento == null) {
      return alert('kmEvento é obrigatório para este tipo de evento.');
    }

    this.loading = true;
    this.errorMsg = null;

    this.api.movimentacao(this.codigo, this.evento)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.closeEvento();
          this.carregarVida();
          this.carregarMovimentacoes();
        },
        error: (err) => this.errorMsg = err?.error?.message || 'Erro ao registrar evento.',
      });
  }

  // ===== Utils =====
  formatKm(v?: number | null): string {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return '0 km';
    return `${n.toLocaleString('pt-BR')} km`;
  }

  formatMoneyBRL(v?: number | null): string {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return 'R$ 0,00';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  percent(): number {
    const p = Number(this.vida?.percentualVida ?? 0);
    if (!Number.isFinite(p)) return 0;
    return Math.max(0, Math.min(1, p));
  }

  alertaLabel(): string {
    const p = this.percent();
    if (p >= 1) return 'VENCIDO';
    if (p >= 0.85) return 'PRÓXIMO DO FIM';
    return 'OK';
  }
}
