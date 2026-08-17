import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ToastService } from '../../shared/ui/toast/toast.service';
import { extrairMensagemErro } from '../../core/utils/api-error.util';

import { AuditoriaApiService } from '../../core/api/auditoria-api.service';
import { LogAuditoriaResponse } from '../../core/api/auditoria-api.models';
import { UsuarioApiService } from '../../core/api/usuario-api.service';
import { UsuarioResponse } from '../../core/api/usuario-api.models';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.css'],
})
export class AuditoriaComponent implements OnInit {
  usuarios: UsuarioResponse[] = [];

  filtroDataInicio = '';
  filtroDataFim = '';
  filtroUsuarioLogin = '';

  rows: LogAuditoriaResponse[] = [];
  expanded: string | null = null;

  loading = false;
  errorMsg: string | null = null;

  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;

  constructor(
    private auditoriaApi: AuditoriaApiService,
    private usuarioApi: UsuarioApiService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.filtroDataFim = this.formatDate(new Date());
    this.filtroDataInicio = this.formatDate(this.diasAtras(7));

    this.usuarioApi.listar({ size: 200, sort: 'nome,asc' }).subscribe({
      next: (res) => (this.usuarios = res.content || []),
      error: () => (this.usuarios = []),
    });

    this.buscar();
  }

  buscar(page: number = 0): void {
    if (!this.filtroDataInicio || !this.filtroDataFim) {
      this.toast.warn('Informe o período (data início e data fim).', 'Filtro de período');
      return;
    }
    if (this.filtroDataFim < this.filtroDataInicio) {
      this.toast.warn('A data final não pode ser menor que a data inicial.', 'Filtro de período');
      return;
    }

    this.page = page;
    this.loading = true;
    this.errorMsg = null;

    this.auditoriaApi
      .listar({
        dataInicio: this.filtroDataInicio,
        dataFim: this.filtroDataFim,
        usuarioLogin: this.filtroUsuarioLogin || null,
        page: this.page,
        size: this.size,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.content || [];
          this.totalPages = res.totalPages ?? 0;
          this.totalElements = res.totalElements ?? 0;
        },
        error: (err) => {
          this.errorMsg = extrairMensagemErro(err, 'Falha ao carregar a auditoria.');
          this.rows = [];
        },
      });
  }

  limparFiltros(): void {
    this.filtroDataFim = this.formatDate(new Date());
    this.filtroDataInicio = this.formatDate(this.diasAtras(7));
    this.filtroUsuarioLogin = '';
    this.buscar(0);
  }

  aplicarAtalhoPeriodo(dias: number): void {
    this.filtroDataFim = this.formatDate(new Date());
    this.filtroDataInicio = this.formatDate(this.diasAtras(dias));
    this.buscar(0);
  }

  toggleExpand(id: string): void {
    this.expanded = this.expanded === id ? null : id;
  }

  isExpanded(id: string): boolean {
    return this.expanded === id;
  }

  trackById(index: number, item: LogAuditoriaResponse): string {
    return item.id;
  }

  acaoClass(acao: string): string {
    switch (acao) {
      case 'LOGIN_SUCESSO': return 'acao-sucesso';
      case 'LOGIN_FALHA': return 'acao-falha';
      case 'LOGOUT': return 'acao-neutra';
      case 'CRIACAO': return 'acao-criacao';
      case 'ATUALIZACAO': return 'acao-atualizacao';
      case 'EXCLUSAO': return 'acao-falha';
      default: return 'acao-neutra';
    }
  }

  prevPage(): void {
    if (this.page <= 0) return;
    this.buscar(this.page - 1);
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.buscar(this.page + 1);
  }

  private diasAtras(dias: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    return d;
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
