import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, finalize, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { PneuApiService } from '../../core/api/pneu-api.service';
import { PneuVidaUtilRelatorioLinha, PneuVidaUtilRelatorioResponse } from '../../core/api/pneu-api.models';
import { RelatorioPdfApiService } from '../../core/api/relatorio-pdf-api.service';
import { CaminhaoApiService } from '../../core/api/caminhao-api.service';
import { CaminhaoResponse } from '../../core/api/caminhao-api.models';
import { MotoristaApiService } from '../../core/api/motorista-api.service';
import { MotoristaResponse } from '../../core/api/motorista-api.models';
import { CargaApiService } from '../../core/api/carga-api.service';
import { CargaMinResponse, RelatorioCargasSumidasWinThorResponse, RelatorioCargaSumidaLinha } from '../../core/api/carga-api.models';
import { ToastService } from '../../shared/ui/toast/toast.service';

type ReportKey =
  | 'ABASTECIMENTOS'
  | 'CUSTO_CAMINHAO'
  | 'MANUTENCOES_CAMINHAO'
  | 'RANKING_MOTORISTAS'
  | 'METAS_MOTORISTAS'
  | 'CARGA_COMPLETA'
  | 'META_MENSAL_MOTORISTA'
  | 'DESPESAS_CATEGORIAS'
  | 'VIDA_UTIL_PNEU'
  | 'CARGAS_SUMIDAS_WINTHOR';

type TipoMeta = 'QUILOMETRAGEM' | 'CONSUMO_COMBUSTIVEL' | 'TONELADA' | 'CARGA_TRANSPORTADA';

type ReportCategory = 'Motoristas' | 'Frota' | 'Cargas' | 'Financeiro';

type ReportDef = {
  key: ReportKey;
  title: string;
  category: ReportCategory;
  icon: string;
  short: string;
  note?: string;
  needsPeriodo?: boolean;
  needsCaminhao?: boolean;
  needsMotorista?: boolean;
  needsNumeroCarga?: boolean;
  needsTipoMeta?: boolean;
  enabled?: boolean;
};

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorios.component.html',
  styleUrls: ['./relatorios.component.css'],
})
export class RelatoriosComponent implements OnInit, OnDestroy {
  @ViewChild('filtrosCard') filtrosCardRef?: ElementRef<HTMLElement>;

  constructor(
    private api: RelatorioPdfApiService,
    private pneuApi: PneuApiService,
    private caminhaoApi: CaminhaoApiService,
    private motoristaApi: MotoristaApiService,
    private cargaApi: CargaApiService,
    private sanitizer: DomSanitizer,
    private toast: ToastService
  ) {}

  /** Ordem em que as categorias aparecem no seletor de relatórios. */
  readonly categoryOrder: ReportCategory[] = ['Motoristas', 'Frota', 'Cargas', 'Financeiro'];

