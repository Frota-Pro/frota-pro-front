import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { catchError, map } from 'rxjs/operators';
import { Observable, of, Subscription } from 'rxjs';

import { MetaApiService } from '../../core/api/meta-api.service';
import {
  DesempenhoCategoriaMetaLinha,
  DesempenhoCategoriaMetaResponse,
  DesempenhoMetasLinha,
  DesempenhoMetasParams,
  DesempenhoMetasResponse,
  MetaRequest,
  MetaResponse,
  StatusDesempenhoMeta,
  TipoMetaResponse
} from '../../core/api/meta-api.models';
import { PageResponse } from '../../core/api/page.models';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { CaminhaoApiService } from '../../core/api/caminhao-api.service';
import { CaminhaoResponse } from '../../core/api/caminhao-api.models';
import { MotoristaApiService } from '../../core/api/motorista-api.service';
import { MotoristaResponse } from '../../core/api/motorista-api.models';
import { CategoriaCaminhaoApiService } from '../../core/api/categoria-caminhao-api.service';
import { CategoriaCaminhaoResponse } from '../../core/api/categoria-caminhao-api.models';
import { RelatorioPdfApiService } from '../../core/api/relatorio-pdf-api.service';
import {
  normalizeStatusDesempenho,
  statusDesempenhoClass,
  statusDesempenhoLabel
} from '../../shared/utils/meta-performance-status';

type StatusMeta = 'NAO_INICIADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' | string;
type TipoMetaKey = 'QUILOMETRAGEM' | 'CONSUMO_COMBUSTIVEL' | 'TONELADA' | 'CARGA_TRANSPORTADA' | string;
type DesempenhoFiltroModo = 'periodo' | 'data';
type DesempenhoAlvoFiltro = '' | 'caminhao' | 'motorista' | 'categoria';
type TipoMetaOption = { value: TipoMetaKey; label: string; unidade: string; regraAtingimentoTexto: string | null };

@Component({
  selector: 'app-metas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './metas.component.html',
  styleUrls: ['./metas.component.css'],
})
export class MetasComponent implements OnInit, OnDestroy {
  // filtros
  searchTerm = '';
  filtroStatus: '' | 'NAO_INICIADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' = '';
  filtroDesempenho: '' | StatusDesempenhoMeta = '';

  // paginação
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;

  // estados
  loading = false;
  errorMsg: string | null = null;

  // dados
  metas: MetaResponse[] = [];
  caminhoes: CaminhaoResponse[] = [];
  motoristas: MotoristaResponse[] = [];
  categorias: CategoriaCaminhaoResponse[] = [];
  desempenhoCategoria: DesempenhoCategoriaMetaResponse | null = null;
  desempenhoCategoriaCodigo = '';
  desempenhoFiltroModo: DesempenhoFiltroModo = 'periodo';
  desempenhoInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  desempenhoFim = new Date().toISOString().slice(0, 10);
  desempenhoDataReferencia = new Date().toISOString().slice(0, 10);
  desempenhoLoading = false;
  desempenhoPdfLoading = false;
  desempenhoError: string | null = null;
  desempenhoUnificadoLinhas: DesempenhoMetasLinha[] = [];
  desempenhoUnificadoInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  desempenhoUnificadoFim = new Date().toISOString().slice(0, 10);
  desempenhoUnificadoTipoMeta = '';
  desempenhoUnificadoAlvo: DesempenhoAlvoFiltro = '';
  desempenhoUnificadoAlvoCodigo = '';
  desempenhoUnificadoLoading = false;
  desempenhoUnificadoPdfLoading = false;
  desempenhoUnificadoError: string | null = null;

