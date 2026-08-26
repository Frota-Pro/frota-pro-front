import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { PlanoManutencaoPreventivaApiService } from '../../core/api/plano-manutencao-preventiva-api.service';
import { PlanoManutencaoPreventivaRequest, PlanoManutencaoPreventivaResponse } from '../../core/api/plano-manutencao-preventiva-api.models';
import { CaminhaoApiService } from '../../core/api/caminhao-api.service';
import { CaminhaoResponse } from '../../core/api/caminhao-api.models';
import { ToastService } from '../../shared/ui/toast/toast.service';

const FORM_VAZIO: PlanoManutencaoPreventivaRequest = {
  caminhao: '',
  descricao: '',
  intervaloKm: null,
  intervaloDias: null,
  ativo: true,
};

@Component({
  selector: 'app-plano-manutencao-preventiva',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plano-manutencao-preventiva.component.html',
  styleUrls: ['./plano-manutencao-preventiva.component.css'],
})
export class PlanoManutencaoPreventivaComponent implements OnInit, OnDestroy {

  // filtros
  filtroCaminhao = '';
  filtroAtivo: '' | 'true' | 'false' = 'true';

  // paginação
  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;

  loading = false;
  errorMsg: string | null = null;
  rows: PlanoManutencaoPreventivaResponse[] = [];

  // combos / autocomplete
  caminhoes: CaminhaoResponse[] = [];
  showSugCaminhao = false;
  showSugFiltroCaminhao = false;
  readonly sugestoesMax = 8;
  private autocompleteBlurTimer: any = null;

  // modal
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  saving = false;
  form: PlanoManutencaoPreventivaRequest = { ...FORM_VAZIO };

  constructor(
    private api: PlanoManutencaoPreventivaApiService,
    private caminhaoApi: CaminhaoApiService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.preloadCombos();
    this.carregarPagina();
  }

  ngOnDestroy(): void {
    if (this.autocompleteBlurTimer) {
      clearTimeout(this.autocompleteBlurTimer);
      this.autocompleteBlurTimer = null;
    }
  }

  private preloadCombos(): void {
    this.caminhaoApi.listar({ page: 0, size: 200, sort: 'codigo,asc', ativo: true }).subscribe({
      next: (res) => (this.caminhoes = res.content || []),
      error: () => (this.caminhoes = []),
    });
  }

  // =========================
  // Listagem / filtros
  // =========================
  carregarPagina(page?: number): void {
    if (page != null) this.page = page;

    this.loading = true;
    this.errorMsg = null;

    this.api.listar({
      page: this.page,
      size: this.size,
      sort: 'descricao,asc',
      caminhao: this.filtroCaminhao.trim() || null,
      ativo: this.filtroAtivo === '' ? null : this.filtroAtivo === 'true',
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.content || [];
          this.totalPages = res.totalPages ?? 0;
          this.totalElements = res.totalElements ?? 0;
        },
        error: (err) => (this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar os planos de manutenção preventiva.')),
      });
  }

  aplicarFiltros(): void {
    this.page = 0;
    this.carregarPagina();
  }

  limparFiltros(): void {
    this.filtroCaminhao = '';
    this.filtroAtivo = 'true';
    this.aplicarFiltros();
  }

  // =========================
  // Autocomplete (filtro)
  // =========================
  get sugestoesFiltroCaminhao(): CaminhaoResponse[] {
    const q = (this.filtroCaminhao || '').trim().toLowerCase();
    if (!q) return [];
    return (this.caminhoes || [])
      .filter((c) => {
        const hay = [c.codigo, c.codigoExterno, c.placa, c.descricao].map((x) => String(x || '').toLowerCase()).join(' | ');
        return hay.includes(q);
      })
      .slice(0, this.sugestoesMax);
  }

  onFocusFiltroCaminhao(): void { this.showSugFiltroCaminhao = true; }

  onBlurFiltroSugestao(): void {
    if (this.autocompleteBlurTimer) clearTimeout(this.autocompleteBlurTimer);
    this.autocompleteBlurTimer = setTimeout(() => (this.showSugFiltroCaminhao = false), 140);
  }

  selecionarFiltroCaminhao(c: CaminhaoResponse): void {
    this.filtroCaminhao = c.codigo;
    this.showSugFiltroCaminhao = false;
    this.aplicarFiltros();
  }