  reports: ReportDef[] = [
    // ===== Motoristas =====
    {
      key: 'RANKING_MOTORISTAS',
      title: 'Ranking de Motoristas',
      category: 'Motoristas',
      icon: '🏆',
      short: 'Performance consolidada por motorista no período',
      needsPeriodo: true,
      enabled: true,
    },
    {
      key: 'METAS_MOTORISTAS',
      title: 'Metas dos Motoristas',
      category: 'Motoristas',
      icon: '🎯',
      short: 'Realizado x meta por motorista, por tipo de meta',
      needsPeriodo: true,
      needsTipoMeta: true,
      enabled: true,
    },
    {
      key: 'META_MENSAL_MOTORISTA',
      title: 'Meta Mensal do Motorista',
      category: 'Motoristas',
      icon: '👤',
      short: 'Detalhe mensal de um motorista específico',
      needsPeriodo: true,
      needsMotorista: true,
      enabled: true,
    },

    // ===== Frota =====
    {
      key: 'CUSTO_CAMINHAO',
      title: 'Custo por Caminhão',
      category: 'Frota',
      icon: '💰',
      short: 'Custos consolidados de um caminhão no período',
      note: 'Inclui o total de KM sem carga no retorno e no PDF.',
      needsPeriodo: true,
      needsCaminhao: true,
      enabled: true,
    },
    {
      key: 'MANUTENCOES_CAMINHAO',
      title: 'Histórico de Manutenção',
      category: 'Frota',
      icon: '🔧',
      short: 'Manutenções realizadas em um caminhão no período',
      needsPeriodo: true,
      needsCaminhao: true,
      enabled: true,
    },
    {
      key: 'VIDA_UTIL_PNEU',
      title: 'Vida Útil do Pneu',
      category: 'Frota',
      icon: '🛞',
      short: 'KM rodado x meta de vida de cada pneu',
      enabled: true,
    },

    // ===== Cargas =====
    {
      key: 'CARGA_COMPLETA',
      title: 'Relatório Completo da Carga',
      category: 'Cargas',
      icon: '📦',
      short: 'Todos os dados de uma carga específica',
      needsNumeroCarga: true,
      enabled: true,
    },
    {
      key: 'CARGAS_SUMIDAS_WINTHOR',
      title: 'Cargas Sumidas do WinThor',
      category: 'Cargas',
      icon: '⚠️',
      short: 'Cargas sincronizadas que sumiram do WinThor',
      note: 'Cargas que já foram sincronizadas, mas a verificação mais recente não encontrou mais nota fiscal vinculada no WinThor. Filtros abaixo são opcionais.',
      enabled: true,
    },

    // ===== Financeiro =====
    {
      key: 'ABASTECIMENTOS',
      title: 'Abastecimentos por Período',
      category: 'Financeiro',
      icon: '⛽',
      short: 'Todos os abastecimentos, com filtros opcionais',
      // ✅ Abastecimentos: periodo obrigatório, caminhão/motorista opcionais (não colocar needsCaminhao/needsMotorista)
      needsPeriodo: true,
      enabled: true,
    },
    {
      key: 'DESPESAS_CATEGORIAS',
      title: 'Despesas por Categoria',
      category: 'Financeiro',
      icon: '📊',
      short: 'Despesas agrupadas por categoria no período',
      note: 'Inclui o total de KM sem carga no retorno e no PDF.',
      needsPeriodo: true,
      enabled: true,
    },
  ];

  /** Relatórios agrupados por categoria, na ordem de categoryOrder — usado pelo seletor em cards. */
  get categorias(): { nome: ReportCategory; reports: ReportDef[] }[] {
    return this.categoryOrder
      .map((nome) => ({ nome, reports: this.reports.filter((r) => r.category === nome) }))
      .filter((c) => c.reports.length > 0);
  }

