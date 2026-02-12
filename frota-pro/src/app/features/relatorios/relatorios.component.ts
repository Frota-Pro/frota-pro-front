import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs';

import { RelatorioPdfApiService } from '../../core/api/relatorio-pdf-api.service';

type ReportKey =
  | 'ABASTECIMENTOS'
  | 'CUSTO_CAMINHAO'
  | 'MANUTENCOES_CAMINHAO'
  | 'RANKING_MOTORISTAS'
  | 'CARGA_COMPLETA'
  | 'META_MENSAL_MOTORISTA'
  | 'VIDA_UTIL_PNEU';

type ReportDef = {
  key: ReportKey;
  title: string;
  needsPeriodo?: boolean;
  needsCaminhao?: boolean;
  needsMotorista?: boolean;
  needsNumeroCarga?: boolean;
  enabled?: boolean;
};

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorios.component.html',
  styleUrls: ['./relatorios.component.css'],
})
export class RelatoriosComponent implements OnDestroy {
  constructor(
    private api: RelatorioPdfApiService,
    private sanitizer: DomSanitizer
  ) {}

  reports: ReportDef[] = [
    // ✅ Abastecimentos: periodo obrigatório, caminhão/motorista opcionais (não colocar needsCaminhao/needsMotorista)
    { key: 'ABASTECIMENTOS', title: 'Abastecimentos por Período', needsPeriodo: true, enabled: true },

    { key: 'CUSTO_CAMINHAO', title: 'Custo por Caminhão', needsPeriodo: true, needsCaminhao: true, enabled: true },
    { key: 'MANUTENCOES_CAMINHAO', title: 'Histórico de Manutenção (Caminhão)', needsPeriodo: true, needsCaminhao: true, enabled: true },
    { key: 'RANKING_MOTORISTAS', title: 'Ranking de Motoristas', needsPeriodo: true, enabled: true },
    { key: 'CARGA_COMPLETA', title: 'Relatório Completo da Carga', needsNumeroCarga: true, enabled: true },
    { key: 'META_MENSAL_MOTORISTA', title: 'Meta Mensal do Motorista', needsPeriodo: true, needsMotorista: true, enabled: true },

    // back está comentado hoje:
    { key: 'VIDA_UTIL_PNEU', title: 'Vida Útil do Pneu (em breve)', enabled: false },
  ];

  form = {
    inicio: '',
    fim: '',
    tipo: '' as ReportKey | '',
    codigoCaminhao: '',
    codigoMotorista: '',
    numeroCarga: '',
  };

  loading = false;
  errorMsg = '';

  pdfSafeUrl: SafeResourceUrl | null = null;
  private objectUrl: string | null = null;
  private lastBlob: Blob | null = null;
  lastFilename = 'relatorio.pdf';

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  get selectedDef(): ReportDef | undefined {
    return this.reports.find(r => r.key === this.form.tipo);
  }

  /** ✅ limpa campos quando troca o tipo para evitar enviar filtro “sem querer” */
  onTipoChange() {
    this.errorMsg = '';

    const def = this.selectedDef;

    // se ainda não escolheu nada, só limpa
    if (!def) {
      this.form.codigoCaminhao = '';
      this.form.codigoMotorista = '';
      this.form.numeroCarga = '';
      return;
    }

    // se não é por período, zera datas
    if (!def.needsPeriodo) {
      this.form.inicio = '';
      this.form.fim = '';
    }

    // se não precisa de carga, limpa número
    if (!def.needsNumeroCarga) {
      this.form.numeroCarga = '';
    }

    // regra especial: abastecimentos aceita caminhão/motorista opcionais, então NÃO limpa automaticamente aqui
    if (def.key !== 'ABASTECIMENTOS') {
      if (!def.needsCaminhao) this.form.codigoCaminhao = '';
      if (!def.needsMotorista) this.form.codigoMotorista = '';
    }
  }

