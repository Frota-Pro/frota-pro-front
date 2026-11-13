import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { AuthUserService } from '../../core/auth/auth-user.service';
import { PlanejamentoApiService } from '../../core/api/planejamento-api.service';
import { PlanejamentoResumo } from '../../core/api/planejamento-api.models';
import { formatarData, formatarToneladas, podeEditarPlanejamento } from './planejamento.utils';

function hojeIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-planejamento-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './planejamento-lista.component.html',
  styleUrls: ['./planejamento.component.css'],
})
export class PlanejamentoListaComponent implements OnInit {
  planilhas: PlanejamentoResumo[] = [];
  loading = false;
  criando = false;
  errorMsg: string | null = null;

  dataNova = hojeIso();
  readonly hoje = hojeIso();

  readonly formatarData = formatarData;
  readonly formatarToneladas = formatarToneladas;

  constructor(
    private api: PlanejamentoApiService,
    private authUser: AuthUserService,
    private router: Router,
  ) {}

  get podeEditar(): boolean {
    return podeEditarPlanejamento(this.authUser.snapshot?.authorities);
  }

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.errorMsg = null;
    this.api
      .listar()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (r) => (this.planilhas = r ?? []),
        error: (err) => {
          this.planilhas = [];
          this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar as planilhas.');
        },
      });
  }

  /** Cria a planilha do dia escolhido (traz os carregamentos do WinThor) e abre. */
  criar(): void {
    if (this.criando || !this.dataNova) return;
    this.criando = true;
    this.errorMsg = null;
    this.api
      .criar(this.dataNova)
      .pipe(finalize(() => (this.criando = false)))
      .subscribe({
        next: (p) => this.router.navigate(['/dashboard/planejamento/cargas', p.id]),
        error: (err) => (this.errorMsg = extrairMensagemErro(err, 'Não foi possível criar a planilha.')),
      });
  }

  trackById(_: number, p: PlanejamentoResumo): string {
    return p.id;
  }
}
