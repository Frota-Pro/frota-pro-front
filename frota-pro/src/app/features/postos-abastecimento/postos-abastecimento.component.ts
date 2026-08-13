import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { PostoAbastecimentoApiService } from '../../core/api/posto-abastecimento-api.service';
import { PostoAbastecimentoRequest, PostoAbastecimentoResponse } from '../../core/api/posto-abastecimento-api.models';
import { ToastService } from '../../shared/ui/toast/toast.service';

const FORM_VAZIO: PostoAbastecimentoRequest = {
  codigo: '',
  nome: '',
  cnpj: '',
  cidade: '',
  uf: '',
  endereco: '',
  observacao: '',
  ativo: true,
};

@Component({
  selector: 'app-postos-abastecimento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './postos-abastecimento.component.html',
  styleUrls: ['./postos-abastecimento.component.css'],
})
export class PostosAbastecimentoComponent implements OnInit {

  // filtros
  filtroQ = '';
  filtroAtivo: '' | 'true' | 'false' = 'true';

  // paginação
  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;

  loading = false;
  errorMsg: string | null = null;
  rows: PostoAbastecimentoResponse[] = [];

  // modal
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  saving = false;
  form: PostoAbastecimentoRequest = { ...FORM_VAZIO };

  constructor(
    private api: PostoAbastecimentoApiService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.carregarPagina();
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
      sort: 'nome,asc',
      q: this.filtroQ.trim() || null,
      ativo: this.filtroAtivo === '' ? null : this.filtroAtivo === 'true',
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.content || [];
          this.totalPages = res.totalPages ?? 0;
          this.totalElements = res.totalElements ?? 0;
        },
        error: (err) => (this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar os postos de abastecimento.')),
      });
  }

  aplicarFiltros(): void {
    this.page = 0;
    this.carregarPagina();
  }

  limparFiltros(): void {
    this.filtroQ = '';
    this.filtroAtivo = 'true';
    this.aplicarFiltros();
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

  abrirEdicao(p: PostoAbastecimentoResponse): void {
    this.isEditing = true;
    this.editingId = p.id;
    this.form = {
      codigo: p.codigo,
      nome: p.nome,
      cnpj: p.cnpj ?? '',
      cidade: p.cidade ?? '',
      uf: p.uf ?? '',
      endereco: p.endereco ?? '',
      observacao: p.observacao ?? '',
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

    const payload: PostoAbastecimentoRequest = {
      ...this.form,
      codigo: this.form.codigo.trim().toUpperCase(),
      nome: this.form.nome.trim(),
      cnpj: this.form.cnpj?.trim() || null,
      cidade: this.form.cidade?.trim() || null,
      uf: this.form.uf?.trim() ? this.form.uf.trim().toUpperCase() : null,
      endereco: this.form.endereco?.trim() || null,
      observacao: this.form.observacao?.trim() || null,
    };

    this.saving = true;

    const req$ = this.isEditing && this.editingId
      ? this.api.atualizar(this.editingId, payload)
      : this.api.criar(payload);

    req$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.toast.success(this.isEditing ? 'Posto atualizado com sucesso.' : 'Posto cadastrado com sucesso.');
          this.showModal = false;
          this.carregarPagina();
        },
        error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível salvar o posto.')),
      });
  }

  private validarForm(): string[] {
    const erros: string[] = [];
    if (!this.form.codigo || !this.form.codigo.trim()) erros.push('Informe o código.');
    if (!this.form.nome || !this.form.nome.trim()) erros.push('Informe o nome do posto.');
    if (this.form.uf && this.form.uf.trim() && !/^[A-Za-z]{2}$/.test(this.form.uf.trim())) {
      erros.push('UF inválida. Use a sigla com 2 letras (ex: PB) ou deixe em branco.');
    }
    return erros;
  }

  // =========================
  // Excluir
  // =========================
  excluir(p: PostoAbastecimentoResponse): void {
    if (!confirm(`Deseja excluir o posto "${p.nome}" (${p.codigo})?`)) return;

    this.api.deletar(p.codigo).subscribe({
      next: () => {
        this.toast.success('Posto excluído com sucesso.');
        this.carregarPagina();
      },
      error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível excluir o posto.')),
    });
  }
}
