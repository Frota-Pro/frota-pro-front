import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
        this.toast.error('Erro ao carregar usuários.');
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
      .subscribe(() => this.toast.success('Senha atualizada com sucesso'));
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

    this.usuarioService.criarUsuarioMotorista(items).subscribe({
      next: (msgs) => {
        this.toast.success((msgs ?? []).join(' • ') || 'Processado.');
        this.matriculaMotorista = '';
        this.carregar();
      },
      error: (err) => {
        console.error('[Usuarios] erro criarUsuarioMotorista', err);
        this.toast.error('Erro ao criar usuário para o motorista.');
      }
    });
  }

  private parseMatriculas(raw: string): string[] {
    return (raw || '')
      .split(/[,\n;]+/)
      .map(v => v.trim())
      .filter(Boolean);
  }
}
