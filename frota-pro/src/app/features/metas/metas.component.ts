import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import { MetaApiService } from '../../core/api/meta-api.service';
import { MetaRequest, MetaResponse } from '../../core/api/meta-api.models';
import { PageResponse } from '../../core/api/page.models';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { CaminhaoApiService } from '../../core/api/caminhao-api.service';
import { CaminhaoResponse } from '../../core/api/caminhao-api.models';
import { MotoristaApiService } from '../../core/api/motorista-api.service';
import { MotoristaResponse } from '../../core/api/motorista-api.models';

type StatusMeta = 'NAO_INICIADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' | string;
type TipoMetaKey = 'QUILOMETRAGEM' | 'CONSUMO_COMBUSTIVEL' | 'TONELADA' | 'CARGA_TRANSPORTADA' | string;

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

  tiposMeta: Array<{ value: TipoMetaKey; label: string; unidade: string }> = [
    { value: 'QUILOMETRAGEM', label: 'Meta de quilometragem', unidade: 'km' },
    { value: 'CONSUMO_COMBUSTIVEL', label: 'Meta de consumo de combustível', unidade: 'km/l' },
    { value: 'TONELADA', label: 'Meta de tonelada da carga', unidade: 't' },
    { value: 'CARGA_TRANSPORTADA', label: 'Meta de carga transportada', unidade: 'cargas' },
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

  constructor(
    private api: MetaApiService,
    private router: Router,
    private toast: ToastService,
    private caminhaoApi: CaminhaoApiService,
    private motoristaApi: MotoristaApiService
  ) {}

  ngOnInit(): void {
    this.preloadCombos();
    this.carregar();
  }

  ngOnDestroy(): void {
    this.resetAutoComplete();
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

  // ===== filtros (client-side) =====
  getStatusLabel(m: MetaResponse): string {
    return this.normalizeStatusLabel(m.statusMeta) || 'EM_ANDAMENTO';
  }

  getProgressPercent(m: MetaResponse): number {
    const meta = Number(m.valorMeta || 0);
    const atual = Number(m.valorRealizado || 0);
    if (!meta || meta <= 0) return 0;
    const pct = (atual / meta) * 100;
    return Math.max(0, Math.min(100, pct));
  }


  get metasFiltradas(): MetaResponse[] {
    const t = (this.searchTerm || '').toLowerCase().trim();
    const st = (this.filtroStatus || '').toUpperCase().trim();

    return (this.metas || []).filter((m) => {
      if (st) {
        const status = this.getStatusLabel(m);
        if (status !== st) return false;
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

  onFocusMetaMotorista(): void {
    this.closeAllSugestoes();
    this.showSugMetaMotorista = true;
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

  private normalizeStatusLabel(v: string | null | undefined): string {
    const s = String(v || '').trim().toUpperCase();
    if (s === 'FINALIZADA') return 'CONCLUIDA';
    return s;
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