  tiposMeta: TipoMetaOption[] = [
    { value: 'QUILOMETRAGEM', label: 'Meta de quilometragem', unidade: 'km', regraAtingimentoTexto: null },
    { value: 'CONSUMO_COMBUSTIVEL', label: 'Meta de consumo de combustível', unidade: 'km/l', regraAtingimentoTexto: null },
    { value: 'TONELADA', label: 'Meta de tonelada da carga', unidade: 't', regraAtingimentoTexto: null },
    { value: 'CARGA_TRANSPORTADA', label: 'Meta de carga transportada', unidade: 'cargas', regraAtingimentoTexto: null },
  ];

  // modal/form
  showModal = false;
  saving = false;
  editing: MetaResponse | null = null;

  form: MetaRequest = {
    dataIncio: '',
    dataFim: '',
    tipoMeta: '',
    valorMeta: 0,
    valorRealizado: null,
    unidade: null,
    statusMeta: 'EM_ANDAMENTO',
    descricao: null,
    caminhao: null,
    categoria: null,
    motorista: null,
    renovarAutomaticamente: false,
    recalcularProgresso: true,
  };

  // autocomplete
  showSugMetaCaminhao = false;
  showSugMetaMotorista = false;
  readonly sugestoesMax = 8;

  private autocompleteBlurTimer: any = null;
  private metasInvalidatedSub: Subscription | null = null;

  constructor(
    private api: MetaApiService,
    private router: Router,
    private toast: ToastService,
    private caminhaoApi: CaminhaoApiService,
    private motoristaApi: MotoristaApiService,
    private categoriaApi: CategoriaCaminhaoApiService,
    private relatorioPdfApi: RelatorioPdfApiService
  ) {}

  ngOnInit(): void {
    this.carregarTiposMeta();
    this.preloadCombos();
    this.carregar();
    this.metasInvalidatedSub = this.api.invalidated$.subscribe(() => this.carregar());
  }

  ngOnDestroy(): void {
    this.resetAutoComplete();
    this.metasInvalidatedSub?.unsubscribe();
    this.metasInvalidatedSub = null;
  }

  carregar(): void {
    this.loading = true;
    this.errorMsg = null;

    this.api
      .listar({ page: this.page, size: this.size, sort: 'dataIncio,desc' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (p: PageResponse<MetaResponse>) => {
          this.metas = p.content || [];
          this.totalPages = p.totalPages ?? 0;
          this.totalElements = p.totalElements ?? 0;
        },
        error: (err) => {
          console.error(err);
          this.metas = [];
          this.totalPages = 0;
          this.totalElements = 0;
          this.errorMsg = 'Não foi possível carregar as metas.';
        },
      });
  }

  carregarDesempenhoUnificado(): void {
    const params = this.getDesempenhoUnificadoParams();
    if (!params) return;

    this.desempenhoUnificadoLoading = true;
    this.desempenhoUnificadoError = null;

    this.api.desempenho(params)
      .pipe(finalize(() => (this.desempenhoUnificadoLoading = false)))
      .subscribe({
        next: (res) => {
          this.desempenhoUnificadoLinhas = Array.isArray(res)
            ? res
            : ((res as DesempenhoMetasResponse).linhas || []);
        },
        error: (err) => {
          console.error(err);
          this.desempenhoUnificadoLinhas = [];
          this.desempenhoUnificadoError = 'Não foi possível carregar o desempenho unificado de metas.';
        },
      });
  }

  gerarPdfDesempenhoUnificado(): void {
    const params = this.getDesempenhoUnificadoParams();
    if (!params) return;

    this.desempenhoUnificadoPdfLoading = true;
    this.desempenhoUnificadoError = null;

    this.relatorioPdfApi.desempenhoMetas(params)
      .pipe(finalize(() => (this.desempenhoUnificadoPdfLoading = false)))
      .subscribe({
        next: (res) => {
          const blob = res.body;
          if (!blob) {
            this.desempenhoUnificadoError = 'PDF vazio retornado pela API.';
            return;
          }

          const filename = this.extractFilename(
            res.headers.get('content-disposition'),
            `desempenho-metas-${params.inicio}-${params.fim}.pdf`
          );
          this.downloadBlob(blob, filename);
        },
        error: (err) => {
          console.error(err);
          this.desempenhoUnificadoError = 'Não foi possível gerar o PDF de desempenho de metas.';
        },
      });
  }

