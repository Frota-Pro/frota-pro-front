import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { CaminhaoApiService } from '../../../core/api/caminhao-api.service';
import { CategoriaCaminhaoApiService } from '../../../core/api/categoria-caminhao-api.service';
import {
  CaminhaoRequest,
  CaminhaoResponse,
  VincularCategoriaCaminhaoEmLoteRequest,
} from '../../../core/api/caminhao-api.models';
import { CategoriaCaminhaoRequest, CategoriaCaminhaoResponse } from '../../../core/api/categoria-caminhao-api.models';

type AtivoFiltro = 'TODOS' | 'ATIVOS' | 'INATIVOS';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

@Component({
  selector: 'app-caminhoes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './caminhoes-list.component.html',
  styleUrls: ['./caminhoes-list.component.css'],
})
export class CaminhoesListComponent implements OnInit {
  // filtros
  search = '';
  ativoFilter: AtivoFiltro = 'ATIVOS';

  // paginação
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  // dados
  caminhoes: CaminhaoResponse[] = [];
  categorias: CategoriaCaminhaoResponse[] = [];

  // seleção em massa
  selected = new Set<string>();
  categoriaSelecionada = '';

  // ui
  loading = false;
  errorMsg: string | null = null;

  // toasts
  toasts: ToastItem[] = [];

  // modal criar categoria
  showCategoriaModal = false;
  catForm: CategoriaCaminhaoRequest = { codigo: '', descricao: '' };

  // modal criar/editar caminhao (simples)
  showCaminhaoModal = false;
  isEditing = false;
  editCodigo: string | null = null;
  form: CaminhaoRequest = {
    descricao: '',
    modelo: '',
    marca: '',
    placa: '',
    categoria: null,
    dtLicenciamento: null,
  };

  constructor(
    private router: Router,
    private api: CaminhaoApiService,
    private categoriaApi: CategoriaCaminhaoApiService
  ) {}

  private toast(type: ToastType, message: string, ttlMs = 4200): void {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.toasts = [{ id, type, message }, ...this.toasts].slice(0, 5);
    window.setTimeout(() => this.dismissToast(id), ttlMs);
  }

