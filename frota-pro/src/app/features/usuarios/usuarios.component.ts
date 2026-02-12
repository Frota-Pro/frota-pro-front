import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UsuarioApiService } from '../../core/api/usuario-api.service';
import {
  UsuarioResponse,
  UsuarioCreateRequest,
  UsuarioUpdateRequest
} from '../../core/api/usuario-api.models';

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

  // 🔥 Criar usuário para motorista
  matriculaMotorista = '';

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

  constructor(private usuarioService: UsuarioApiService) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar() {
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
        alert('Erro ao carregar usuários. Veja o console e a aba Network.');
        this.loading = false;
      }
    });
  }

  salvar() {
    if (this.modoEdicao && this.usuarioSelecionado) {
      const update: UsuarioUpdateRequest = {
        login: this.form.login,
        nome: this.form.nome,
        acessos: this.form.acessos,
        ativo: this.form.ativo
      };

      this.usuarioService.atualizar(this.usuarioSelecionado.id, update)
        .subscribe(() => {
          this.cancelar();
          this.carregar();
        });

    } else {
      this.usuarioService.criar(this.form)
        .subscribe(() => {
          this.cancelar();
          this.carregar();
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
      .subscribe(() => this.carregar());
  }

  resetarSenha(usuario: UsuarioResponse) {
    const novaSenha = prompt('Digite a nova senha:');
    if (!novaSenha) return;

    this.usuarioService.atualizarSenha(usuario.id, { novaSenha })
      .subscribe(() => alert('Senha atualizada com sucesso'));
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
  criarUsuarioParaMotorista() {
    const m = (this.matriculaMotorista || '').trim();
    if (!m) {
      alert('Informe a matrícula do motorista. Ex: MOT-000164');
      return;
    }

    this.usuarioService.criarUsuarioMotorista(m).subscribe({
      next: (msgs) => {
        alert((msgs ?? []).join('\n') || 'Processado.');
        this.matriculaMotorista = '';
        this.carregar();
      },
      error: (err) => {
        console.error('[Usuarios] erro criarUsuarioMotorista', err);
        alert('Erro ao criar usuário para o motorista.');
      }
    });
  }
}
