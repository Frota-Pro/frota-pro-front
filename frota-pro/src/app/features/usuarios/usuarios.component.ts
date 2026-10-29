import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { UsuarioApiService } from '../../core/api/usuario-api.service';
import {
  UsuarioResponse,
  UsuarioCreateRequest,
  UsuarioUpdateRequest,
  CredencialUsuarioCriado
} from '../../core/api/usuario-api.models';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AuthUserService } from '../../core/auth/auth-user.service';

const MAX_FILTRO = 150;
const MAX_MATRICULA = 50;

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  usuarios: UsuarioResponse[] = [];
  loading = false;

  modoEdicao = false;
  usuarioSelecionado?: UsuarioResponse;

  filtro = '';
  filtroAtivo: boolean | undefined = undefined;

  // modal de criar/editar usuário
  showModal = false;
  salvando = false;

  // modal de criar usuário para motorista
  showMotoristaModal = false;
  criandoMotorista = false;
  matriculaMotorista = '';

  // senhas iniciais geradas pela API (aparecem uma única vez)
  credenciaisCriadas: CredencialUsuarioCriado[] = [];
  mensagensCriacao: string[] = [];
  senhasAnotadas = false;

  // modal de resetar senha (troca o prompt() nativo)
  showResetSenhaModal = false;
  resetSenhaAlvo?: UsuarioResponse;
  resetSenhaValor = '';
  resetSenhaVisivel = false;
  resetSenhaSalva = false; // depois de salvar, a janela fica aberta mostrando a senha pra anotar
  resetandoSenha = false;

  form: UsuarioCreateRequest = {
    login: '',
    nome: '',
    senha: '',
    acessos: [],
    ativo: true
  };

  private readonly todosOsPerfis = [
    'ROLE_ADMIN',
    'ROLE_GERENTE_LOGISTICA',
    'ROLE_OPERADOR_LOGISTICA',
    'ROLE_MOTORISTA',
    'ROLE_MECANICO',
    'ROLE_CONSULTA'
  ];

  // Mesma regra da API (HierarquiaAcessoService): ninguém concede perfil acima do próprio
  // nem mexe em usuário de perfil acima do seu. A API é quem garante; aqui só esconde o que daria erro.
  private nivelDoUsuarioLogado = 0;

  constructor(
    private usuarioService: UsuarioApiService,
    private toast: ToastService,
    private authUser: AuthUserService,
  ) {}

  ngOnInit(): void {
    this.carregarNivelDoUsuarioLogado();
    this.carregar();
  }

  /** Perfis que o usuário logado pode conceder. */
  get rolesDisponiveis(): string[] {
    return this.todosOsPerfis.filter(r => this.nivelDoPerfil(r) <= this.nivelDoUsuarioLogado);
  }

  /** O usuário logado pode editar, resetar a senha ou inativar este usuário? */
  podeGerenciar(u: UsuarioResponse): boolean {
    return this.nivelDosPerfis(u.acessos ?? []) <= this.nivelDoUsuarioLogado;
  }

  private carregarNivelDoUsuarioLogado(): void {
    const aplicar = (authorities: string[] | undefined) => {
      this.nivelDoUsuarioLogado = this.nivelDosPerfis(authorities ?? []);
    };
    if (this.authUser.snapshot) {
      aplicar(this.authUser.snapshot.authorities);
      return;
    }
    this.authUser.loadMe().subscribe({ next: (u) => aplicar(u.authorities), error: () => aplicar([]) });
  }

  private nivelDosPerfis(perfis: string[]): number {
    return perfis.reduce((maior, p) => Math.max(maior, this.nivelDoPerfil(p)), 0);
  }

  private nivelDoPerfil(perfil: string): number {
    switch (perfil) {
      case 'ROLE_ADMIN': return 4;
      case 'ROLE_GERENTE_LOGISTICA': return 3;
      case 'ROLE_OPERADOR_LOGISTICA': return 2;
      case 'ROLE_MOTORISTA':
      case 'ROLE_MECANICO':
      case 'ROLE_CONSULTA': return 1;
      default: return 4; // desconhecido: só ADMIN concede
    }
  }

  carregar() {
    if (this.filtro && this.filtro.length > MAX_FILTRO) {
      this.toast.warn(`Filtro deve ter no máximo ${MAX_FILTRO} caracteres.`);
      return;
    }
    this.loading = true;

    this.usuarioService.listar({
      q: this.filtro,
      ativo: this.filtroAtivo,
      page: 0,
      size: 200,
      sort: 'criadoEm,desc'
    }).subscribe({
      next: (res) => {
        this.usuarios = res?.content ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error('[Usuarios] erro API', err);
        this.toast.error(extrairMensagemErro(err, 'Erro ao carregar usuários.'));
        this.loading = false;
      }
    });
  }

  abrirNovo() {
    this.cancelar();
    this.showModal = true;
  }

  salvar() {
    if (!this.form.login?.trim()) {
      this.toast.warn('Informe o login.');
      return;
    }
    if (!this.form.nome?.trim()) {
      this.toast.warn('Informe o nome.');
      return;
    }
    if (!this.modoEdicao && (!this.form.senha || this.form.senha.length < 6)) {
      this.toast.warn('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    this.salvando = true;

    if (this.modoEdicao && this.usuarioSelecionado) {
      const update: UsuarioUpdateRequest = {
        login: this.form.login,
        nome: this.form.nome,
        acessos: this.form.acessos,
        ativo: this.form.ativo
      };

      this.usuarioService.atualizar(this.usuarioSelecionado.id, update)
        .subscribe({
          next: () => {
            this.toast.success('Usuário atualizado com sucesso.');
            this.salvando = false;
            this.fecharModal();
            this.carregar();
          },
          error: (err) => {
            this.salvando = false;
            this.toast.error(extrairMensagemErro(err, 'Não foi possível salvar o usuário.'));
          },
        });

    } else {
      this.usuarioService.criar(this.form)
        .subscribe({
          next: () => {
            this.toast.success('Usuário cadastrado com sucesso.');
            this.salvando = false;
            this.fecharModal();
            this.carregar();
          },
          error: (err) => {
            this.salvando = false;
            this.toast.error(extrairMensagemErro(err, 'Não foi possível criar o usuário.'));
          },
        });
    }
  }

  editar(usuario: UsuarioResponse) {
    this.modoEdicao = true;
    this.usuarioSelecionado = usuario;

    this.form = {
      login: usuario.login,
      nome: usuario.nome,
      senha: '',
      acessos: [...(usuario.acessos ?? [])],
      ativo: usuario.ativo
    };

    this.showModal = true;
  }

  fecharModal() {
    if (this.salvando) return;
    this.showModal = false;
    this.cancelar();
  }

  cancelar() {
    this.modoEdicao = false;
    this.usuarioSelecionado = undefined;

    this.form = {
      login: '',
      nome: '',
      senha: '',
      acessos: [],
      ativo: true
    };
  }

  alternarAtivo(usuario: UsuarioResponse) {
    this.usuarioService.atualizarAtivo(usuario.id, !usuario.ativo)
      .subscribe({
        next: () => {
          this.toast.success(usuario.ativo ? 'Usuário inativado.' : 'Usuário ativado.');
          this.carregar();
        },
        error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível alterar o status do usuário.')),
      });
  }

  /** Desvincula o celular do motorista: a pessoa poderá entrar de outro aparelho. */
  desvincularCelular(usuario: UsuarioResponse) {
    const celular = usuario.dispositivoVinculadoNome || 'o celular';
    if (!confirm(`Desvincular ${celular} de ${usuario.nome}?\n\nO celular antigo perde o acesso e o próximo login, em qualquer celular, vira o novo vínculo.`)) {
      return;
    }
    this.usuarioService.desvincularDispositivo(usuario.id).subscribe({
      next: () => {
        this.toast.success(`Celular desvinculado. ${usuario.nome} já pode entrar de outro aparelho.`);
        this.carregar();
      },
      error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível desvincular o celular.')),
    });
  }

  // ===== Resetar senha (modal estilizado, em vez do prompt() nativo) =====
  /** Fecha a janela das senhas geradas; só depois de marcar que anotou. */
  fecharCredenciais() {
    if (!this.senhasAnotadas) return;
    this.credenciaisCriadas = [];
    this.mensagensCriacao = [];
  }

  /** Copia "nome / login / senha" de todos, pra colar numa planilha ou mensagem. */
  copiarCredenciais() {
    const texto = this.credenciaisCriadas
      .map(c => `${c.nome}\tlogin: ${c.login}\tsenha: ${c.senhaInicial}`)
      .join('\n');
    navigator.clipboard?.writeText(texto)
      .then(() => this.toast.success('Copiado.'))
      .catch(() => this.toast.warn('Não consegui copiar. Anote à mão.'));
  }

  imprimirCredenciais() {
    window.print();
  }

  /** Senha aleatória de 10 caracteres, sem os que se confundem (0/O, 1/l/I). Gerada no navegador. */
  gerarSenhaAleatoria(): string {
    const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const valores = new Uint32Array(10);
    crypto.getRandomValues(valores);
    return Array.from(valores, v => alfabeto[v % alfabeto.length]).join('');
  }

  gerarSenhaNoReset() {
    this.resetSenhaValor = this.gerarSenhaAleatoria();
    this.resetSenhaVisivel = true;
  }

  abrirResetSenha(usuario: UsuarioResponse) {
    this.resetSenhaVisivel = false;
    this.resetSenhaSalva = false;
    this.resetSenhaAlvo = usuario;
    this.resetSenhaValor = '';
    this.showResetSenhaModal = true;
  }

  fecharResetSenha() {
    if (this.resetandoSenha) return;
    this.showResetSenhaModal = false;
    this.resetSenhaAlvo = undefined;
    this.resetSenhaValor = '';
    this.resetSenhaVisivel = false;
    this.resetSenhaSalva = false;
  }

  confirmarResetSenha() {
    if (!this.resetSenhaAlvo) return;
    if (!this.resetSenhaValor || this.resetSenhaValor.length < 6) {
      this.toast.warn('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    this.resetandoSenha = true;
    this.usuarioService.atualizarSenha(this.resetSenhaAlvo.id, { novaSenha: this.resetSenhaValor })
      .subscribe({
        next: () => {
          this.toast.success('Senha atualizada com sucesso.');
          this.resetandoSenha = false;
          // mostra a senha uma última vez para o administrador anotar e passar à pessoa
          this.resetSenhaSalva = true;
          this.resetSenhaVisivel = true;
        },
        error: (err) => {
          this.resetandoSenha = false;
          this.toast.error(extrairMensagemErro(err, 'Não foi possível atualizar a senha.'));
        },
      });
  }

  toggleRole(role: string) {
    if (!this.form.acessos) this.form.acessos = [];

    if (this.form.acessos.includes(role)) {
      this.form.acessos = this.form.acessos.filter(r => r !== role);
    } else {
      this.form.acessos.push(role);
    }
  }

  // ✅ Criar usuário para motorista
  abrirMotoristaModal() {
    this.matriculaMotorista = '';
    this.showMotoristaModal = true;
  }

  fecharMotoristaModal() {
    if (this.criandoMotorista) return;
    this.showMotoristaModal = false;
  }

  criarUsuarioParaMotorista() {
    const items = this.parseMatriculas(this.matriculaMotorista);
    if (!items.length) {
      this.toast.warn('Informe ao menos uma matrícula. Ex: MOT-000164');
      return;
    }
    const invalid = items.find(x => x.length > MAX_MATRICULA);
    if (invalid) {
      this.toast.warn(`Cada matrícula deve ter no máximo ${MAX_MATRICULA} caracteres.`);
      return;
    }

    this.criandoMotorista = true;
    this.usuarioService.criarUsuarioMotorista(items).subscribe({
      next: (res) => {
        const mensagens = res?.mensagens ?? [];
        this.credenciaisCriadas = res?.credenciais ?? [];
        this.senhasAnotadas = false;
        if (this.credenciaisCriadas.length) {
          // as senhas só aparecem agora: fica numa janela própria até o administrador anotar
          this.toast.success(`${this.credenciaisCriadas.length} usuário(s) criado(s). Anote as senhas.`);
        } else {
          this.toast.warn(mensagens.join(' • ') || 'Nenhum usuário foi criado.');
        }
        this.mensagensCriacao = mensagens.filter(m => !m.startsWith('✅'));
        this.criandoMotorista = false;
        this.showMotoristaModal = false;
        this.carregar();
      },
      error: (err) => {
        console.error('[Usuarios] erro criarUsuarioMotorista', err);
        this.criandoMotorista = false;
        this.toast.error(extrairMensagemErro(err, 'Erro ao criar usuário para o motorista.'));
      }
    });
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = {
      ROLE_ADMIN: 'Admin',
      ROLE_GERENTE_LOGISTICA: 'Gerente Logística',
      ROLE_OPERADOR_LOGISTICA: 'Operador Logística',
      ROLE_MOTORISTA: 'Motorista',
      ROLE_MECANICO: 'Mecânico',
      ROLE_CONSULTA: 'Consulta',
    };
    return labels[role] || role;
  }

  private parseMatriculas(raw: string): string[] {
    return (raw || '')
      .split(/[,\n;]+/)
      .map(v => v.trim())
      .filter(Boolean);
  }
}