  /** Seleciona um relatório a partir do card clicado (equivalente a mudar o <select> antigo). */
  selecionarTipo(r: ReportDef): void {
    if (r.enabled === false) return;
    this.form.tipo = r.key;
    this.onTipoChange();

    // desce a tela até o card de filtros, pra quem tá num card lá embaixo (ex: Financeiro) não ter que rolar manualmente
    setTimeout(() => {
      this.filtrosCardRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  readonly tipoMetaOptions: { value: TipoMeta; label: string }[] = [
    { value: 'QUILOMETRAGEM', label: 'Quilometragem' },
    { value: 'CONSUMO_COMBUSTIVEL', label: 'Consumo de combustível' },
    { value: 'TONELADA', label: 'Tonelada' },
    { value: 'CARGA_TRANSPORTADA', label: 'Carga transportada' },
  ];

  form = {
    inicio: '',
    fim: '',
    tipo: '' as ReportKey | '',
    tipoMeta: '' as TipoMeta | '',
    codigoCaminhao: '',
    codigoPneu: '',
    codigoMotorista: '',
    numeroCarga: '',
    todosMotoristas: false,
  };

  loading = false;
  errorMsg = '';
  vidaUtilLoading = false;
  vidaUtilResult: PneuVidaUtilRelatorioResponse | null = null;
  cargasSumidasLoading = false;
  cargasSumidasResult: RelatorioCargasSumidasWinThorResponse | null = null;
  verificandoAgora = false;
  caminhoes: CaminhaoResponse[] = [];
  motoristas: MotoristaResponse[] = [];
  showSugRelCaminhao = false;
  showSugRelMotorista = false;
  showSugRelCarga = false;
  sugestoesRelCarga: CargaMinResponse[] = [];
  cargaSearchLoading = false;
  readonly sugestoesMax = 8;

  private readonly destroy$ = new Subject<void>();
  private readonly cargaQuery$ = new Subject<string>();

  pdfSafeUrl: SafeResourceUrl | null = null;
  private objectUrl: string | null = null;
  private lastBlob: Blob | null = null;
  lastFilename = 'relatorio.pdf';
  private autocompleteBlurTimer: any = null;

  ngOnInit(): void {
    this.preloadCombos();

    this.cargaQuery$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          if (!q) return of(null);
          this.cargaSearchLoading = true;
          return this.cargaApi.listar({ q, size: this.sugestoesMax, sort: 'dtSaida,desc' });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.cargaSearchLoading = false;
          this.sugestoesRelCarga = res?.content || [];
        },
        error: () => {
          this.cargaSearchLoading = false;
          this.sugestoesRelCarga = [];
        },
      });
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
    this.resetAutoComplete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get selectedDef(): ReportDef | undefined {
    return this.reports.find(r => r.key === this.form.tipo);
  }

  /** Se há algo pra limpar no painel de resultado (PDF, tabela de vida útil ou de cargas sumidas). */
  get podeLimpar(): boolean {
    return !!this.pdfSafeUrl || !!this.vidaUtilResult || !!this.cargasSumidasResult;
  }

  /** ✅ limpa campos quando troca o tipo para evitar enviar filtro “sem querer” */
  onTipoChange() {
    this.errorMsg = '';
    this.closeAllSugestoes();

    const def = this.selectedDef;

    // se ainda não escolheu nada, só limpa
    if (!def) {
      this.form.codigoCaminhao = '';
      this.form.codigoMotorista = '';
      this.form.numeroCarga = '';
      this.form.todosMotoristas = false;
      return;
    }

    if (def.key !== 'META_MENSAL_MOTORISTA') {
      this.form.todosMotoristas = false;
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
    if (def.key !== 'VIDA_UTIL_PNEU') {
      this.form.codigoPneu = '';
      this.vidaUtilResult = null;
    }
    if (def.key !== 'CARGAS_SUMIDAS_WINTHOR') {
      this.cargasSumidasResult = null;
    }
    if (!def.needsTipoMeta) {
      this.form.tipoMeta = '';
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
    // ✅ Meta Mensal do Motorista com "todos": não precisa escolher um motorista específico
    const pulaValidacaoMotorista = def.key === 'META_MENSAL_MOTORISTA' && this.form.todosMotoristas;
    if (def.key !== 'ABASTECIMENTOS' && !pulaValidacaoMotorista) {
      if (def.needsCaminhao && !this.form.codigoCaminhao) return 'Selecione um caminhão.';
      if (def.needsMotorista && !this.form.codigoMotorista) return 'Selecione um motorista.';
    }

    if (def.needsNumeroCarga && !this.form.numeroCarga) return 'Selecione uma carga.';

    return null;
  }

  gerar() {
    this.closeAllSugestoes();
    this.errorMsg = '';
    const err = this.validate();
    if (err) {
      this.errorMsg = err;
      return;
    }

    const def = this.selectedDef!;

    if (def.key === 'CARGAS_SUMIDAS_WINTHOR') {
      this.loading = false;
      this.cargasSumidasLoading = true;
      this.pdfSafeUrl = null;
      this.lastBlob = null;

      this.cargaApi
        .relatorioSumidas({
          inicio: this.form.inicio || undefined,
          fim: this.form.fim || undefined,
          motorista: this.form.codigoMotorista || undefined,
          caminhao: this.form.codigoCaminhao || undefined,
        })
        .pipe(finalize(() => (this.cargasSumidasLoading = false)))
        .subscribe({
          next: (res) => (this.cargasSumidasResult = res),
          error: (e) => {
            this.cargasSumidasResult = null;
            this.errorMsg = extrairMensagemErro(e, 'Erro ao carregar relatório de cargas sumidas do WinThor.');
          },
        });
      return;
    }

    if (def.key === 'VIDA_UTIL_PNEU') {
      this.loading = false;
      this.vidaUtilLoading = true;
      this.pdfSafeUrl = null;
      this.lastBlob = null;
      this.lastFilename = 'relatorio.pdf';

      this.pneuApi
        .relatorioVidaUtil(this.form.codigoCaminhao || undefined, this.form.codigoPneu || undefined)
        .pipe(finalize(() => (this.vidaUtilLoading = false)))
        .subscribe({
          next: (res) => {
            this.vidaUtilResult = {
              filtroCaminhao: res?.filtroCaminhao || 'Todos',
              filtroPneu: res?.filtroPneu || 'Todos',
              totalPneus: Number(res?.totalPneus ?? 0),
              linhas: res?.linhas || [],
            };
          },
          error: (e) => {
            this.vidaUtilResult = null;
            this.errorMsg = extrairMensagemErro(e, 'Erro ao carregar relatório de vida útil.');
          },
        });
      return;
    }

    this.vidaUtilResult = null;
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

      case 'METAS_MOTORISTAS':
        req$ = this.api.metasMotoristas(this.form.inicio, this.form.fim, this.form.tipoMeta || undefined);
        break;

      case 'DESPESAS_CATEGORIAS':
        req$ = this.api.despesasPorCategoria(this.form.inicio, this.form.fim);
        break;

      case 'CARGA_COMPLETA':
        req$ = this.api.cargaCompleta(this.form.numeroCarga);
        break;

      case 'META_MENSAL_MOTORISTA':
        req$ = this.form.todosMotoristas
          ? this.api.metaMensalTodosMotoristas(this.form.inicio, this.form.fim)
          : this.api.metaMensalMotorista(this.form.codigoMotorista, this.form.inicio, this.form.fim);
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
          this.errorMsg = extrairMensagemErro(e, 'Erro ao gerar PDF.');
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
    this.vidaUtilResult = null;
    this.cargasSumidasResult = null;
    this.revokeObjectUrl();
  }

  exportarVidaUtilPneuPdf() {
    this.errorMsg = '';
    this.loading = true;
    this.api.vidaUtilPneu(this.form.codigoCaminhao || undefined, this.form.codigoPneu || undefined)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          const blob = res.body;
          if (!blob) {
            this.errorMsg = 'PDF vazio retornado pela API.';
            return;
          }
          const a = document.createElement('a');
          const url = URL.createObjectURL(blob);
          a.href = url;
          a.download = this.extractFilename(res.headers.get('content-disposition'), 'relatorio-vida-util-pneu.pdf');
          a.click();
          URL.revokeObjectURL(url);
        },
        error: (e) => {
          this.errorMsg = extrairMensagemErro(e, 'Erro ao exportar PDF.');
        },
      });
  }