  // =========================
  // Autocomplete (form)
  // =========================
  get sugestoesFormCaminhao(): CaminhaoResponse[] {
    const q = (this.form.caminhao || '').trim().toLowerCase();
    if (!q) return [];
    return (this.caminhoes || [])
      .filter((c) => {
        const hay = [c.codigo, c.codigoExterno, c.placa, c.descricao].map((x) => String(x || '').toLowerCase()).join(' | ');
        return hay.includes(q);
      })
      .slice(0, this.sugestoesMax);
  }

  onFocusFormCaminhao(): void { this.showSugCaminhao = true; }

  onBlurFormSugestao(): void {
    if (this.autocompleteBlurTimer) clearTimeout(this.autocompleteBlurTimer);
    this.autocompleteBlurTimer = setTimeout(() => (this.showSugCaminhao = false), 140);
  }

  selecionarFormCaminhao(c: CaminhaoResponse): void {
    this.form.caminhao = c.codigo;
    this.showSugCaminhao = false;
  }

  // =========================
  // Modal cadastro/edição
  // =========================
  abrirNovo(): void {
    this.isEditing = false;
    this.editingId = null;
    this.form = { ...FORM_VAZIO };
    this.showModal = true;
  }

  abrirEdicao(p: PlanoManutencaoPreventivaResponse): void {
    this.isEditing = true;
    this.editingId = p.id;
    this.form = {
      caminhao: p.codigoCaminhao,
      descricao: p.descricao,
      intervaloKm: p.intervaloKm ?? null,
      intervaloDias: p.intervaloDias ?? null,
      ativo: p.ativo,
    };
    this.showModal = true;
  }

  fecharModal(): void {
    if (this.saving) return;
    this.showModal = false;
  }

  salvar(): void {
    const erros = this.validarForm();
    if (erros.length) {
      this.toast.warn(erros[0], 'Validação');
      return;
    }

    const payload: PlanoManutencaoPreventivaRequest = {
      ...this.form,
      caminhao: this.form.caminhao.trim(),
      descricao: this.form.descricao.trim(),
      intervaloKm: this.form.intervaloKm != null && (this.form.intervaloKm as any) !== '' ? Number(this.form.intervaloKm) : null,
      intervaloDias: this.form.intervaloDias != null && (this.form.intervaloDias as any) !== '' ? Number(this.form.intervaloDias) : null,
    };

    this.saving = true;

    const req$ = this.isEditing && this.editingId
      ? this.api.atualizar(this.editingId, payload)
      : this.api.criar(payload);

    req$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.toast.success(this.isEditing ? 'Plano atualizado com sucesso.' : 'Plano cadastrado com sucesso.');
          this.showModal = false;
          this.carregarPagina();
        },
        error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível salvar o plano.')),
      });
  }

  private validarForm(): string[] {
    const erros: string[] = [];
    if (!this.form.caminhao || !this.form.caminhao.trim()) erros.push('Informe o caminhão.');
    if (!this.form.descricao || !this.form.descricao.trim()) erros.push('Informe a descrição.');
    if (this.form.intervaloKm == null && this.form.intervaloDias == null) {
      erros.push('Informe ao menos um intervalo: por KM ou por dias.');
    }
    return erros;
  }

  // =========================
  // Excluir
  // =========================
  excluir(p: PlanoManutencaoPreventivaResponse): void {
    if (!confirm(`Deseja excluir o plano "${p.descricao}" (${p.codigoCaminhao})?`)) return;

    this.api.deletar(p.id).subscribe({
      next: () => {
        this.toast.success('Plano excluído com sucesso.');
        this.carregarPagina();
      },
      error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível excluir o plano.')),
    });
  }

  // =========================
  // Helpers de exibição
  // =========================
  formatDateBr(value?: string | null): string {
    if (!value) return '—';
    const [y, m, d] = value.slice(0, 10).split('-');
    if (!y || !m || !d) return value;
    return `${d}/${m}/${y}`;
  }

  formatKm(v?: number | null): string {
    if (v == null) return '—';
    return v.toLocaleString('pt-BR') + ' km';
  }

  situacaoLabel(situacao?: string | null): string {
    switch (situacao) {
      case 'VENCIDO': return 'Vencido';
      case 'VENCENDO': return 'Vencendo';
      default: return 'Em dia';
    }
  }
}