  onDesempenhoUnificadoAlvoChange(): void {
    this.desempenhoUnificadoAlvoCodigo = '';
  }

  desempenhoUnificadoTotal(): number {
    return this.desempenhoUnificadoLinhas.length;
  }

  desempenhoUnificadoBateu(): number {
    return this.desempenhoUnificadoLinhas.filter((l) => normalizeStatusDesempenho(l.status) === 'BATEU').length;
  }

  desempenhoUnificadoNaoBateu(): number {
    return this.desempenhoUnificadoLinhas.filter((l) => normalizeStatusDesempenho(l.status) === 'NAO_BATEU').length;
  }

  desempenhoUnificadoNaoIniciado(): number {
    return this.desempenhoUnificadoLinhas.filter((l) => normalizeStatusDesempenho(l.status) === 'NAO_INICIADO').length;
  }

  desempenhoUnificadoPercentualSucesso(): string {
    const total = this.desempenhoUnificadoTotal();
    if (!total) return '0%';
    return `${this.formatNumber((this.desempenhoUnificadoBateu() / total) * 100, 1)}%`;
  }

  // ===== filtros (client-side) =====
  getStatusLabel(m: MetaResponse): string {
    return this.normalizeStatusLabel(m.statusMeta) || 'EM_ANDAMENTO';
  }

  getProgressPercent(m: MetaResponse): number {
    return this.clampPercent(m.percentual);
  }


  get metasFiltradas(): MetaResponse[] {
    const t = (this.searchTerm || '').toLowerCase().trim();
    const st = (this.filtroStatus || '').toUpperCase().trim();
    const desempenho = this.filtroDesempenho;

    return (this.metas || []).filter((m) => {
      if (st) {
        const status = this.getStatusLabel(m);
        if (status !== st) return false;
      }

      if (desempenho && normalizeStatusDesempenho(m.statusDesempenho) !== desempenho) {
        return false;
      }

      if (t) {
        const hay = [
          m.tipoMeta || '',
          m.descricao || '',
          m.caminhaoCodigo || '',
          m.caminhaoDescricao || '',
          m.motoristaCodigo || '',
          m.motoristaDescricao || '',
          m.categoriaCodigo || '',
          m.categoriaDescricao || '',
        ]
          .join(' ')
          .toLowerCase();

        if (!hay.includes(t)) return false;
      }

      return true;
    });
  }

  // ===== navegação =====
  abrirDetalhe(m: MetaResponse): void {
    this.router.navigate(['/dashboard/metas', m.id]);
  }

  // ===== paginação =====
  prevPage(): void {
    if (this.page <= 0) return;
    this.page--;
    this.carregar();
  }

  nextPage(): void {
    if (this.page >= this.totalPages - 1) return;
    this.page++;
    this.carregar();
  }

  // ===== modal =====
  openAdd(): void {
    this.editing = null;
    const today = new Date().toISOString().slice(0, 10);
    this.form = {
      dataIncio: today,
      dataFim: today,
      tipoMeta: '',
      valorMeta: 0,
      valorRealizado: null,
      unidade: null,
      statusMeta: 'EM_ANDAMENTO',
      descricao: null,
      caminhao: null,
      categoria: null,
      motorista: null,
      renovarAutomaticamente: false,
      recalcularProgresso: true,
    };
    this.resetAutoComplete();
    this.showModal = true;
  }

  openEdit(m: MetaResponse): void {
    this.editing = m;
    this.form = {
      dataIncio: m.dataIncio,
      dataFim: m.dataFim,
      tipoMeta: m.tipoMeta,
      valorMeta: Number(m.valorMeta || 0),
      valorRealizado: m.valorRealizado ?? null,
      unidade: m.unidade || null,
      statusMeta: this.toApiStatus(m.statusMeta || 'EM_ANDAMENTO'),
      descricao: m.descricao || null,
      caminhao: m.caminhaoCodigo || null,
      categoria: m.categoriaCodigo || null,
      motorista: m.motoristaCodigo || null,
      renovarAutomaticamente: !!m.renovarAutomaticamente,
      recalcularProgresso: m.recalcularProgresso ?? true,
    };
    this.resetAutoComplete();
    this.showModal = true;
  }

