import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CaminhaoApiService } from '../../../core/api/caminhao-api.service';
import { CaminhaoResponse } from '../../../core/api/caminhao-api.models';

const PNEU_MOV_TIPOS = [
  'INSTALACAO',
  'REMOVER',
  'RODIZIO',
  'TROCA_MANUTENCAO',
  'ENVIO_RECAPAGEM',
  'RETORNO_RECAPAGEM',
  'DESCARTE',
] as const;
const PNEU_LADOS = ['ESQUERDO', 'DIREITO'] as const;
const PNEU_POSICOES = ['INTERNO', 'EXTERNO'] as const;
const MAX_CODIGO = 20;

@Component({
  selector: 'app-pneu-detalhe',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pneu-detalhe.component.html',
  styleUrls: ['./pneu-detalhe.component.css'],
})
export class PneuDetalheComponent implements OnInit, OnDestroy {

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
  caminhoes: CaminhaoResponse[] = [];

  // modal evento
  showEvento = false;
  evento: PneuMovimentacaoRequest = {
    tipo: 'RODIZIO',
    kmEvento: null,
    observacao: '',
    caminhaoId: null,
    caminhao: null,
    manutencaoId: null,
    paradaId: null,
    eixoNumero: null,
    lado: null,
    posicao: null,
    kmInstalacao: null,
  };
  showSugEventoCaminhao = false;
  readonly sugestoesMax = 8;
  private autocompleteBlurTimer: any = null;

  constructor(
    private route: ActivatedRoute,
    private api: PneuApiService,
    private caminhaoApi: CaminhaoApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.codigo = this.route.snapshot.paramMap.get('codigo') || '';
    if (!this.codigo) {
      this.toast.error('Código do pneu é obrigatório.');
      return;
    }
    if (this.codigo.length > MAX_CODIGO) {
      this.toast.error(`Código do pneu deve ter no máximo ${MAX_CODIGO} caracteres.`);
      return;
    }
    this.preloadCaminhoes();
    this.carregar();
  }

  ngOnDestroy(): void {
    this.resetAutoComplete();
  }

  carregar(): void {
    if (!this.codigo || this.codigo.length > MAX_CODIGO) {
      this.toast.error('Código do pneu inválido.');
      return;
    }
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
      caminhao: null,
      manutencaoId: null,
      paradaId: null,
      eixoNumero: null,
      lado: null,
      posicao: null,
      kmInstalacao: null,
    };
    this.resetAutoComplete();
    this.showEvento = true;
  }

  closeEvento(): void {
    this.showEvento = false;
    this.resetAutoComplete();
  }

  salvarEvento(): void {
    const tipo = this.evento.tipo;
    this.evento.caminhaoId = this.emptyToNull(this.evento.caminhaoId);
    this.evento.caminhao = this.emptyToNull(this.evento.caminhao);
    if (!this.mostrarKmEvento()) this.evento.kmEvento = null;

    if (!PNEU_MOV_TIPOS.includes(tipo as any)) {
      this.toast.warn('Tipo de movimentação inválido.');
      return;
    }
    if (this.evento.lado && !PNEU_LADOS.includes(this.evento.lado as any)) {
      this.toast.warn('Lado inválido. Use ESQUERDO ou DIREITO.');
      return;
    }
    if (this.evento.posicao && !PNEU_POSICOES.includes(this.evento.posicao as any)) {
      this.toast.warn('Posição inválida. Use INTERNO ou EXTERNO.');
      return;
    }

    // validações mínimas
    if (tipo === 'INSTALACAO') {
      if (!this.evento.caminhaoId && !this.evento.caminhao) {
        return this.toast.warn('Informe o caminhão por UUID, placa, código interno ou código externo.');
      }
      if (this.evento.kmEvento == null) return this.toast.warn('kmEvento é obrigatório em INSTALACAO.');
      if (this.evento.kmInstalacao == null) return this.toast.warn('kmInstalacao é obrigatório em INSTALACAO.');
      if (this.evento.eixoNumero == null || !this.evento.lado || !this.evento.posicao) {
        return this.toast.warn('eixoNumero, lado e posicao são obrigatórios em INSTALACAO.');
      }
    }

    if ((tipo === 'REMOVER' || tipo === 'RODIZIO' || tipo === 'TROCA_MANUTENCAO') && this.evento.kmEvento == null) {
      return this.toast.warn('kmEvento é obrigatório para este tipo de evento.');
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

  mostrarKmEvento(): boolean {
    return this.evento.tipo !== 'ENVIO_RECAPAGEM' && this.evento.tipo !== 'RETORNO_RECAPAGEM';
  }

  onTipoEventoChange(): void {
    if (!this.mostrarKmEvento()) this.evento.kmEvento = null;
  }

  get sugestoesEventoCaminhao(): CaminhaoResponse[] {
    const q = (this.evento.caminhao || '').trim().toLowerCase();
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

  onFocusEventoCaminhao(): void {
    this.showSugEventoCaminhao = true;
  }

  onBlurEventoSugestao(): void {
    if (this.autocompleteBlurTimer) clearTimeout(this.autocompleteBlurTimer);
    this.autocompleteBlurTimer = setTimeout(() => {
      this.showSugEventoCaminhao = false;
    }, 140);
  }

  selectEventoCaminhao(c: CaminhaoResponse): void {
    this.evento.caminhao = c.codigo || c.codigoExterno || c.placa || null;
    this.showSugEventoCaminhao = false;
  }

  private preloadCaminhoes(): void {
    this.caminhaoApi.listar({ page: 0, size: 200, sort: 'codigo,asc', ativo: true }).subscribe({
      next: (res) => (this.caminhoes = res.content || []),
      error: () => (this.caminhoes = []),
    });
  }

  private emptyToNull(v: string | null | undefined): string | null {
    const s = String(v || '').trim();
    return s ? s : null;
  }

  private resetAutoComplete(): void {
    this.showSugEventoCaminhao = false;
    if (this.autocompleteBlurTimer) {
      clearTimeout(this.autocompleteBlurTimer);
      this.autocompleteBlurTimer = null;
    }
  }
}
