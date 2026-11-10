import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { formatKgFromTon } from '../../shared/utils/weight';
import { ConferenciaApiService } from '../../core/api/conferencia-api.service';
import { ConferenciaMotoristaCaminhaoLinha } from '../../core/api/conferencia-api.models';
import { caminhaoAtual, motoristaAtual, perguntaDeConfirmacao, resumoDaMudanca } from './conferencia.utils';

interface Mensagem {
  tipo: 'success' | 'error';
  texto: string;
}

@Component({
  selector: 'app-conferencia-motorista-caminhao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './conferencia-motorista-caminhao.component.html',
  styleUrls: ['./conferencia.component.css', './conferencia-motorista-caminhao.component.css'],
})
export class ConferenciaMotoristaCaminhaoComponent implements OnInit {
  inicio: string;
  fim: string;

  linhas: ConferenciaMotoristaCaminhaoLinha[] = [];
  carregou = false;
  loading = false;
  errorMsg: string | null = null;
  mensagem: Mensagem | null = null;

  /** Cargas (numeroCargaExterno) com confirmar/ignorar em andamento. */
  private processando = new Set<string>();

  constructor(private api: ConferenciaApiService) {
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje);
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    this.inicio = this.toIsoDate(trintaDiasAtras);
    this.fim = this.toIsoDate(hoje);
  }

  ngOnInit(): void {
    this.buscar();
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  buscar(): void {
    this.loading = true;
    this.errorMsg = null;
    this.api
      .listarReentregaMotoristaCaminhao({ inicio: this.inicio, fim: this.fim })
      .pipe(finalize(() => { this.loading = false; this.carregou = true; }))
      .subscribe({
        next: (r) => (this.linhas = r.linhas ?? []),
        error: (err) => {
          this.linhas = [];
          this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar a conferência.');
        },
      });
  }

  confirmar(linha: ConferenciaMotoristaCaminhaoLinha): void {
    if (!linha.podeConfirmar || this.estaProcessando(linha)) return;
    if (!window.confirm(perguntaDeConfirmacao(linha))) return;

    this.processando.add(linha.numeroCargaExterno);
    this.mensagem = null;
    this.api
      .confirmarTrocaReentregaMotoristaCaminhao(linha.numeroCargaExterno)
      .pipe(finalize(() => this.processando.delete(linha.numeroCargaExterno)))
      .subscribe({
        next: (r) => {
          this.remover(linha);
          const mudou: string[] = [];
          if (r.motoristaAntes !== r.motoristaDepois) mudou.push(`motorista ${r.motoristaAntes} → ${r.motoristaDepois}`);
          if (r.caminhaoAntes !== r.caminhaoDepois) mudou.push(`caminhão ${r.caminhaoAntes} → ${r.caminhaoDepois}`);
          this.mensagem = { tipo: 'success', texto: `${r.numeroCarga} atualizada: ${mudou.join('; ')}.` };
        },
        error: (err) => {
          this.mensagem = { tipo: 'error', texto: extrairMensagemErro(err, 'Não foi possível confirmar a troca.') };
        },
      });
  }

  ignorar(linha: ConferenciaMotoristaCaminhaoLinha): void {
    if (this.estaProcessando(linha)) return;
    if (!window.confirm(`Ignorar a carga ${linha.numeroCarga}? Ela sai desta lista e nada é alterado.`)) return;

    this.processando.add(linha.numeroCargaExterno);
    this.mensagem = null;
    this.api
      .ignorarTrocaReentregaMotoristaCaminhao(linha.numeroCargaExterno)
      .pipe(finalize(() => this.processando.delete(linha.numeroCargaExterno)))
      .subscribe({
        next: () => {
          this.remover(linha);
          this.mensagem = { tipo: 'success', texto: `${linha.numeroCarga} ignorada. Nada foi alterado.` };
        },
        error: (err) => {
          this.mensagem = { tipo: 'error', texto: extrairMensagemErro(err, 'Não foi possível ignorar.') };
        },
      });
  }

  private remover(linha: ConferenciaMotoristaCaminhaoLinha): void {
    this.linhas = this.linhas.filter((l) => l.numeroCargaExterno !== linha.numeroCargaExterno);
  }

  estaProcessando(linha: ConferenciaMotoristaCaminhaoLinha): boolean {
    return this.processando.has(linha.numeroCargaExterno);
  }

  resumo(linha: ConferenciaMotoristaCaminhaoLinha): string[] {
    return resumoDaMudanca(linha);
  }

  motoristaAtual = motoristaAtual;
  caminhaoAtual = caminhaoAtual;

  pesoKg(linha: ConferenciaMotoristaCaminhaoLinha): string {
    return linha.pesoCarga == null ? '-' : `${formatKgFromTon(linha.pesoCarga, 0)} kg`;
  }

  trackByCarga(_: number, linha: ConferenciaMotoristaCaminhaoLinha): string {
    return linha.numeroCargaExterno;
  }
}