  private revokeObjectUrl() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  private extractFilename(contentDisposition: string | null, fallback: string) {
    if (!contentDisposition) return fallback;

    const m1 = /filename=\"?([^\";]+)\"?/i.exec(contentDisposition);
    if (m1?.[1]) return m1[1];

    const m2 = /filename\*\=UTF-8''([^;]+)/i.exec(contentDisposition);
    if (m2?.[1]) return decodeURIComponent(m2[1]);

    return fallback;
  }

  private validate(): string | null {
    const def = this.selectedDef;
    if (!def) return 'Selecione um tipo de relatório.';
    if (def.enabled === false) return 'Este relatório ainda não está ativo no backend.';

    if (def.needsPeriodo) {
      if (!this.form.inicio || !this.form.fim) return 'Informe início e fim.';
    }

    // ✅ Abastecimentos: caminhão/motorista são opcionais, então não valida aqui
    if (def.key !== 'ABASTECIMENTOS') {
      if (def.needsCaminhao && !this.form.codigoCaminhao) return 'Informe o código do caminhão.';
      if (def.needsMotorista && !this.form.codigoMotorista) return 'Informe o código do motorista.';
    }

    if (def.needsNumeroCarga && !this.form.numeroCarga) return 'Informe o número da carga.';

    return null;
  }

  gerar() {
    this.errorMsg = '';
    const err = this.validate();
    if (err) {
      this.errorMsg = err;
      return;
    }

    const def = this.selectedDef!;
    this.loading = true;

    let req$;

    switch (def.key) {
      case 'ABASTECIMENTOS':
        // ✅ se vazio, não envia o param => backend entende como TODOS
        req$ = this.api.abastecimentos(
          this.form.inicio,
          this.form.fim,
          this.form.codigoCaminhao || undefined,
          this.form.codigoMotorista || undefined
        );
        break;

      case 'CUSTO_CAMINHAO':
        req$ = this.api.custoCaminhao(this.form.codigoCaminhao, this.form.inicio, this.form.fim);
        break;

      case 'MANUTENCOES_CAMINHAO':
        req$ = this.api.manutencoesCaminhao(this.form.codigoCaminhao, this.form.inicio, this.form.fim);
        break;

      case 'RANKING_MOTORISTAS':
        req$ = this.api.rankingMotoristas(this.form.inicio, this.form.fim);
        break;

      case 'CARGA_COMPLETA':
        req$ = this.api.cargaCompleta(this.form.numeroCarga);
        break;

      case 'META_MENSAL_MOTORISTA':
        req$ = this.api.metaMensalMotorista(this.form.codigoMotorista, this.form.inicio, this.form.fim);
        break;

      case 'VIDA_UTIL_PNEU':
        req$ = this.api.vidaUtilPneu(this.form.codigoCaminhao || undefined);
        break;

      default:
        this.errorMsg = 'Tipo inválido.';
        this.loading = false;
        return;
    }

    req$
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          const blob = res.body;
          if (!blob) {
            this.errorMsg = 'PDF vazio retornado pela API.';
            return;
          }

          this.lastBlob = blob;

          const fallback = `relatorio-${def.key.toLowerCase()}.pdf`;
          this.lastFilename = this.extractFilename(res.headers.get('content-disposition'), fallback);

          this.revokeObjectUrl();
          this.objectUrl = URL.createObjectURL(blob);
          this.pdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
        },
        error: (e) => {
          // às vezes erro vem como Blob (application/json) — mantém fallback simples
          this.errorMsg = e?.error?.message || 'Erro ao gerar PDF.';
        },
      });
  }

  abrirNovaAba() {
    if (!this.objectUrl) return;
    window.open(this.objectUrl, '_blank');
  }

  baixar() {
    if (!this.lastBlob) return;

    const a = document.createElement('a');
    const url = URL.createObjectURL(this.lastBlob);
    a.href = url;
    a.download = this.lastFilename || 'relatorio.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }

  limparPreview() {
    this.lastBlob = null;
    this.lastFilename = 'relatorio.pdf';
    this.pdfSafeUrl = null;
    this.revokeObjectUrl();
  }
}
