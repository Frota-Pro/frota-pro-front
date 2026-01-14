import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;
type StatusOficina = 'ATIVA' | 'INATIVA' | string;
type TipoOficina = 'MECANICA' | 'BORRACHARIA' | 'ELETRICA' | 'SUSPENSAO' | 'FUNILARIA' | 'OUTROS' | string;

interface Oficina {
  id: UUID;
  nome: string;
  tipo: TipoOficina;
  status: StatusOficina;

  cnpj?: string;
  telefone?: string;
  email?: string;

  cidade?: string;
  uf?: string;

  endereco?: string;
  observacao?: string;
}

@Component({
  selector: 'app-oficinas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './oficinas.component.html',
  styleUrls: ['./oficinas.component.css'],
})
export class OficinasComponent {
  // filtros
  searchTerm = '';
  filtroStatus: '' | 'ATIVA' | 'INATIVA' = '';
  filtroTipo: '' | TipoOficina = '';

  // modal
  showModal = false;
  isEditing = false;
  editingId: UUID | null = null;

  tipos: TipoOficina[] = ['MECANICA', 'BORRACHARIA', 'ELETRICA', 'SUSPENSAO', 'FUNILARIA', 'OUTROS'];

  oficinas: Oficina[] = [
    {
      id: 'o1',
      nome: 'Oficina Central',
      tipo: 'MECANICA',
      status: 'ATIVA',
      cnpj: '12.345.678/0001-99',
      telefone: '(83) 99999-9999',
      cidade: 'Campina Grande',
      uf: 'PB',
      endereco: 'Rua A, 123 - Centro',
      observacao: 'Atende freio e motor.',
    },
    {
      id: 'o2',
      nome: 'Borracharia Norte',
      tipo: 'BORRACHARIA',
      status: 'ATIVA',
      telefone: '(83) 98888-7777',
      cidade: 'João Pessoa',
      uf: 'PB',
      endereco: 'Av. Norte, 900',
      observacao: '',
    },
  ];

  form: any = this.emptyForm();

  private emptyForm() {
    return {
      nome: '',
      tipo: 'MECANICA' as TipoOficina,
      status: 'ATIVA' as StatusOficina,
      cnpj: '',
      telefone: '',
      email: '',
      cidade: '',
      uf: '',
      endereco: '',
      observacao: '',
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

  trackById(_: number, o: Oficina) {
    return o.id;
  }

  // modal
  openAddModal() {
    this.isEditing = false;
    this.editingId = null;
    this.form = this.emptyForm();
    this.showModal = true;
  }

  openEditModal(o: Oficina) {
    this.isEditing = true;
    this.editingId = o.id;
    this.form = {
      nome: o.nome,
      tipo: o.tipo,
      status: o.status,
      cnpj: o.cnpj || '',
      telefone: o.telefone || '',
      email: o.email || '',
      cidade: o.cidade || '',
      uf: o.uf || '',
      endereco: o.endereco || '',
      observacao: o.observacao || '',
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.form = this.emptyForm();
  }

  save() {
    if (!this.form.nome) {
      alert('Informe o nome da oficina.');
      return;
    }

    const payload: Oficina = {
      id: this.isEditing && this.editingId ? this.editingId : this.generateId(),
      nome: this.form.nome.trim(),
      tipo: this.form.tipo,
      status: this.form.status,
      cnpj: (this.form.cnpj || '').trim() || undefined,
      telefone: (this.form.telefone || '').trim() || undefined,
      email: (this.form.email || '').trim() || undefined,
      cidade: (this.form.cidade || '').trim() || undefined,
      uf: (this.form.uf || '').trim().toUpperCase() || undefined,
      endereco: (this.form.endereco || '').trim() || undefined,
      observacao: (this.form.observacao || '').trim() || undefined,
    };

    if (this.isEditing && this.editingId) {
      this.oficinas = this.oficinas.map((x) => (x.id === this.editingId ? payload : x));
    } else {
      this.oficinas.unshift(payload);
    }

    this.closeModal();
  }

  toggleStatus(o: Oficina) {
    o.status = (o.status || '').toUpperCase() === 'ATIVA' ? 'INATIVA' : 'ATIVA';
  }

  excluir(id: UUID) {
    if (!confirm('Tem certeza que deseja excluir esta oficina?')) return;
    this.oficinas = this.oficinas.filter((o) => o.id !== id);
  }

  // filtros
  get oficinasFiltradas(): Oficina[] {
    const t = (this.searchTerm || '').toLowerCase().trim();
    const st = (this.filtroStatus || '').toUpperCase().trim();
    const tp = (this.filtroTipo || '').toUpperCase().trim();

    return this.oficinas.filter((o) => {
      if (st && (o.status || '').toUpperCase() !== st) return false;
      if (tp && (o.tipo || '').toUpperCase() !== tp) return false;

      if (t) {
        const hay = [
          o.nome,
          o.cnpj || '',
          o.telefone || '',
          o.email || '',
          o.cidade || '',
          o.uf || '',
          o.endereco || '',
          o.tipo || '',
          o.status || '',
        ]
          .join(' ')
          .toLowerCase();

        if (!hay.includes(t)) return false;
      }

      return true;
    });
  }

  statusClass(s: string) {
    const v = (s || '').toUpperCase();
    return {
      'pill-success': v === 'ATIVA',
      'pill-muted': v !== 'ATIVA',
    };
  }
}
