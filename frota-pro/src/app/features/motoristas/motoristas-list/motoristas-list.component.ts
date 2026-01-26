import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { MotoristaApiService } from '../../../core/api/motorista-api.service';
import { MotoristaRequest, MotoristaResponse } from '../../../core/api/motorista-api.models';

type AtivoFiltro = 'TODOS' | 'ATIVOS' | 'INATIVOS';

@Component({
  selector: 'app-motoristas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './motoristas-list.component.html',
  styleUrls: ['./motoristas-list.component.css'],
})
export class MotoristasListComponent implements OnInit {
  // filtros (como você pediu)
  codigoInterno = '';
  codigoExterno = '';
  cnh = '';
  nomeEmail = '';

  ativoFilter: AtivoFiltro = 'ATIVOS';

  // paginação
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  motoristas: MotoristaResponse[] = [];

  loading = false;
  errorMsg: string | null = null;

  // modal criar/editar
  showMotoristaModal = false;
  isEditing = false;
  editCodigo: string | null = null;

  form: MotoristaRequest = {
    codigoExterno: null,
    nome: '',
    email: '',
    dataNascimento: null,
    cnh: '',
    validadeCnh: null,
  };

  constructor(
    private router: Router,
    private api: MotoristaApiService
  ) {}

  ngOnInit(): void {
    this.carregarPagina();
  }

  private buildQuery(): string | null {
    // prioriza os filtros específicos; a API faz OR entre campos (search)
    const ci = (this.codigoInterno || '').trim();
    const ce = (this.codigoExterno || '').trim();
    const cnh = (this.cnh || '').trim();
    const ne = (this.nomeEmail || '').trim();

    // se o usuário preencheu mais de um, juntamos com espaço (a query do backend é like, então funciona bem)
    const parts = [ci, ce, cnh, ne].filter(Boolean);
    return parts.length ? parts.join(' ') : null;
  }

  carregarPagina(): void {
    this.loading = true;
    this.errorMsg = null;

    const ativoParam =
      this.ativoFilter === 'TODOS' ? null :
        this.ativoFilter === 'ATIVOS' ? true : false;

    const q = this.buildQuery();

    this.api.listar({ page: this.page, size: this.size, sort: 'nome,asc', ativo: ativoParam, q })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.motoristas = res.content || [];
          this.totalElements = res.totalElements || 0;
          this.totalPages = res.totalPages || 0;
        },
        error: (err) => {
          console.error(err);
          this.motoristas = [];
          this.errorMsg = 'Não foi possível carregar os motoristas.';
        }
      });
  }

  get filtered(): MotoristaResponse[] {
    return this.motoristas || [];
  }

  abrirDetalhe(m: MotoristaResponse): void {
    this.router.navigate(['/dashboard/motoristas', m.codigo]);
  }

  openNovoMotorista(): void {
    this.isEditing = false;
    this.editCodigo = null;
    this.form = {
      codigoExterno: null,
      nome: '',
      email: '',
      dataNascimento: null,
      cnh: '',
      validadeCnh: null,
    };
    this.showMotoristaModal = true;
  }

  closeMotoristaModal(): void {
    this.showMotoristaModal = false;
    this.isEditing = false;
    this.editCodigo = null;
  }

  salvarMotorista(): void {
    if (!this.form.nome?.trim()) return alert('Informe o nome.');
    if (!this.form.email?.trim()) return alert('Informe o e-mail.');
    if (!this.form.dataNascimento?.trim()) return alert('Informe a data de nascimento (dd/MM/yyyy).');
    if (!this.form.cnh?.trim()) return alert('Informe a CNH.');
    if (!this.form.validadeCnh?.trim()) return alert('Informe a validade da CNH (dd/MM/yyyy).');

    this.loading = true;

    const req$ = this.isEditing && this.editCodigo
      ? this.api.atualizar(this.editCodigo, this.form)
      : this.api.criar(this.form);

    req$.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.closeMotoristaModal();
        this.carregarPagina();
      },
      error: (err) => {
        console.error(err);
        alert('Não foi possível salvar o motorista.');
      }
    });
  }

  inativar(m: MotoristaResponse): void {
    if (!confirm(`Deseja inativar o motorista ${m.codigo} (${m.nome})?`)) return;

    this.loading = true;
    this.api.deletar(m.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.carregarPagina(),
        error: () => alert('Não foi possível inativar o motorista.')
      });
  }

  ativar(m: MotoristaResponse): void {
    // se sua API não tem ativar para motorista, você pode implementar no backend;
    // por enquanto: re-cadastrar/fluxo futuro.
    alert('Ativar motorista: implemente endpoint PATCH /motorista/{codigo}/ativar se desejar o mesmo padrão do caminhão.');
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
