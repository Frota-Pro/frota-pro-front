import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;

type StatusManutencao = 'ABERTA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA' | string;
type TipoManutencao = 'PREVENTIVA' | 'CORRETIVA' | string;

interface Manutencao {
  id: UUID;
  os: string; // OS-000001
  caminhao: { id: UUID; placa: string; modelo?: string };
  oficina?: { id: UUID; nome: string } | null;

  tipo: TipoManutencao;
  status: StatusManutencao;

  dtAbertura: string;       // ISO (yyyy-MM-ddTHH:mm)
  dtPrevisao?: string | null;
  dtFechamento?: string | null;

  kmEntrada?: number | null;
  kmSaida?: number | null;

  valorTotal?: number | null;

  servicos?: string[];
  pecas?: { descricao: string; qtd: number; valor?: number }[];

  observacao?: string;
}

@Component({
  selector: 'app-manutencoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manutencoes.component.html',
  styleUrls: ['./manutencoes.component.css'],
})
export class ManutencoesComponent {

  // filtros
  searchTerm = '';
  filtroStatus: '' | 'ABERTA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA' = '';
  filtroTipo: '' | 'PREVENTIVA' | 'CORRETIVA' = '';
  filtroDataInicio = '';
  filtroDataFim = '';

  // expand
  expandedId: UUID | null = null;

  // modal/form
  showModal = false;
  isEditing = false;
  editingId: UUID | null = null;

  // mocks (depois liga no backend)
  caminhoes = [
    { id: 'c1', placa: 'ABC-1234', modelo: 'Volvo FH 540' },
    { id: 'c2', placa: 'DEF-5678', modelo: 'Scania R450' },
  ];

  oficinas = [
    { id: 'o1', nome: 'Oficina Central' },
    { id: 'o2', nome: 'Borracharia Norte' },
  ];

  manutencoes: Manutencao[] = [
    {
      id: 'm-1',
      os: 'OS-000001',
      caminhao: { id: 'c1', placa: 'ABC-1234', modelo: 'Volvo FH 540' },
      oficina: { id: 'o1', nome: 'Oficina Central' },
      tipo: 'CORRETIVA',
      status: 'EM_ANDAMENTO',
      dtAbertura: '2026-01-10T09:10',
      dtPrevisao: '2026-01-15T18:00',
      kmEntrada: 120340,
      valorTotal: 1850.0,
      servicos: ['Troca de pastilhas', 'Revisão sistema de freio'],
      pecas: [
        { descricao: 'Pastilha de freio', qtd: 1, valor: 450 },
        { descricao: 'Fluido de freio', qtd: 2, valor: 35 },
      ],
      observacao: 'Prioridade alta: caminhão escalado para rota longa.',
    },
    {
      id: 'm-2',
      os: 'OS-000002',
      caminhao: { id: 'c2', placa: 'DEF-5678', modelo: 'Scania R450' },
      oficina: { id: 'o2', nome: 'Borracharia Norte' },
      tipo: 'PREVENTIVA',
      status: 'ABERTA',
      dtAbertura: '2026-01-12T14:30',
      dtPrevisao: '2026-01-13T12:00',
      kmEntrada: 201200,
      valorTotal: 320.0,
      servicos: ['Balanceamento', 'Alinhamento'],
      pecas: [{ descricao: 'Peso balanceamento', qtd: 4, valor: 5 }],
      observacao: '',
    },
  ];

  form: any = this.emptyForm();

