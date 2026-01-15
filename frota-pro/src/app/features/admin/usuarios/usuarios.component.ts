import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;

type UserStatus = 'ATIVO' | 'INATIVO';
type Role =
  | 'ADMIN'
  | 'OPERADOR_LOGISTICA'
  | 'FINANCEIRO'
  | 'GESTOR'
  | 'MOTORISTA'
  | 'SUPORTE'
  | string;

interface Usuario {
  id: UUID;
  nome: string;
  email: string;
  status: UserStatus;
  roles: Role[];
  cadastradoEm: string; // ISO
  ultimoAcesso?: string; // ISO

  telefone?: string;
  cargo?: string;
  observacao?: string;
}

interface UsuarioForm {
  nome: string;
  email: string;
  status: UserStatus;
  roles: Role[];

  telefone: string;
  cargo: string;
  observacao: string;

  // mock: senha inicial
  senhaInicial: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
})
export class UsuariosComponent {
  // filtro
  searchTerm = '';

  // modal
  showModal = false;
  isEditing = false;
  editingId: UUID | null = null;

  // roles disponíveis
  rolesDisponiveis: { key: Role; label: string; desc: string }[] = [
    { key: 'ADMIN', label: 'Administrador', desc: 'Acesso total ao sistema e configurações.' },
    { key: 'OPERADOR_LOGISTICA', label: 'Operador de Logística', desc: 'Cargas, motoristas, caminhões, metas.' },
    { key: 'FINANCEIRO', label: 'Financeiro', desc: 'Custos, relatórios e conciliações.' },
    { key: 'GESTOR', label: 'Gestor', desc: 'Visão gerencial e aprovações.' },
    { key: 'MOTORISTA', label: 'Motorista', desc: 'Acesso restrito (app/portal do motorista).' },
    { key: 'SUPORTE', label: 'Suporte', desc: 'Atendimento, logs e diagnósticos.' },
  ];

  // mock data
  usuarios: Usuario[] = [
    {
      id: 'u1',
      nome: 'Arthenyo',
      email: 'arthenyo@gmail.com',
      roles: ['OPERADOR_LOGISTICA', 'ADMIN'],
      status: 'ATIVO',
      cadastradoEm: '2025-12-29T10:10:00',
      ultimoAcesso: '2026-01-15T13:40:00',
      cargo: 'Operador',
      telefone: '(83) 99999-9999',
      observacao: 'Usuário principal',
    },
  ];

  form: UsuarioForm = this.emptyForm();

  private emptyForm(): UsuarioForm {
    return {
      nome: '',
      email: '',
      status: 'ATIVO',
      roles: ['OPERADOR_LOGISTICA'],
      telefone: '',
      cargo: '',
      observacao: '',
      senhaInicial: '',
    };
  }

  private generateId(): UUID {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      try {
        return (crypto as any).randomUUID();
      } catch {}
    }
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  trackById(_: number, u: Usuario) {
    return u.id;
  }

  get usuariosFiltrados(): Usuario[] {
    const t = (this.searchTerm || '').toLowerCase().trim();
    if (!t) return this.usuarios;

    return this.usuarios.filter((u) => {
      const hay = [
        u.nome,
        u.email,
        u.status,
        (u.roles || []).join(' '),
        u.cargo || '',
        u.telefone || '',
      ]
        .join(' ')
        .toLowerCase();

      return hay.includes(t);
    });
  }

  // Modal create/edit
  openAddModal() {
    this.isEditing = false;
    this.editingId = null;
    this.form = this.emptyForm();
    this.form.senhaInicial = this.gerarSenhaSugestao();
    this.showModal = true;
  }

  openEditModal(u: Usuario) {
    this.isEditing = true;
    this.editingId = u.id;

    this.form = {
      nome: u.nome,
      email: u.email,
      status: u.status,
      roles: [...(u.roles || [])],
      telefone: u.telefone || '',
      cargo: u.cargo || '',
      observacao: u.observacao || '',
      senhaInicial: '',
    };

    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.form = this.emptyForm();
  }

  salvar() {
    const nome = this.form.nome.trim();
    const email = this.form.email.trim().toLowerCase();

    if (!nome) {
      alert('Informe o nome.');
      return;
    }
    if (!email || !email.includes('@')) {
      alert('Informe um e-mail válido.');
      return;
    }
    if (!this.form.roles.length) {
      alert('Selecione pelo menos um role.');
      return;
    }

    // e-mail único (mock)
    const emailJaExiste = this.usuarios.some(
      (u) => u.email.toLowerCase() === email && u.id !== this.editingId
    );
    if (emailJaExiste) {
      alert('Já existe um usuário com esse e-mail.');
      return;
    }

    const now = new Date().toISOString();

    const payload: Usuario = {
      id: this.isEditing && this.editingId ? this.editingId : this.generateId(),
      nome,
      email,
      status: this.form.status,
      roles: [...this.form.roles],
      cadastradoEm: this.isEditing
        ? this.usuarios.find((x) => x.id === this.editingId)?.cadastradoEm || now
        : now,
      ultimoAcesso: this.usuarios.find((x) => x.id === this.editingId)?.ultimoAcesso,
      telefone: this.form.telefone.trim() || undefined,
      cargo: this.form.cargo.trim() || undefined,
      observacao: this.form.observacao.trim() || undefined,
    };

    if (this.isEditing && this.editingId) {
      this.usuarios = this.usuarios.map((u) => (u.id === this.editingId ? payload : u));
    } else {
      this.usuarios.unshift(payload);
      // mock: senha inicial
      if (this.form.senhaInicial) {
        // aqui depois vira endpoint (enviar email / gerar convite)
        console.log('Senha inicial (mock):', this.form.senhaInicial);
      }
    }

    this.closeModal();
  }

  excluir(id: UUID) {
    if (!confirm('Deseja excluir este usuário?')) return;
    this.usuarios = this.usuarios.filter((u) => u.id !== id);
  }

  alternarStatus(u: Usuario) {
    u.status = u.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
  }

  resetarSenha(u: Usuario) {
    // mock: gera senha e “envia”
    const nova = this.gerarSenhaSugestao();
    alert(`Senha resetada (mock). Nova senha: ${nova}\n\nDepois você troca para "enviar link por e-mail".`);
  }

  toggleRole(r: Role) {
    const idx = this.form.roles.indexOf(r);
    if (idx >= 0) this.form.roles.splice(idx, 1);
    else this.form.roles.push(r);
  }

  roleMarcado(r: Role) {
    return this.form.roles.includes(r);
  }

  roleLabel(r: Role) {
    const found = this.rolesDisponiveis.find((x) => x.key === r);
    return found?.label ?? r;
  }

  rolePillClass(r: Role) {
    const v = (r || '').toUpperCase();
    return {
      'pill-gray': v === 'OPERADOR_LOGISTICA',
      'pill-red': v === 'ADMIN',
      'pill-blue': v === 'GESTOR',
      'pill-green': v === 'FINANCEIRO',
      'pill-muted': !['OPERADOR_LOGISTICA', 'ADMIN', 'GESTOR', 'FINANCEIRO'].includes(v),
    };
  }

  statusClass(s: UserStatus) {
    return {
      'pill-success': (s || '').toUpperCase() === 'ATIVO',
      'pill-muted': (s || '').toUpperCase() !== 'ATIVO',
    };
  }

  private gerarSenhaSugestao() {
    // simples e ok para mock (depois vira convite via email)
    const a = Math.random().toString(36).slice(2, 6).toUpperCase();
    const b = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `FP-${a}-${b}`;
  }
}