  exportarCargasSumidasWinThorPdf() {
    this.errorMsg = '';
    this.loading = true;
    this.api
      .cargasSumidasWinThor({
        inicio: this.form.inicio || undefined,
        fim: this.form.fim || undefined,
        motorista: this.form.codigoMotorista || undefined,
        caminhao: this.form.codigoCaminhao || undefined,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          const blob = res.body;
          if (!blob) {
            this.errorMsg = 'PDF vazio retornado pela API.';
            return;
          }
          const a = document.createElement('a');
          const url = URL.createObjectURL(blob);
          a.href = url;
          a.download = this.extractFilename(res.headers.get('content-disposition'), 'relatorio-cargas-sumidas-winthor.pdf');
          a.click();
          URL.revokeObjectURL(url);
        },
        error: (e) => {
          this.errorMsg = extrairMensagemErro(e, 'Erro ao exportar PDF.');
        },
      });
  }

  /** Roda a reconciliação agora (sem esperar o job de 3h) e recarrega o relatório. */
  verificarAgora(): void {
    this.verificandoAgora = true;
    this.cargaApi
      .verificarWinThor()
      .pipe(finalize(() => (this.verificandoAgora = false)))
      .subscribe({
        next: () => {
          this.toast.success('Verificação concluída — recarregando relatório...');
          this.gerar();
        },
        error: (e) => this.toast.error(extrairMensagemErro(e, 'Não foi possível rodar a verificação agora.')),
      });
  }

  trackByCargaSumida(_: number, row: RelatorioCargaSumidaLinha): string {
    return row.numeroCarga;
  }

  formatText(v?: string | null): string {
    const t = (v || '').trim();
    return t || '-';
  }

  formatNumber(v?: number | null): string {
    if (v == null) return '-';
    const n = Number(v);
    if (!Number.isFinite(n)) return '-';
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatPercent(v?: number | null): string {
    if (v == null) return '-';
    const n = Number(v);
    if (!Number.isFinite(n)) return '-';
    return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  }

  trackByVidaUtil(_: number, row: PneuVidaUtilRelatorioLinha): string {
    return row.codigoPneu || `${row.numeroSerie || ''}-${row.caminhao || ''}`;
  }

  // ===== autocomplete =====
  get sugestoesRelCaminhao(): CaminhaoResponse[] {
    const q = (this.form.codigoCaminhao || '').trim().toLowerCase();
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

  get sugestoesRelMotorista(): MotoristaResponse[] {
    const q = (this.form.codigoMotorista || '').trim().toLowerCase();
    if (!q) return [];

    return (this.motoristas || [])
      .filter((m) => m.ativo !== false)
      .filter((m) => {
        const hay = [m.codigo, m.codigoExterno, m.nome, m.email, m.cnh]
          .map((x) => String(x || '').toLowerCase())
          .join(' | ');
        return hay.includes(q);
      })
      .slice(0, this.sugestoesMax);
  }

  onFocusRelCaminhao(): void {
    this.closeAllSugestoes();
    this.showSugRelCaminhao = true;
  }

  onInputRelCaminhao(): void {
    const hasQuery = (this.form.codigoCaminhao || '').trim().length > 0;
    this.closeAllSugestoes();
    this.showSugRelCaminhao = hasQuery;
  }

  onFocusRelMotorista(): void {
    this.closeAllSugestoes();
    this.showSugRelMotorista = true;
  }

  onInputRelMotorista(): void {
    const hasQuery = (this.form.codigoMotorista || '').trim().length > 0;
    this.closeAllSugestoes();
    this.showSugRelMotorista = hasQuery;
  }

  onBlurRelSugestao(): void {
    if (this.autocompleteBlurTimer) clearTimeout(this.autocompleteBlurTimer);
    this.autocompleteBlurTimer = setTimeout(() => this.closeAllSugestoes(), 140);
  }

  selectRelCaminhao(c: CaminhaoResponse): void {
    this.form.codigoCaminhao = c.codigo || c.codigoExterno || '';
    this.closeAllSugestoes();
  }

  selectRelMotorista(m: MotoristaResponse): void {
    this.form.codigoMotorista = m.codigo || m.codigoExterno || '';
    this.closeAllSugestoes();
  }

  onFocusRelCarga(): void {
    this.closeAllSugestoes();
    this.showSugRelCarga = true;
  }

  onInputRelCarga(): void {
    const q = (this.form.numeroCarga || '').trim();
    this.closeAllSugestoes();
    this.showSugRelCarga = q.length > 0;
    this.cargaQuery$.next(q);
  }

  selectRelCarga(c: CargaMinResponse): void {
    this.form.numeroCarga = c.numeroCarga;
    this.closeAllSugestoes();
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

  private closeAllSugestoes(): void {
    this.showSugRelCaminhao = false;
    this.showSugRelMotorista = false;
    this.showSugRelCarga = false;
  }

  private resetAutoComplete(): void {
    this.closeAllSugestoes();
    if (this.autocompleteBlurTimer) {
      clearTimeout(this.autocompleteBlurTimer);
      this.autocompleteBlurTimer = null;
    }
  }
}
