import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleChartsModule, ChartType } from 'angular-google-charts';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { AnalyticsApiService } from '../../core/api/analytics-api.service';
import {
  AnalyticsAbastecimentoResponse,
  AnalyticsCaminhaoResponse,
  AnalyticsFrotaResponse,
  AnalyticsMotoristaResponse,
  AnalyticsRankingCaminhaoItem,
  AnalyticsRankingMotoristaItem,
  AnalyticsResumoCaminhao,
  AnalyticsResumoPosto,
} from '../../core/api/analytics-api.models';
import { CaminhaoApiService } from '../../core/api/caminhao-api.service';
import { CaminhaoResponse } from '../../core/api/caminhao-api.models';
import { MotoristaApiService } from '../../core/api/motorista-api.service';
import { MotoristaResponse } from '../../core/api/motorista-api.models';

type Tab = 'frota' | 'motorista' | 'caminhao' | 'abastecimento';

function isoHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoHaDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

function comboChart(colunas: string[], corBarra: string, corLinha: string) {
  return {
    type: ChartType.ComboChart,
    columns: colunas,
    data: [] as any[],
    options: {
      seriesType: 'bars',
      series: { 1: { type: 'line', targetAxisIndex: 1 } },
      vAxes: { 0: { title: colunas[1] }, 1: { title: colunas[2] } },
      legend: { position: 'top' },
      colors: [corBarra, corLinha],
      backgroundColor: 'transparent',
      chartArea: { width: '80%', height: '70%' },
    },
  };
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleChartsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit {
  activeTab: Tab = 'frota';

  form = {
    inicio: isoHaDias(29),
    fim: isoHoje(),
    codigoMotorista: '',
    codigoCaminhao: '',
  };

  loading = false;
  errorMsg: string | null = null;

  // ===== Frota =====
  dadosFrota: AnalyticsFrotaResponse | null = null;
  chartCargasKm = comboChart(['Semana', 'Cargas finalizadas', 'Km rodado'], '#2563eb', '#f59e0b');
  chartLitrosCusto = comboChart(['Semana', 'Litros', 'Custo (R$)'], '#16a34a', '#dc2626');

  // ===== Motorista =====
  dadosMotorista: AnalyticsMotoristaResponse | null = null;
  chartMotorista = comboChart(['Semana', 'Cargas finalizadas', 'Km rodado'], '#2563eb', '#f59e0b');
  motoristas: MotoristaResponse[] = [];
  showSugMotorista = false;
  private blurTimer: any = null;

  // ===== Caminhão =====
  dadosCaminhao: AnalyticsCaminhaoResponse | null = null;
  chartCaminhao = comboChart(['Semana', 'Km rodado', 'Litros'], '#2563eb', '#16a34a');
  caminhoes: CaminhaoResponse[] = [];
  showSugCaminhao = false;

  // ===== Abastecimento =====
  dadosAbastecimento: AnalyticsAbastecimentoResponse | null = null;
  chartAbastecimento = comboChart(['Semana', 'Litros', 'Custo (R$)'], '#16a34a', '#dc2626');

  readonly sugestoesMax = 8;

  constructor(
    private api: AnalyticsApiService,
    private caminhaoApi: CaminhaoApiService,
    private motoristaApi: MotoristaApiService,
  ) {}

  ngOnInit(): void {
    this.preloadCombos();
    this.buscarAbaAtiva();
  }

  private preloadCombos(): void {
    this.caminhaoApi.listar({ page: 0, size: 200, sort: 'codigo,asc', ativo: true }).subscribe({
      next: (res) => (this.caminhoes = res.content || []),
      error: () => (this.caminhoes = []),
    });
    this.motoristaApi.listar({ page: 0, size: 200, sort: 'codigo,asc', ativo: true }).subscribe({
      next: (res) => (this.motoristas = res.content || []),
      error: () => (this.motoristas = []),
    });
  }

  trocarAba(tab: Tab): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.errorMsg = null;
    this.buscarAbaAtiva();
  }

  aplicarPeriodoRapido(dias: number): void {
    this.form.inicio = isoHaDias(dias - 1);
    this.form.fim = isoHoje();
    this.buscarAbaAtiva();
  }

  buscarAbaAtiva(): void {
    if (!this.form.inicio || !this.form.fim) {
      this.errorMsg = 'Informe início e fim.';
      return;
    }
    switch (this.activeTab) {
      case 'frota': return this.buscarFrota();
      case 'motorista': return this.buscarMotorista();
      case 'caminhao': return this.buscarCaminhao();
      case 'abastecimento': return this.buscarAbastecimento();
    }
  }

  // ===== Frota =====
  private buscarFrota(): void {
    this.loading = true;
    this.errorMsg = null;
    this.api.frota(this.form.inicio, this.form.fim)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.dadosFrota = res;
          const semanas = res.serieSemanal || [];
          this.chartCargasKm = { ...this.chartCargasKm, data: semanas.map((p) => [this.semanaLabel(p.inicioSemana), p.cargasFinalizadas ?? 0, p.kmRodado ?? 0]) };
          this.chartLitrosCusto = { ...this.chartLitrosCusto, data: semanas.map((p) => [this.semanaLabel(p.inicioSemana), Number(p.litros ?? 0), Number(p.custoCombustivel ?? 0)]) };
        },
        error: (err) => {
          this.dadosFrota = null;
          this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar os dados de analytics.');
        },
      });
  }

  // ===== Motorista =====
  private buscarMotorista(): void {
    if (!this.form.codigoMotorista) {
      this.dadosMotorista = null;
      return;
    }
    this.loading = true;
    this.errorMsg = null;
    this.api.motorista(this.form.codigoMotorista, this.form.inicio, this.form.fim)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.dadosMotorista = res;
          const semanas = res.serieSemanal || [];
          this.chartMotorista = { ...this.chartMotorista, data: semanas.map((p) => [this.semanaLabel(p.inicioSemana), p.cargasFinalizadas ?? 0, p.kmRodado ?? 0]) };
        },
        error: (err) => {
          this.dadosMotorista = null;
          this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar os dados do motorista.');
        },
      });
  }

  // ===== Caminhão =====
  private buscarCaminhao(): void {
    if (!this.form.codigoCaminhao) {
      this.dadosCaminhao = null;
      return;
    }
    this.loading = true;
    this.errorMsg = null;
    this.api.caminhao(this.form.codigoCaminhao, this.form.inicio, this.form.fim)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.dadosCaminhao = res;
          const semanas = res.serieSemanal || [];
          this.chartCaminhao = { ...this.chartCaminhao, data: semanas.map((p) => [this.semanaLabel(p.inicioSemana), p.kmRodado ?? 0, Number(p.litros ?? 0)]) };
        },
        error: (err) => {
          this.dadosCaminhao = null;
          this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar os dados do caminhão.');
        },
      });
  }

  // ===== Abastecimento =====
  private buscarAbastecimento(): void {
    this.loading = true;
    this.errorMsg = null;
    this.api.abastecimento(this.form.inicio, this.form.fim)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.dadosAbastecimento = res;
          const semanas = res.serieSemanal || [];
          this.chartAbastecimento = { ...this.chartAbastecimento, data: semanas.map((p) => [this.semanaLabel(p.inicioSemana), Number(p.litros ?? 0), Number(p.custo ?? 0)]) };
        },
        error: (err) => {
          this.dadosAbastecimento = null;
          this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar os dados de abastecimento.');
        },
      });
  }

  // ===== Autocomplete motorista =====
  get sugestoesMotorista(): MotoristaResponse[] {
    const q = (this.form.codigoMotorista || '').trim().toLowerCase();
    if (!q) return [];
    return (this.motoristas || [])
      .filter((m) => {
        const hay = [m.codigo, m.codigoExterno, m.nome].map((x) => String(x || '').toLowerCase()).join(' | ');
        return hay.includes(q);
      })
      .slice(0, this.sugestoesMax);
  }

  onFocusMotorista(): void { this.showSugMotorista = true; }
  onInputMotorista(): void { this.showSugMotorista = (this.form.codigoMotorista || '').trim().length > 0; this.dadosMotorista = null; }
  onBlurSugestao(): void {
    if (this.blurTimer) clearTimeout(this.blurTimer);
    this.blurTimer = setTimeout(() => { this.showSugMotorista = false; this.showSugCaminhao = false; }, 140);
  }
  selecionarMotorista(m: MotoristaResponse): void {
    this.form.codigoMotorista = m.codigo;
    this.showSugMotorista = false;
    this.buscarMotorista();
  }

  // ===== Autocomplete caminhão =====
  get sugestoesCaminhao(): CaminhaoResponse[] {
    const q = (this.form.codigoCaminhao || '').trim().toLowerCase();
    if (!q) return [];
    return (this.caminhoes || [])
      .filter((c) => {
        const hay = [c.codigo, c.codigoExterno, c.placa, c.descricao].map((x) => String(x || '').toLowerCase()).join(' | ');
        return hay.includes(q);
      })
      .slice(0, this.sugestoesMax);
  }

  onFocusCaminhao(): void { this.showSugCaminhao = true; }
  onInputCaminhao(): void { this.showSugCaminhao = (this.form.codigoCaminhao || '').trim().length > 0; this.dadosCaminhao = null; }
  selecionarCaminhao(c: CaminhaoResponse): void {
    this.form.codigoCaminhao = c.codigo;
    this.showSugCaminhao = false;
    this.buscarCaminhao();
  }

  trackByMotorista(_: number, row: AnalyticsRankingMotoristaItem): string { return row.codigoMotorista; }
  trackByCaminhao(_: number, row: AnalyticsRankingCaminhaoItem): string { return row.caminhao; }
  trackByPosto(_: number, row: AnalyticsResumoPosto): string { return row.posto; }
  trackByResumoCaminhao(_: number, row: AnalyticsResumoCaminhao): string { return row.caminhao; }

  private semanaLabel(iso: string): string {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  }

  formatNumber(v?: number | null, casas = 0): string {
    if (v == null) return '-';
    return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }

  formatMoney(v?: number | null): string {
    if (v == null) return '-';
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
