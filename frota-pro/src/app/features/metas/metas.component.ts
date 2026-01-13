import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;

type StatusMeta = 'ATIVA' | 'FINALIZADA' | 'CANCELADA' | 'EM_ANDAMENTO' | string;

interface Meta {
  id: UUID;
  dataInicio?: string;
  dataFim?: string;
  tipoMeta?: string;
  valorMeta?: number;
  valorRealizado?: number;
  unidade?: string;
  statusMeta?: StatusMeta;
  descricao?: string;
  caminhao?: { id: UUID; placa: string } | null;
  categoria?: { id: UUID; nome: string } | null;
  motorista?: { id: UUID; nome: string } | null;
  renovarAutomaticamente: boolean;
}

@Component({
  selector: 'app-metas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './metas.component.html',
  styleUrls: ['./metas.component.css'],
})
export class MetasComponent {
  // filtros (layout novo)
  searchTerm = '';
  filtroStatus: '' | 'ATIVA' | 'FINALIZADA' = '';

  // modal/form
  showAddModal = false;
  editando = false;
  editingId: UUID | null = null;

  novaMeta: Meta | null = null;

  // mock
  metas: Meta[] = [
    {
      id: 'meta-1',
      dataInicio: '2026-01-09',
      dataFim: '2026-02-08',
      tipoMeta: 'Consumo Combustível',
      valorMeta: 3.5,
      valorRealizado: 2.8,
      unidade: 'km/L',
      statusMeta: 'ATIVA',
      descricao: 'Meta de consumo',
      caminhao: { id: 'c1', placa: 'ABC-1234' },
      motorista: { id: 'm1', nome: 'João Silva' },
      renovarAutomaticamente: true,
    },
  ];

  // UUID seguro
  private gerarUUID(): string {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      return (crypto as any).randomUUID();
    }
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  trackById(_: number, item: Meta) {
    return item.id;
  }

  // ===== Helpers de UI =====

  getStatusLabel(m: Meta): string {
    const s = (m.statusMeta || 'ATIVA').toString().toUpperCase();
    if (s === 'EM_ANDAMENTO') return 'ATIVA';
    return s;
  }

  // 0..100
  getProgressPercent(m: Meta): number {
    const meta = Number(m.valorMeta || 0);
    const atual = Number(m.valorRealizado || 0);
    if (!meta || meta <= 0) return 0;
    const pct = (atual / meta) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  // ===== Filtros =====

  get metasFiltradas(): Meta[] {
    const t = (this.searchTerm || '').toLowerCase().trim();
    const st = (this.filtroStatus || '').toUpperCase().trim();

    return this.metas.filter((m) => {
      // status
      if (st) {
        const status = this.getStatusLabel(m);
        if (status !== st) return false;
      }

      // busca
      if (t) {
        const hay = [
          m.tipoMeta || '',
          m.descricao || '',
          m.caminhao?.placa || '',
          m.motorista?.nome || '',
          m.categoria?.nome || '',
        ]
          .join(' ')
          .toLowerCase();

        if (!hay.includes(t)) return false;
      }

      return true;
    });
  }

  // ===== Modal =====

  openAddModal() {
    this.editando = false;
    this.editingId = null;

    this.novaMeta = {
      id: this.gerarUUID(),
      dataInicio: new Date().toISOString().slice(0, 10),
      dataFim: new Date().toISOString().slice(0, 10),
      tipoMeta: '',
      valorMeta: 0,
      valorRealizado: 0,
      unidade: '',
      statusMeta: 'ATIVA',
      descricao: '',
      caminhao: null,
      categoria: null,
      motorista: null,
      renovarAutomaticamente: false,
    };

    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.editando = false;
    this.editingId = null;
    this.novaMeta = null;
  }

  editarMeta(m: Meta) {
    this.editando = true;
    this.editingId = m.id;
    this.novaMeta = JSON.parse(JSON.stringify(m));
    this.showAddModal = true;
  }

  salvarMeta() {
    if (!this.novaMeta) return;

    // validações mínimas
    if (!this.novaMeta.tipoMeta) {
      alert('Informe o tipo da meta.');
      return;
    }
    if (!this.novaMeta.dataInicio || !this.novaMeta.dataFim) {
      alert('Informe o período.');
      return;
    }

    if (this.editando && this.editingId) {
      this.metas = this.metas.map((m) => (m.id === this.editingId ? this.novaMeta! : m));
    } else {
      this.metas.unshift(this.novaMeta);
    }

    this.closeAddModal();
  }

  finalizarMeta(m: Meta) {
    m.statusMeta = 'FINALIZADA';
  }

  excluirMeta(id: UUID) {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
    this.metas = this.metas.filter((m) => m.id !== id);
  }
}
