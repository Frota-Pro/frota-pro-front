import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { ClienteApiService } from '../../core/api/cliente-api.service';
import { ClienteRequest, ClienteResponse } from '../../core/api/cliente-api.models';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
})
export class ClientesComponent implements OnInit {
  loading = false;
  errorMsg: string | null = null;

  q = '';
  page = 0;
  size = 15;
  totalPages = 0;
  totalElements = 0;

  rows: ClienteResponse[] = [];

  // ===== Toasts =====
  toasts: ToastItem[] = [];
  private toastSeq = 0;

  private searchDebounceTimer?: number;

  // ===== Modal criar/editar =====
  showModal = false;
  modoEdicao = false;
  salvando = false;
  buscandoCnpj = false;
  clienteEmEdicaoId: string | null = null;
  form: ClienteRequest = this.formVazio();

  constructor(private api: ClienteApiService) {}

  ngOnInit(): void {
    this.carregarPagina();
  }

  carregarPagina(): void {
    this.loading = true;
    this.errorMsg = null;

    this.api
      .listar({ q: this.q?.trim() || null, page: this.page, size: this.size, sort: 'nome,asc' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (p) => {
          this.rows = p.content || [];
          this.totalPages = p.totalPages ?? 0;
          this.totalElements = p.totalElements ?? 0;
        },
        error: (err) => {
          console.error(err);
          this.rows = [];
          this.totalPages = 0;
          this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar os clientes.');
        },
      });
  }

  onSearchChange(): void {
    if (this.searchDebounceTimer) {
      window.clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = window.setTimeout(() => {
      this.page = 0;
      this.carregarPagina();
    }, 350);
  }

  limparBusca(): void {
    this.q = '';
    this.page = 0;
    this.carregarPagina();
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.page++;
    this.carregarPagina();
  }

  prevPage(): void {
    if (this.page <= 0) return;
    this.page--;
    this.carregarPagina();
  }

  // =========================
  // Modal criar/editar
  // =========================
  abrirNovo(): void {
    this.modoEdicao = false;
    this.clienteEmEdicaoId = null;
    this.form = this.formVazio();
    this.showModal = true;
  }

  abrirEdicao(c: ClienteResponse): void {
    this.modoEdicao = true;
    this.clienteEmEdicaoId = c.id;
    this.form = {
      documento: c.documento,
      nome: c.nome,
      logradouro: c.logradouro,
      numero: c.numero,
      complemento: c.complemento,
      bairro: c.bairro,
      cidade: c.cidade,
      uf: c.uf,
      cep: c.cep,
      telefone: c.telefone,
      email: c.email,
    };
    this.showModal = true;
  }

  fecharModal(): void {
    this.showModal = false;
  }

  /**
   * Disparado ao sair do campo CNPJ/CPF — se forem 14 dígitos (CNPJ),
   * consulta a Receita Federal (BrasilAPI) e pré-preenche o resto do
   * formulário. CPF (11 dígitos) não tem consulta pública, então não
   * tenta. Nunca trava o cadastro: se a consulta falhar, só avisa e o
   * usuário continua preenchendo na mão.
   */
  buscarCnpj(): void {
    const digitos = (this.form.documento || '').replace(/\D/g, '');
    if (digitos.length !== 14) {
      return;
    }

    this.buscandoCnpj = true;
    this.api
      .consultarCnpj(digitos)
      .pipe(finalize(() => (this.buscandoCnpj = false)))
      .subscribe({
        next: (dados) => {
          this.form.nome = dados.nome || this.form.nome;
          this.form.logradouro = dados.logradouro || this.form.logradouro;
          this.form.numero = dados.numero || this.form.numero;
          this.form.complemento = dados.complemento || this.form.complemento;
          this.form.bairro = dados.bairro || this.form.bairro;
          this.form.cidade = dados.cidade || this.form.cidade;
          this.form.uf = dados.uf || this.form.uf;
          this.form.cep = dados.cep || this.form.cep;
          this.form.telefone = dados.telefone || this.form.telefone;
          this.toast('success', 'Dados preenchidos a partir do CNPJ.');
        },
        error: (err) => {
          console.error(err);
          this.toast('info', extrairMensagemErro(err, 'Não foi possível buscar os dados desse CNPJ — preencha na mão.'));
        },
      });
  }

  salvar(): void {
    if (!this.form.documento?.trim() || !this.form.nome?.trim()) {
      this.toast('error', 'CNPJ/CPF e Nome são obrigatórios.');
      return;
    }

    this.salvando = true;

    const request$ = this.modoEdicao && this.clienteEmEdicaoId
      ? this.api.atualizar(this.clienteEmEdicaoId, this.form)
      : this.api.criar(this.form);

    request$.pipe(finalize(() => (this.salvando = false))).subscribe({
      next: () => {
        this.toast('success', this.modoEdicao ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.');
        this.showModal = false;
        this.carregarPagina();
      },
      error: (err) => {
        console.error(err);
        this.toast('error', extrairMensagemErro(err, 'Não foi possível salvar o cliente.'));
      },
    });
  }

  private formVazio(): ClienteRequest {
    return {
      documento: '',
      nome: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: '',
      telefone: '',
      email: '',
    };
  }

  // =========================
  // Toasts
  // =========================
  toast(type: ToastType, message: string, ms = 4000): void {
    const id = ++this.toastSeq;
    this.toasts.push({ id, type, message });
    window.setTimeout(() => this.dismissToast(id), ms);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  // =========================
  // Formatação
  // =========================
  enderecoCompleto(c: ClienteResponse): string {
    const partes = [
      c.logradouro,
      c.numero ? `nº ${c.numero}` : null,
      c.complemento,
      c.bairro,
    ].filter((p) => !!p);

    const linha1 = partes.join(', ');
    const cidadeUf = [c.cidade, c.uf].filter((p) => !!p).join(' / ');
    const cep = c.cep ? `CEP ${c.cep}` : null;

    return [linha1, cidadeUf, cep].filter((p) => !!p).join(' — ') || '—';
  }

  formatarDocumento(documento: string): string {
    const digitos = (documento || '').replace(/\D/g, '');
    if (digitos.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    if (digitos.length === 11) {
      // CPF: 000.000.000-00
      return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return documento;
  }

  formatDateTime(iso?: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('pt-BR');
  }
}
