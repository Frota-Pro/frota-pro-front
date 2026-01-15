import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;
type StatusLicenca = 'VALIDA' | 'EXPIRADA' | 'INVALIDA' | 'REVOGADA' | string;

interface Licenca {
  id: UUID;
  chave: string;
  empresa: string;

  status: StatusLicenca;

  criadaEm: string;     // ISO
  validadaEm?: string;  // ISO
  expiraEm?: string;    // ISO

  plano?: string;
  modulos?: string[];   // ex.: ["CARGAS","ABASTECIMENTOS","OFICINA"]
  limiteUsuarios?: number;

  observacao?: string;
}

@Component({
  selector: 'app-licencas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './licencas.component.html',
  styleUrls: ['./licencas.component.css'],
})
export class LicencasComponent {
  // filtros
  searchTerm = '';
  filtroStatus: '' | StatusLicenca = '';

  // modal
  showModal = false;
  isEditing = false;
  editingId: UUID | null = null;

  // form
  form = this.emptyForm();

  // mocks
  licencas: Licenca[] = [
    {
      id: 'l1',
      chave: 'FROTA-9H2K-1A7B-88XZ',
      empresa: 'Armazém Pires LTDA',
      status: 'VALIDA',
      criadaEm: '2026-01-10T09:15:00',
      validadaEm: '2026-01-10T09:30:00',
      expiraEm: '2027-01-10T00:00:00',
      plano: 'PRO',
      modulos: ['CARGAS', 'ABASTECIMENTOS', 'OFICINA', 'INTEGRACOES'],
      limiteUsuarios: 10,
      observacao: 'Ativação via painel.',
    },
    {
      id: 'l2',
      chave: 'FROTA-TEST-0000-0000',
      empresa: 'Empresa Teste',
      status: 'INVALIDA',
      criadaEm: '2026-01-12T10:00:00',
      observacao: 'Chave inválida (mock).',
    },
  ];

  planos = ['BASIC', 'PRO', 'ENTERPRISE'];
  modulosDisponiveis = ['CAMINHOES', 'MOTORISTAS', 'CARGAS', 'ABASTECIMENTOS', 'METAS', 'OFICINA', 'INTEGRACOES'];

  private emptyForm() {
    return {
      chave: '',
      empresa: '',
      plano: 'PRO',
      expiraEm: '',
      limiteUsuarios: 5,
      modulos: ['CARGAS', 'ABASTECIMENTOS'] as string[],
      observacao: '',
    };
  }

  private generateId(): UUID {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      try { return (crypto as any).randomUUID(); } catch {}
    }
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  trackById(_: number, l: Licenca) {
    return l.id;
  }

  // KPIs
  get total() {
    return this.licencas.length;
  }
  get validas() {
    return this.licencas.filter(l => (l.status || '').toUpperCase() === 'VALIDA').length;
  }
  get expiradas() {
    return this.licencas.filter(l => (l.status || '').toUpperCase() === 'EXPIRADA').length;
  }
  get invalidas() {
    return this.licencas.filter(l => ['INVALIDA', 'REVOGADA'].includes((l.status || '').toUpperCase())).length;
  }

  // filtros
  get licencasFiltradas(): Licenca[] {
    const t = (this.searchTerm || '').toLowerCase().trim();
    const st = (this.filtroStatus || '').toUpperCase().trim();

    return this.licencas.filter(l => {
      if (st && (l.status || '').toUpperCase() !== st) return false;

      if (t) {
        const hay = [
          l.chave,
          l.empresa,
          l.status,
          l.plano || '',
          (l.modulos || []).join(' '),
          l.observacao || '',
        ].join(' ').toLowerCase();

        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }

  // modal
  openAddModal() {
    this.isEditing = false;
    this.editingId = null;
    this.form = this.emptyForm();
    this.showModal = true;
  }

  openEditModal(l: Licenca) {
    this.isEditing = true;
    this.editingId = l.id;
    this.form = {
      chave: l.chave,
      empresa: l.empresa,
      plano: l.plano || 'PRO',
      expiraEm: l.expiraEm ? l.expiraEm.slice(0, 10) : '',
      limiteUsuarios: l.limiteUsuarios ?? 5,
      modulos: [...(l.modulos || [])],
      observacao: l.observacao || '',
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.form = this.emptyForm();
  }

  toggleModulo(m: string) {
    const arr = this.form.modulos;
    const idx = arr.indexOf(m);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(m);
  }

  isModuloMarcado(m: string) {
    return this.form.modulos.includes(m);
  }

  salvar() {
    if (!this.form.chave.trim()) {
      alert('Informe a chave da licença.');
      return;
    }
    if (!this.form.empresa.trim()) {
      alert('Informe a empresa.');
      return;
    }

    // regra simples (mock): se começar com FROTA- é válida, senão inválida
    const status: StatusLicenca =
      this.form.chave.trim().toUpperCase().startsWith('FROTA-') ? 'VALIDA' : 'INVALIDA';

    const agora = new Date().toISOString();

    const payload: Licenca = {
      id: this.isEditing && this.editingId ? this.editingId : this.generateId(),
      chave: this.form.chave.trim().toUpperCase(),
      empresa: this.form.empresa.trim(),
      status,

      criadaEm: this.isEditing ? (this.licencas.find(x => x.id === this.editingId)?.criadaEm || agora) : agora,
      validadaEm: status === 'VALIDA' ? agora : undefined,
      expiraEm: this.form.expiraEm ? new Date(this.form.expiraEm + 'T00:00:00').toISOString() : undefined,

      plano: this.form.plano,
      modulos: [...this.form.modulos],
      limiteUsuarios: Number(this.form.limiteUsuarios || 0) || undefined,
      observacao: (this.form.observacao || '').trim() || undefined,
    };

    if (this.isEditing && this.editingId) {
      this.licencas = this.licencas.map(x => x.id === this.editingId ? payload : x);
    } else {
      this.licencas.unshift(payload);
    }

    this.closeModal();
  }

  validarAgora(l: Licenca) {
    // mock: valida se chave começa com FROTA-
    const ok = l.chave.toUpperCase().startsWith('FROTA-');
    l.status = ok ? 'VALIDA' : 'INVALIDA';
    l.validadaEm = ok ? new Date().toISOString() : undefined;
  }

  excluir(id: UUID) {
    if (!confirm('Deseja excluir esta licença?')) return;
    this.licencas = this.licencas.filter(l => l.id !== id);
  }

  pillClass(s: string) {
    const v = (s || '').toUpperCase();
    return {
      'pill-success': v === 'VALIDA',
      'pill-warn': v === 'EXPIRADA',
      'pill-danger': v === 'INVALIDA' || v === 'REVOGADA',
      'pill-muted': !['VALIDA', 'EXPIRADA', 'INVALIDA', 'REVOGADA'].includes(v),
    };
  }
}