  onTipoMetaChange(): void {
    const unit = this.getUnidadeDefault(this.form.tipoMeta);
    if (unit) this.form.unidade = unit;
  }

  regraTipoSelecionado(): string {
    const tipo = String(this.form.tipoMeta || '').trim().toUpperCase();
    if (!tipo) return '';
    const found = this.tiposMeta.find((x) => String(x.value).toUpperCase() === tipo);
    return found?.regraAtingimentoTexto || '';
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
    this.editing = null;
    this.resetAutoComplete();
  }

  // ===== autocomplete =====
  get sugestoesMetaCaminhao(): CaminhaoResponse[] {
    const q = String(this.form.caminhao || '').trim().toLowerCase();
    if (!q) return [];

    return (this.caminhoes || [])
      .filter((c) => c.ativo !== false)
      .filter((c) => {
        const hay = [
          c.codigo,
          c.codigoExterno,
          c.placa,
          c.descricao,
          c.marca,
          c.modelo,
        ]
          .map((x) => String(x || '').toLowerCase())
          .join(' | ');
        return hay.includes(q);
      })
      .slice(0, this.sugestoesMax);
  }

  get sugestoesMetaMotorista(): MotoristaResponse[] {
    const q = String(this.form.motorista || '').trim().toLowerCase();
    if (!q) return [];

    return (this.motoristas || [])
      .filter((m) => m.ativo !== false)
      .filter((m) => {
        const hay = [
          m.codigo,
          m.codigoExterno,
          m.nome,
          m.email,
          m.cnh,
        ]
          .map((x) => String(x || '').toLowerCase())
          .join(' | ');
        return hay.includes(q);
      })
      .slice(0, this.sugestoesMax);
  }

  onFocusMetaCaminhao(): void {
    this.closeAllSugestoes();
    this.showSugMetaCaminhao = true;
  }

  onInputMetaCaminhao(): void {
    const hasQuery = String(this.form.caminhao || '').trim().length > 0;
    this.closeAllSugestoes();
    this.showSugMetaCaminhao = hasQuery;
  }

  onFocusMetaMotorista(): void {
    this.closeAllSugestoes();
    this.showSugMetaMotorista = true;
  }

  onInputMetaMotorista(): void {
    const hasQuery = String(this.form.motorista || '').trim().length > 0;
    this.closeAllSugestoes();
    this.showSugMetaMotorista = hasQuery;
  }

  onBlurMetaSugestao(): void {
    if (this.autocompleteBlurTimer) clearTimeout(this.autocompleteBlurTimer);
    this.autocompleteBlurTimer = setTimeout(() => this.closeAllSugestoes(), 140);
  }

  selectMetaCaminhao(c: CaminhaoResponse): void {
    this.form.caminhao = c.codigo || c.codigoExterno || null;
    this.form.motorista = null;
    this.form.categoria = null;
    this.closeAllSugestoes();
  }

  selectMetaMotorista(m: MotoristaResponse): void {
    this.form.motorista = m.codigo || m.codigoExterno || null;
    this.form.caminhao = null;
    this.form.categoria = null;
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
    this.categoriaApi.listarTodas().subscribe({
      next: (res) => {
        this.categorias = (res.content || []).filter((c) => c.ativo !== false);
        if (!this.desempenhoCategoriaCodigo && this.categorias.length > 0) {
          this.desempenhoCategoriaCodigo = this.categorias[0].codigo;
          this.carregarDesempenhoCategoria();
        }
      },
      error: () => (this.categorias = []),
    });
  }

