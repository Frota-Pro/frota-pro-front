import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { UsuarioApiService } from '../../core/api/usuario-api.service';
import {
  UsuarioResponse,
  UsuarioCreateRequest,
  UsuarioUpdateRequest
} from '../../core/api/usuario-api.models';
import { ToastService } from '../../shared/ui/toast/toast.service';

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

  // modal de resetar senha (troca o prompt() nativo)
  showResetSenhaModal = false;
  resetSenhaAlvo?: UsuarioResponse;
  resetSenhaValor = '';
  resetandoSenha = false;

  form: UsuarioCreateRequest = {
    login: '',
    nome: '',
    senha: '',
    acessos: [],
    ativo: true
  };

  rolesDisponiveis = [
    'ROLE_ADMIN',
    'ROLE_GERENTE_LOGISTICA',
    'ROLE_OPERADOR_LOGISTICA',
    'ROLE_MOTORISTA',
    'ROLE_MECANICO',
    'ROLE_CONSULTA'
  ];

  constructor(private usuarioService: UsuarioApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.carregar();
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

  // ===== Resetar senha (modal estilizado, em vez do prompt() nativo) =====
  abrirResetSenha(usuario: UsuarioResponse) {
    this.resetSenhaAlvo = usuario;
    this.resetSenhaValor = '';
    this.showResetSenhaModal = true;
  }

  fecharResetSenha() {
    if (this.resetandoSenha) return;
    this.showResetSenhaModal = false;
    this.resetSenhaAlvo = undefined;
    this.resetSenhaValor = '';
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
          this.fecharResetSenha();
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
      next: (msgs) => {
        this.toast.success((msgs ?? []).join(' • ') || 'Processado.');
        this.criandoMotorista = false;
        this.fecharMotoristaModal();
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
