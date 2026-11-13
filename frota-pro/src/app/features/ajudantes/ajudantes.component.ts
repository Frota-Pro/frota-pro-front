import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { AuthUserService } from '../../core/auth/auth-user.service';
import { AjudanteApiService, AjudanteResponse } from '../../core/api/ajudante-api.service';
import { ConfirmacaoComponent, PedidoDeConfirmacao } from '../../shared/ui/confirmacao/confirmacao.component';

interface Mensagem {
  tipo: 'success' | 'error';
  texto: string;
}

/** Quem pode cadastrar ajudantes (os mesmos perfis que a API aceita). */
export function podeEditarAjudantes(authorities: string[] | null | undefined): boolean {
  const a = authorities ?? [];
  return a.includes('ROLE_ADMIN') || a.includes('ROLE_GERENTE_LOGISTICA') || a.includes('ROLE_OPERADOR_LOGISTICA');
}

/** Filtra pelo nome, sem diferenciar maiúscula nem acento. */
export function filtrarAjudantes(lista: AjudanteResponse[], busca: string): AjudanteResponse[] {
  const normaliza = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const q = normaliza(busca);
  if (!q) return lista;
  return lista.filter((a) => normaliza(a.nome).includes(q) || normaliza(a.codigo).includes(q));
}

@Component({
  selector: 'app-ajudantes',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmacaoComponent],
  templateUrl: './ajudantes.component.html',
  styleUrls: ['../planejamento/planejamento.component.css', './ajudantes.component.css'],
})
export class AjudantesComponent implements OnInit {
  ajudantes: AjudanteResponse[] = [];
  busca = '';
  loading = false;
  salvando = false;
  errorMsg: string | null = null;
  mensagem: Mensagem | null = null;
  /** A janela de confirmação aberta (desativar); vazia quando não há pergunta na tela. */
  confirmacao: PedidoDeConfirmacao | null = null;

  nomeNovo = '';
  /** Código do ajudante que está sendo editado, e o nome em edição. */
  editando: string | null = null;
  nomeEditado = '';

  constructor(
    private api: AjudanteApiService,
    private authUser: AuthUserService,
  ) {}

  get podeEditar(): boolean {
    return podeEditarAjudantes(this.authUser.snapshot?.authorities);
  }

  get visiveis(): AjudanteResponse[] {
    return filtrarAjudantes(this.ajudantes, this.busca);
  }

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.errorMsg = null;
    this.api
      .listar({ size: 500, sort: 'nome,asc' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (r) => (this.ajudantes = r.content ?? []),
        error: (err) => {
          this.ajudantes = [];
          this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar os ajudantes.');
        },
      });
  }

  adicionar(): void {
    const nome = this.nomeNovo.trim();
    if (this.salvando) return;
    if (nome.length < 3) {
      this.mensagem = { tipo: 'error', texto: 'O nome precisa ter pelo menos 3 letras.' };
      return;
    }
    this.salvando = true;
    this.mensagem = null;
    this.api
      .criar({ nome })
      .pipe(finalize(() => (this.salvando = false)))
      .subscribe({
        next: (a) => {
          this.nomeNovo = '';
          this.mensagem = { tipo: 'success', texto: `${a.nome} cadastrado.` };
          this.carregar();
        },
        error: (err) => (this.mensagem = { tipo: 'error', texto: extrairMensagemErro(err, 'Não foi possível cadastrar.') }),
      });
  }

  editar(a: AjudanteResponse): void {
    this.editando = a.codigo;
    this.nomeEditado = a.nome;
    this.mensagem = null;
  }

  cancelarEdicao(): void {
    this.editando = null;
    this.nomeEditado = '';
  }

  salvarEdicao(a: AjudanteResponse): void {
    const nome = this.nomeEditado.trim();
    if (this.salvando) return;
    if (nome.length < 3) {
      this.mensagem = { tipo: 'error', texto: 'O nome precisa ter pelo menos 3 letras.' };
      return;
    }
    this.salvando = true;
    this.api
      .atualizar(a.codigo, { nome })
      .pipe(finalize(() => (this.salvando = false)))
      .subscribe({
        next: () => {
          this.cancelarEdicao();
          this.mensagem = { tipo: 'success', texto: 'Nome atualizado.' };
          this.carregar();
        },
        error: (err) => (this.mensagem = { tipo: 'error', texto: extrairMensagemErro(err, 'Não foi possível salvar.') }),
      });
  }

  desativar(a: AjudanteResponse): void {
    if (this.salvando) return;
    this.confirmacao = {
      tipo: 'perigo',
      titulo: `Desativar ${a.nome}?`,
      mensagem: 'Ele deixa de aparecer na lista para escolher nas planilhas.',
      rodape: 'O histórico dele continua guardado.',
      textoConfirmar: 'Desativar ajudante',
      textoCancelar: 'Voltar',
      aoConfirmar: () => this.desativarDeVerdade(a),
    };
  }

  confirmarPergunta(): void {
    const pedido = this.confirmacao;
    this.confirmacao = null;
    pedido?.aoConfirmar();
  }

  cancelarPergunta(): void {
    this.confirmacao = null;
  }

  private desativarDeVerdade(a: AjudanteResponse): void {
    if (this.salvando) return;
    this.salvando = true;
    this.api
      .desativar(a.codigo)
      .pipe(finalize(() => (this.salvando = false)))
      .subscribe({
        next: () => {
          this.mensagem = { tipo: 'success', texto: `${a.nome} desativado.` };
          this.carregar();
        },
        error: (err) => (this.mensagem = { tipo: 'error', texto: extrairMensagemErro(err, 'Não foi possível desativar.') }),
      });
  }

  trackByCodigo(_: number, a: AjudanteResponse): string {
    return a.codigo;
  }
}