  carregarTiposMeta(): void {
    this.api.tipos().subscribe({
      next: (tipos) => {
        if (!Array.isArray(tipos) || tipos.length === 0) return;
        const mapped = tipos
          .map((t: TipoMetaResponse) => {
            const value = String(t.codigo || t.tipoMeta || '').trim();
            if (!value) return null;
            return {
              value,
              label: t.label || t.descricao || value,
              unidade: t.unidade || '',
              regraAtingimentoTexto: t.regraAtingimentoTexto || null,
            };
          })
          .filter((t): t is TipoMetaOption => !!t);

        if (mapped.length > 0) this.tiposMeta = mapped;
      },
      error: () => null,
    });
  }

  carregarDesempenhoCategoria(): void {
    const codigo = this.desempenhoCategoriaCodigo.trim();
    if (!codigo) {
      this.desempenhoError = 'Informe a categoria para consultar o desempenho.';
      this.desempenhoCategoria = null;
      return;
    }
    if (!this.validarFiltroDesempenho()) {
      this.desempenhoCategoria = null;
      return;
    }

    this.desempenhoLoading = true;
    this.desempenhoError = null;

    this.api
      .desempenhoCategoria(codigo, this.getDesempenhoParams())
      .pipe(finalize(() => (this.desempenhoLoading = false)))
      .subscribe({
        next: (res) => (this.desempenhoCategoria = res),
        error: (err) => {
          console.error(err);
          this.desempenhoCategoria = null;
          this.desempenhoError = 'Não foi possível carregar o desempenho da categoria.';
        },
      });
  }

  gerarPdfDesempenhoCategoria(): void {
    const codigo = this.desempenhoCategoriaCodigo.trim();
    if (!codigo) {
      this.desempenhoError = 'Informe a categoria para gerar o PDF.';
      return;
    }
    if (!this.validarFiltroDesempenho()) return;

    this.desempenhoPdfLoading = true;
    this.desempenhoError = null;

    this.relatorioPdfApi
      .metasPorCategoria(codigo, this.getDesempenhoParams())
      .pipe(finalize(() => (this.desempenhoPdfLoading = false)))
      .subscribe({
        next: (res) => {
          const blob = res.body;
          if (!blob) {
            this.desempenhoError = 'PDF vazio retornado pela API.';
            return;
          }

          const filename = this.extractFilename(
            res.headers.get('content-disposition'),
            `metas-categoria-${codigo}-${this.desempenhoPeriodoLabel().replace(/\//g, '-')}.pdf`
          );
          this.downloadBlob(blob, filename);
        },
        error: (err) => {
          console.error(err);
          this.desempenhoError = 'Não foi possível gerar o PDF de metas por categoria.';
        },
      });
  }

  desempenhoPeriodoLabel(): string {
    const res = this.desempenhoCategoria;
    const inicio = res?.inicio || (this.desempenhoFiltroModo === 'periodo' ? this.desempenhoInicio : '');
    const fim = res?.fim || (this.desempenhoFiltroModo === 'periodo' ? this.desempenhoFim : '');
    if (inicio && fim) return `${this.formatDateBr(inicio)} a ${this.formatDateBr(fim)}`;
    const data = res?.dataReferencia || this.desempenhoDataReferencia;
    return this.formatDateBr(data);
  }

  private closeAllSugestoes(): void {
    this.showSugMetaCaminhao = false;
    this.showSugMetaMotorista = false;
  }

  private resetAutoComplete(): void {
    this.closeAllSugestoes();
    if (this.autocompleteBlurTimer) {
      clearTimeout(this.autocompleteBlurTimer);
      this.autocompleteBlurTimer = null;
    }
  }