  // =========================
  // UI helpers
  // =========================
  private emptyForm() {
    return {
      os: '',
      caminhaoId: '',
      oficinaId: '',
      tipo: 'CORRETIVA' as TipoManutencao,
      status: 'ABERTA' as StatusManutencao,
      dtAbertura: new Date().toISOString().slice(0, 16),
      dtPrevisao: '',
      dtFechamento: '',
      kmEntrada: null as number | null,
      kmSaida: null as number | null,
      valorTotal: null as number | null,
      servicosText: '',
      pecasText: '',
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

  private nextOs(): string {
    const nums = this.manutencoes
      .map(m => Number((m.os || '').replace(/\D/g, '')))
      .filter(n => !Number.isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `OS-${String(next).padStart(6, '0')}`;
  }

  trackById(_: number, m: Manutencao) {
    return m.id;
  }

  toggleExpand(id: UUID) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  // =========================
  // Modal
  // =========================
  openAddModal() {
    this.isEditing = false;
    this.editingId = null;

    this.form = this.emptyForm();
    this.form.os = this.nextOs();

    this.showModal = true;
  }

  openEditModal(m: Manutencao) {
    this.isEditing = true;
    this.editingId = m.id;

    this.form = this.emptyForm();
    this.form.os = m.os;
    this.form.caminhaoId = m.caminhao?.id || '';
    this.form.oficinaId = m.oficina?.id || '';
    this.form.tipo = m.tipo || 'CORRETIVA';
    this.form.status = m.status || 'ABERTA';
    this.form.dtAbertura = (m.dtAbertura || '').slice(0, 16);
    this.form.dtPrevisao = (m.dtPrevisao || '').slice(0, 16);
    this.form.dtFechamento = (m.dtFechamento || '').slice(0, 16);
    this.form.kmEntrada = m.kmEntrada ?? null;
    this.form.kmSaida = m.kmSaida ?? null;
    this.form.valorTotal = m.valorTotal ?? null;
    this.form.servicosText = (m.servicos || []).join('\n');
    this.form.pecasText = (m.pecas || [])
      .map(p => `${p.descricao};${p.qtd};${p.valor ?? ''}`)
      .join('\n');
    this.form.observacao = m.observacao || '';

    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.form = this.emptyForm();
  }

  save() {
    // validações mínimas
    if (!this.form.caminhaoId) {
      alert('Selecione o caminhão.');
      return;
    }
    if (!this.form.dtAbertura) {
      alert('Informe a data de abertura.');
      return;
    }

    const caminhao = this.caminhoes.find(c => c.id === this.form.caminhaoId)!;
    const oficina = this.oficinas.find(o => o.id === this.form.oficinaId) || null;

    const servicos = (this.form.servicosText || '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean);

    // pecasText formato: "descricao;qtd;valor"
    const pecas = (this.form.pecasText || '')
      .split('\n')
      .map((line: string) => line.trim())
      .filter(Boolean)
      .map((line: string) => {
        const [descricao, qtd, valor] = line.split(';').map(x => (x ?? '').trim());
        return {
          descricao: descricao || 'Item',
          qtd: Number(qtd || 1),
          valor: valor ? Number(valor) : undefined,
        };
      });

    const payload: Manutencao = {
      id: this.isEditing && this.editingId ? this.editingId : this.generateId(),
      os: this.form.os || this.nextOs(),
      caminhao: { ...caminhao },
      oficina: oficina ? { ...oficina } : null,
      tipo: this.form.tipo,
      status: this.form.status,
      dtAbertura: this.form.dtAbertura,
      dtPrevisao: this.form.dtPrevisao || null,
      dtFechamento: this.form.dtFechamento || null,
      kmEntrada: this.form.kmEntrada ?? null,
      kmSaida: this.form.kmSaida ?? null,
      valorTotal: this.form.valorTotal ?? null,
      servicos,
      pecas,
      observacao: this.form.observacao || '',
    };

    if (this.isEditing && this.editingId) {
      this.manutencoes = this.manutencoes.map(m => (m.id === this.editingId ? payload : m));
    } else {
      this.manutencoes.unshift(payload);
    }

    this.closeModal();
  }

  finalizar(m: Manutencao) {
    m.status = 'FINALIZADA';
    m.dtFechamento = new Date().toISOString().slice(0, 16);
  }

  excluir(id: UUID) {
    if (!confirm('Tem certeza que deseja excluir esta manutenção?')) return;
    this.manutencoes = this.manutencoes.filter(m => m.id !== id);
    if (this.expandedId === id) this.expandedId = null;
  }

  // =========================
  // Filtro
  // =========================
  get manutencoesFiltradas(): Manutencao[] {
    const t = (this.searchTerm || '').toLowerCase().trim();
    const st = (this.filtroStatus || '').toUpperCase().trim();
    const tp = (this.filtroTipo || '').toUpperCase().trim();

    const inicio = this.filtroDataInicio
      ? new Date(
        Number(this.filtroDataInicio.slice(0, 4)),
        Number(this.filtroDataInicio.slice(5, 7)) - 1,
        Number(this.filtroDataInicio.slice(8, 10)),
        0, 0, 0, 0
      )
      : null;

    const fim = this.filtroDataFim
      ? new Date(
        Number(this.filtroDataFim.slice(0, 4)),
        Number(this.filtroDataFim.slice(5, 7)) - 1,
        Number(this.filtroDataFim.slice(8, 10)),
        23, 59, 59, 999
      )
      : null;

    return this.manutencoes.filter(m => {
      if (st && (m.status || '').toUpperCase() !== st) return false;
      if (tp && (m.tipo || '').toUpperCase() !== tp) return false;

      const dt = new Date(m.dtAbertura);
      if (inicio && dt < inicio) return false;
      if (fim && dt > fim) return false;

      if (t) {
        const hay = [
          m.os || '',
          m.caminhao?.placa || '',
          m.caminhao?.modelo || '',
          m.oficina?.nome || '',
          m.tipo || '',
          m.status || '',
          ...(m.servicos || []),
          ...(m.pecas || []).map(p => p.descricao),
        ].join(' ').toLowerCase();

        if (!hay.includes(t)) return false;
      }

      return true;
    });
  }

  // status visual
  statusClass(s: string) {
    const v = (s || '').toUpperCase();
    return {
      'pill-info': v === 'ABERTA',
      'pill-warn': v === 'EM_ANDAMENTO',
      'pill-success': v === 'FINALIZADA',
      'pill-muted': v === 'CANCELADA',
    };
  }
}
