import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { ClienteApiService } from '../../core/api/cliente-api.service';
import { ClienteResponse } from '../../core/api/cliente-api.models';

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

  private searchDebounceTimer?: number;

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