  salvar(): void {
    const errors = this.validateForm(this.form);
    if (errors.length) {
      this.toast.warn(errors.join(' • '), 'Validação');
      return;
    }
    this.saving = true;

    const req: MetaRequest = {
      ...this.form,
      dataIncio: this.toApiDateString(this.form.dataIncio),
      dataFim: this.toApiDateString(this.form.dataFim),
      statusMeta: this.toApiStatus(this.form.statusMeta),
      caminhao: this.emptyToNull(this.form.caminhao),
      categoria: this.emptyToNull(this.form.categoria),
      motorista: this.emptyToNull(this.form.motorista),
      unidade: this.emptyToNull(this.form.unidade),
      descricao: this.emptyToNull(this.form.descricao),
    };

    this.validarDuplicidadeAtiva(req).subscribe((duplicada) => {
      if (duplicada) {
        this.saving = false;
        this.toast.warn(
          'Já existe meta ativa do mesmo tipo para o mesmo alvo no período informado.',
          'Validação'
        );
        return;
      }

      const obs = this.editing
        ? this.api.atualizar(this.editing.id, req)
        : this.api.criar(req);

      obs
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.closeModal();
            this.carregar();
            this.toast.success(
              this.editing ? 'Meta atualizada com sucesso.' : 'Meta criada com sucesso.'
            );
          },
          error: (err) => {
            console.error(err);
            this.toast.error('Não foi possível salvar a meta.');
          },
        });
    });
  }

  concluir(m: MetaResponse): void {
    if (!confirm('Concluir esta meta?')) return;

    const req: MetaRequest = {
      dataIncio: this.toApiDateString(m.dataIncio),
      dataFim: this.toApiDateString(m.dataFim),
      tipoMeta: m.tipoMeta,
      valorMeta: Number(m.valorMeta || 0),
      valorRealizado: m.valorRealizado ?? null,
      unidade: m.unidade || null,
      statusMeta: 'CONCLUIDA',
      descricao: m.descricao || null,
      caminhao: m.caminhaoCodigo || null,
      categoria: m.categoriaCodigo || null,
      motorista: m.motoristaCodigo || null,
      renovarAutomaticamente: !!m.renovarAutomaticamente,
      recalcularProgresso: m.recalcularProgresso ?? true,
    };

    this.loading = true;
    this.api
      .atualizar(m.id, req)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.carregar();
          this.toast.success('Meta concluída com sucesso.');
        },
        error: () => this.toast.error('Não foi possível concluir a meta.'),
      });
  }

  excluir(m: MetaResponse): void {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
    this.loading = true;
    this.api
      .deletar(m.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.carregar();
          this.toast.success('Meta excluída com sucesso.');
        },
        error: () => this.toast.error('Não foi possível excluir a meta.'),
      });
  }

  private validateForm(form: MetaRequest): string[] {
    const errors: string[] = [];
    const tipo = (form.tipoMeta || '').trim();
    const status = String(form.statusMeta || '').trim();
    const unidade = (form.unidade || '').toString().trim();

    if (!tipo) errors.push('Informe o tipo da meta.');
    if (!status) errors.push('Informe o status da meta.');
    if (!form.dataIncio || !form.dataFim) errors.push('Informe o período.');

    const ini = this.parseDate(form.dataIncio);
    const fim = this.parseDate(form.dataFim);
    if (ini && fim && fim < ini) errors.push('A data fim deve ser maior ou igual à data início.');

    if (!form.valorMeta || form.valorMeta <= 0) errors.push('Informe um valor de meta maior que zero.');
    if (!unidade) errors.push('Informe a unidade da meta.');

    const caminhao = this.emptyToNull(form.caminhao);
    const categoria = this.emptyToNull(form.categoria);
    const motorista = this.emptyToNull(form.motorista);
    const targetCount = [caminhao, categoria, motorista].filter((v) => v != null).length;
    if (targetCount !== 1) {
      errors.push('Informe apenas um alvo: caminhão, categoria ou motorista.');
    }

    return errors;
  }

  private validarDuplicidadeAtiva(form: MetaRequest): Observable<boolean> {
    const inicio = this.toIsoDateString(form.dataIncio);
    const fim = this.toIsoDateString(form.dataFim);
    const tipo = String(form.tipoMeta || '').trim().toUpperCase();
    const caminhao = this.emptyToNull(form.caminhao);
    const categoria = this.emptyToNull(form.categoria);
    const motorista = this.emptyToNull(form.motorista);

    if (!inicio || !fim || !tipo) return of(false);
    if (!caminhao && !categoria && !motorista) return of(false);

    return this.api
      .historico({ caminhao, categoria, motorista, inicio, fim })
      .pipe(
        map((list) => {
          const reqIni = this.parseDate(inicio);
          const reqFim = this.parseDate(fim);
          if (!reqIni || !reqFim) return false;

          return (list || []).some((m) => {
            if (this.editing?.id && m.id === this.editing.id) return false;
            if (String(m.tipoMeta || '').trim().toUpperCase() !== tipo) return false;
            if (!this.isMetaAtivaStatus(m.statusMeta)) return false;

            const mIni = this.parseDate(m.dataIncio);
            const mFim = this.parseDate(m.dataFim);
            if (!mIni || !mFim) return false;

            return this.periodosSobrepostos(reqIni, reqFim, mIni, mFim);
          });
        }),
        catchError(() => of(false))
      );
  }

  private isMetaAtivaStatus(status: string | null | undefined): boolean {
    const s = this.toApiStatus(status);
    return s !== 'CONCLUIDA' && s !== 'CANCELADA';
  }

  private periodosSobrepostos(iniA: Date, fimA: Date, iniB: Date, fimB: Date): boolean {
    return iniA <= fimB && iniB <= fimA;
  }

  private toIsoDateString(v: string | null | undefined): string {
    const s = String(v || '').trim();
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const [dd, mm, yyyy] = s.split('/');
      return `${yyyy}-${mm}-${dd}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
    return s;
  }

  private getUnidadeDefault(tipo: string | null | undefined): string | null {
    const t = (tipo || '').toUpperCase();
    const found = this.tiposMeta.find((x) => x.value === t);
    return found?.unidade ?? null;
  }

  private validarFiltroDesempenho(): boolean {
    if (this.desempenhoFiltroModo === 'periodo') {
      if (!this.desempenhoInicio || !this.desempenhoFim) {
        this.desempenhoError = 'Informe início e fim para consultar o desempenho.';
        return false;
      }
      if (this.desempenhoInicio > this.desempenhoFim) {
        this.desempenhoError = 'Período inválido: início maior que fim.';
        return false;
      }
      return true;
    }

    if (!this.desempenhoDataReferencia) {
      this.desempenhoError = 'Informe a data de referência.';
      return false;
    }
    return true;
  }

  private getDesempenhoParams(): { dataReferencia?: string | null; inicio?: string | null; fim?: string | null } {
    if (this.desempenhoFiltroModo === 'periodo') {
      return { inicio: this.desempenhoInicio, fim: this.desempenhoFim };
    }
    return { dataReferencia: this.desempenhoDataReferencia };
  }

  formatDateBr(value: string | null | undefined): string {
    const v = String(value || '').trim();
    if (!v) return '—';
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
      const [y, m, d] = v.slice(0, 10).split('-');
      return `${d}/${m}/${y}`;
    }
    return v;
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const v = String(value).trim();
    if (!v) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
      const [d, m, y] = v.split('/').map(Number);
      return new Date(y, m - 1, d);
    }
    return null;
  }

  private emptyToNull(v: any): any {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s ? v : null;
  }

  private extractFilename(contentDisposition: string | null, fallback: string): string {
    if (!contentDisposition) return fallback;

    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
    if (utf8?.[1]) return decodeURIComponent(utf8[1].replace(/"/g, ''));

    const plain = /filename="?([^"]+)"?/i.exec(contentDisposition);
    return plain?.[1] || fallback;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private normalizeStatusLabel(v: string | null | undefined): string {
    const s = String(v || '').trim().toUpperCase();
    if (s === 'FINALIZADA') return 'CONCLUIDA';
    return s;
  }

  regraAtingimentoLabel(regra: string | null | undefined): string {
    switch (String(regra || '').trim().toUpperCase()) {
      case 'MENOR_OU_IGUAL':
        return 'Menor ou igual à meta';
      case 'MAIOR_OU_IGUAL':
        return 'Maior ou igual à meta';
      default:
        return regra || '—';
    }
  }

  resultadoLabel(status?: string | null): string {
    return statusDesempenhoLabel(status);
  }

  resultadoClasse(status?: string | null): 'success' | 'danger' | 'neutral' {
    return statusDesempenhoClass(status);
  }

  desempenhoPercent(linha: DesempenhoCategoriaMetaLinha): number {
    return this.clampPercent(linha.percentual);
  }

  desempenhoUnificadoPercent(linha: DesempenhoMetasLinha): number {
    return this.clampPercent(linha.percentual);
  }

  desempenhoAlvoLabel(linha: DesempenhoMetasLinha): string {
    if (linha.alvoTipo === 'MOTORISTA') return 'Motorista';
    return 'Caminhão';
  }

  desempenhoCodigoLabel(linha: DesempenhoMetasLinha): string {
    if (linha.alvoTipo === 'MOTORISTA') return linha.motoristaCodigo || '—';
    return linha.caminhaoCodigo || '—';
  }

  desempenhoOrigemLabel(linha: DesempenhoMetasLinha): string {
    return linha.origemMetaDescricao || linha.origemMeta || '—';
  }

  desempenhoOrigemCategoria(linha: DesempenhoMetasLinha): boolean {
    return String(linha.origemMeta || '').toUpperCase() === 'CATEGORIA';
  }

  desempenhoStatusLabel(linha: DesempenhoMetasLinha): string {
    return this.resultadoLabel(linha.status);
  }

  formatNumber(value: number | null | undefined, dec = 2): string {
    const n = Number(value ?? 0);
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    }).format(Number.isFinite(n) ? n : 0);
  }

  private clampPercent(value: number | null | undefined): number {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }

  private getDesempenhoUnificadoParams(): DesempenhoMetasParams | null {
    if (!this.desempenhoUnificadoInicio || !this.desempenhoUnificadoFim) {
      this.desempenhoUnificadoError = 'Informe início e fim para consultar o desempenho.';
      return null;
    }
    if (this.desempenhoUnificadoInicio > this.desempenhoUnificadoFim) {
      this.desempenhoUnificadoError = 'Período inválido: início maior que fim.';
      return null;
    }
    if (this.desempenhoUnificadoAlvo && !this.desempenhoUnificadoAlvoCodigo.trim()) {
      this.desempenhoUnificadoError = 'Informe o código do alvo selecionado.';
      return null;
    }

    const params: DesempenhoMetasParams = {
      inicio: this.desempenhoUnificadoInicio,
      fim: this.desempenhoUnificadoFim,
      tipoMeta: this.desempenhoUnificadoTipoMeta || null,
    };

    const codigo = this.desempenhoUnificadoAlvoCodigo.trim();
    if (this.desempenhoUnificadoAlvo === 'caminhao') params.caminhao = codigo;
    if (this.desempenhoUnificadoAlvo === 'motorista') params.motorista = codigo;
    if (this.desempenhoUnificadoAlvo === 'categoria') params.categoria = codigo;

    return params;
  }

  private toApiStatus(v: string | null | undefined): string {
    const s = String(v || '').trim().toUpperCase();
    if (!s) return 'EM_ANDAMENTO';
    if (s === 'FINALIZADA') return 'CONCLUIDA';
    return s;
  }

  private toApiDateString(v: string | null | undefined): string {
    const s = String(v || '').trim();
    if (!s) return s;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [yyyy, mm, dd] = s.split('-');
      return `${dd}/${mm}/${yyyy}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
      const [datePart] = s.split('T');
      const [yyyy, mm, dd] = datePart.split('-');
      return `${dd}/${mm}/${yyyy}`;
    }
    return s;
  }
}
