import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { MotoristaApiService } from '../../../core/api/motorista-api.service';
import { MotoristaRequest, MotoristaResponse } from '../../../core/api/motorista-api.models';

type AtivoFiltro = 'TODOS' | 'ATIVOS' | 'INATIVOS';

type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

@Component({
  selector: 'app-motoristas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './motoristas-list.component.html',
  styleUrls: ['./motoristas-list.component.css'],
})
export class MotoristasListComponent implements OnInit {
  // filtros
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

  // toasts
  toasts: ToastItem[] = [];

  constructor(
    private router: Router,
    private api: MotoristaApiService
  ) {}

  ngOnInit(): void {
    this.carregarPagina();
  }

  // ------------------------
  // Toast helpers
  // ------------------------
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

    // padrão do seu backend (ValidationError): { error: "...", errors: [{name,message}] }
    if (body?.errors && Array.isArray(body.errors) && body.errors.length) {
      const msgs = body.errors
        .map((x: any) => x?.message)
        .filter(Boolean);
      if (msgs.length) return msgs.join(' • ');
    }

    if (typeof body?.error === 'string' && body.error.trim()) return body.error;
    if (typeof body?.message === 'string' && body.message.trim()) return body.message;
    if (typeof e?.message === 'string' && e.message.trim()) return e.message;

    return 'Ocorreu um erro ao processar a solicitação.';
  }

  // ------------------------
  // Validations / parsing
  // ------------------------
  private onlyDigits(v: string): string {
    return (v || '').replace(/\D+/g, '');
  }

  private isEmailValid(email: string): boolean {
    const e = (email || '').trim();
    // regex simples e eficiente pro caso de cadastro
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  }

  private parseBrDate(ddmmyyyy: string): Date | null {
    const v = (ddmmyyyy || '').trim();
    if (!v) return null;

    // aceita dd/MM/yyyy
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    if (!m) return null;

    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);

    if (mm < 1 || mm > 12) return null;
    if (dd < 1 || dd > 31) return null;

    const d = new Date(yyyy, mm - 1, dd);
    // garante que não virou outra data (ex: 31/02)
    if (d.getFullYear() !== yyyy || d.getMonth() !== (mm - 1) || d.getDate() !== dd) return null;

    return d;
  }

  private startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private cnhValida(cnh: string): boolean {
    const d = this.onlyDigits(cnh);
    return /^\d{11}$/.test(d);
  }

  // ------------------------
  // List / filters
  // ------------------------
  private buildQuery(): string | null {
    const ci = (this.codigoInterno || '').trim();
    const ce = (this.codigoExterno || '').trim();
    const cnh = (this.cnh || '').trim();
    const ne = (this.nomeEmail || '').trim();

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
          this.toast('error', this.extractApiError(err) || this.errorMsg);
        }
      });
  }

  get filtered(): MotoristaResponse[] {
    return this.motoristas || [];
  }

  abrirDetalhe(m: MotoristaResponse): void {
    this.router.navigate(['/dashboard/motoristas', m.codigo]);
  }

  // ------------------------
  // Modal
  // ------------------------
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

  // ------------------------
  // Save with validations
  // ------------------------
  salvarMotorista(): void {
    // normalizações
    this.form.nome = (this.form.nome || '').trim();
    this.form.email = (this.form.email || '').trim();
    this.form.cnh = this.onlyDigits(this.form.cnh || '');

    const nascStr = (this.form.dataNascimento || '').trim();
    const valStr  = (this.form.validadeCnh || '').trim();

    // validações
    if (!this.form.nome) return this.toast('warning', 'Informe o nome.');
    if (this.form.nome.length < 3) return this.toast('warning', 'Nome muito curto (mín. 3 caracteres).');

    if (!this.form.email) return this.toast('warning', 'Informe o e-mail.');
    if (!this.isEmailValid(this.form.email)) return this.toast('error', 'E-mail inválido.');

    if (!nascStr) return this.toast('warning', 'Informe a data de nascimento (dd/MM/yyyy).');
    const nasc = this.parseBrDate(nascStr);
    if (!nasc) return this.toast('error', 'Data de nascimento inválida. Use dd/MM/yyyy.');
    if (nasc > this.startOfToday()) return this.toast('error', 'Data de nascimento não pode ser futura.');

    if (!this.form.cnh) return this.toast('warning', 'Informe a CNH.');
    if (!this.cnhValida(this.form.cnh)) return this.toast('error', 'CNH inválida. Informe 11 dígitos (somente números).');

    if (!valStr) return this.toast('warning', 'Informe a validade da CNH (dd/MM/yyyy).');
    const validade = this.parseBrDate(valStr);
    if (!validade) return this.toast('error', 'Validade da CNH inválida. Use dd/MM/yyyy.');
    if (validade < this.startOfToday()) return this.toast('error', 'Validade da CNH não pode estar vencida.');

    // (opcional) código externo: se quiser forçar numérico
    if (this.form.codigoExterno && String(this.form.codigoExterno).trim()) {
      const ce = String(this.form.codigoExterno).trim();
      // não vou bloquear se tiver letras; mas se quiser bloquear, descomenta:
      // if (!/^\d+$/.test(ce)) return this.toast('warning', 'Código externo deve ser numérico.');
      this.form.codigoExterno = ce as any;
    }

    this.loading = true;

    const req$ = this.isEditing && this.editCodigo
      ? this.api.atualizar(this.editCodigo, this.form)
      : this.api.criar(this.form);

    req$.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.closeMotoristaModal();
        this.carregarPagina();
        this.toast('success', 'Motorista salvo com sucesso.');
      },
      error: (err) => {
        console.error(err);
        this.toast('error', this.extractApiError(err) || 'Não foi possível salvar o motorista.');
      }
    });
  }

  // ------------------------
  // Status
  // ------------------------
  inativar(m: MotoristaResponse): void {
    if (!confirm(`Deseja inativar o motorista ${m.codigo} (${m.nome})?`)) return;

    this.loading = true;
    this.api.deletar(m.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.carregarPagina();
          this.toast('success', 'Motorista inativado.');
        },
        error: (err) => {
          console.error(err);
          this.toast('error', this.extractApiError(err) || 'Não foi possível inativar o motorista.');
        }
      });
  }

  ativar(m: MotoristaResponse): void {
    // Se sua API já tiver endpoint de ativar, troque aqui para chamar.
    this.toast('info', 'Ativar motorista: se existir endpoint no backend, me diga qual (ex: PATCH /motorista/{codigo}/ativar) que eu conecto aqui.');
  }

  // ------------------------
  // Pagination
  // ------------------------
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