  dismissToast(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  private extractApiError(err: unknown): string {
    const e = err as HttpErrorResponse;
    const body: any = e?.error;

    // padrão do seu back: ValidationError { error: "Erro de validação", errors: [{name,message}] }
    if (body?.errors && Array.isArray(body.errors) && body.errors.length) {
      const msgs = body.errors
        .map((x: any) => x?.message)
        .filter(Boolean);
      if (msgs.length) return msgs.join(' • ');
    }

    if (typeof body?.error === 'string' && body.error.trim()) return body.error;
    if (typeof e?.message === 'string' && e.message.trim()) return e.message;
    return 'Ocorreu um erro ao processar a solicitação.';
  }

  private normalizarPlaca(placa: string): string {
    return (placa || '').trim().toUpperCase();
  }

  private placaValida(placa: string): boolean {
    const p = this.normalizarPlaca(placa);
    // mesmo regex do back
    return /^([A-Z]{3}-?\d{4}|[A-Z]{3}\d[A-Z0-9]\d{2})$/.test(p);
  }

  ngOnInit(): void {
    this.carregarCategorias();
    this.carregarPagina();
  }

  carregarCategorias(): void {
    this.categoriaApi.listarTodas().subscribe({
      next: (p) => (this.categorias = (p.content || []).filter(c => c.ativo !== false)),
      error: () => (this.categorias = []),
    });
  }

  carregarPagina(): void {
    this.loading = true;
    this.errorMsg = null;

    const ativoParam =
      this.ativoFilter === 'TODOS' ? null :
        this.ativoFilter === 'ATIVOS' ? true : false;

    const q = (this.search || '').trim() || null;

    this.api
      .listar({ page: this.page, size: this.size, sort: 'descricao,asc', ativo: ativoParam, q })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.caminhoes = res.content || [];
          this.totalElements = res.totalElements || 0;
          this.totalPages = res.totalPages || 0;
          this.selected.clear();
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'Não foi possível carregar os caminhões.';
          this.toast('error', this.extractApiError(err) || this.errorMsg);
        },
      });
  }

  get filtered(): CaminhaoResponse[] {
    return this.caminhoes || [];
  }

  abrirDetalhe(c: CaminhaoResponse): void {
    this.router.navigate(['/dashboard/caminhoes', c.codigo]);
  }

  // seleção
  toggleAll(checked: boolean): void {
    this.selected.clear();
    if (checked) {
      this.filtered.forEach(c => this.selected.add(c.codigo));
    }
  }

  toggleOne(codigo: string, checked: boolean): void {
    if (checked) this.selected.add(codigo);
    else this.selected.delete(codigo);
  }

  isSelected(codigo: string): boolean {
    return this.selected.has(codigo);
  }

  // vínculo em lote
  aplicarCategoria(): void {
    const codigos = Array.from(this.selected);
    if (!this.categoriaSelecionada) return this.toast('warning', 'Selecione uma categoria.');
    if (codigos.length === 0) return this.toast('warning', 'Selecione pelo menos 1 caminhão.');

    const payload: VincularCategoriaCaminhaoEmLoteRequest = {
      categoriaCodigo: this.categoriaSelecionada,
      caminhoesCodigo: codigos,
    };

    this.loading = true;
    this.api.vincularCategoriaEmLote(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.categoriaSelecionada = '';
          this.carregarPagina();
          this.toast('success', 'Categoria vinculada com sucesso.');
        },
        error: (err) => {
          console.error(err);
          this.toast('error', this.extractApiError(err) || 'Não foi possível vincular a categoria.');
        }
      });
  }

  // criar categoria
  openCategoriaModal(): void {
    this.catForm = { codigo: '', descricao: '' };
    this.showCategoriaModal = true;
  }
  closeCategoriaModal(): void {
    this.showCategoriaModal = false;
  }
  salvarCategoria(): void {
    const payload: CategoriaCaminhaoRequest = {
      codigo: (this.catForm.codigo || '').trim().toUpperCase(),
      descricao: (this.catForm.descricao || '').trim(),
    };
    if (!payload.codigo) return this.toast('warning', 'Informe o código.');
    if (!payload.descricao) return this.toast('warning', 'Informe a descrição.');

    this.loading = true;
    this.categoriaApi.criar(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.closeCategoriaModal();
          this.carregarCategorias();
          this.toast('success', 'Categoria criada com sucesso.');
        },
        error: (err) => {
          console.error(err);
          this.toast('error', this.extractApiError(err) || 'Não foi possível criar a categoria (verifique se o código já existe).');
        }
      });
  }

  // modal caminhão
  openNovoCaminhao(): void {
    this.isEditing = false;
    this.editCodigo = null;
    this.form = {
      descricao: '',
      modelo: '',
      marca: '',
      placa: '',
      categoria: null,
      dtLicenciamento: null,
    };
    this.showCaminhaoModal = true;
  }

  closeCaminhaoModal(): void {
    this.showCaminhaoModal = false;
    this.isEditing = false;
    this.editCodigo = null;
  }

  salvarCaminhao(): void {
    this.form.descricao = (this.form.descricao || '').trim();
    this.form.modelo = (this.form.modelo || '').trim();
    this.form.marca = (this.form.marca || '').trim();
    this.form.placa = this.normalizarPlaca(this.form.placa || '');

    if (!this.form.descricao) return this.toast('warning', 'Informe a descrição.');
    if (!this.form.modelo) return this.toast('warning', 'Informe o modelo.');
    if (!this.form.marca) return this.toast('warning', 'Informe a marca.');
    if (!this.form.placa) return this.toast('warning', 'Informe a placa.');

    if (!this.placaValida(this.form.placa)) {
      return this.toast('error', 'Placa inválida. Use ABC-1234 (antiga) ou ABC1D23 (Mercosul).');
    }

    this.loading = true;

    const req$ = this.isEditing && this.editCodigo
      ? this.api.atualizar(this.editCodigo, this.form)
      : this.api.criar(this.form);

    req$.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.closeCaminhaoModal();
        this.carregarPagina();
        this.toast('success', 'Caminhão salvo com sucesso.');
      },
      error: (err) => {
        console.error(err);
        this.toast('error', this.extractApiError(err) || 'Não foi possível salvar o caminhão.');
      }
    });
  }

  inativar(c: CaminhaoResponse): void {
    if (!confirm(`Deseja inativar o caminhão ${c.codigo} (${c.placa})?`)) return;

    this.loading = true;
    this.api.deletar(c.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.carregarPagina(),
        error: (err) => this.toast('error', this.extractApiError(err) || 'Não foi possível inativar o caminhão.')
      });
  }

  ativar(c: CaminhaoResponse): void {
    if (!confirm(`Deseja reativar o caminhão ${c.codigo} (${c.placa})?`)) return;

    this.loading = true;
    this.api.ativar(c.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.carregarPagina(),
        error: (err) => this.toast('error', this.extractApiError(err) || 'Não foi possível ativar o caminhão.')
      });
  }

  prevPage(): void {
    if (this.page <= 0) return;
    this.page -= 1;
    this.carregarPagina();
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.page += 1;
    this.carregarPagina();
  }
}
