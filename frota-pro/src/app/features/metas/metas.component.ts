import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;

interface Meta {
  id: UUID;
  dataInicio?: string;
  dataFim?: string;
  tipoMeta?: string;
  valorMeta?: number;
  valorRealizado?: number;
  unidade?: string;
  statusMeta?: string;
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
  styleUrls: ['./metas.component.css']
})
export class MetasComponent {
  searchTerm: string = '';
  expanded: string | null = null;

  // MOCK — substituir pelo backend depois
  metas: Meta[] = [
    {
      id: 'meta-1',
      dataInicio: '2025-01-01',
      dataFim: '2025-01-31',
      tipoMeta: 'LITROS_COMBUSTIVEL',
      valorMeta: 5000,
      valorRealizado: 3200,
      unidade: 'L',
      statusMeta: 'EM_ANDAMENTO',
      descricao: 'Meta mensal de combustível',
      caminhao: { id: 'c1', placa: 'ABC1D23' },
      categoria: { id: 'cat1', nome: 'Truck' },
      motorista: { id: 'm1', nome: 'Carlos Silva' },
      renovarAutomaticamente: true
    }
  ];

  novaMeta: Meta | null = null;
  editando: boolean = false;

  // 🔥 UUID SEGURO E UNIVERSAL
  private gerarUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback
    return 'xxxx-xxxx-4xxx-yxxx-xxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  toggleExpand(id: UUID) {
    this.expanded = this.expanded === id ? null : id;
  }

  isExpanded(id: UUID) {
    return this.expanded === id;
  }

  get metasFiltradas() {
    const t = this.searchTerm.toLowerCase();
    return this.metas.filter(m =>
      (m.descricao || '').toLowerCase().includes(t) ||
      (m.tipoMeta || '').toLowerCase().includes(t)
    );
  }

  addNovaMeta() {
    this.novaMeta = {
      id: this.gerarUUID(),
      dataInicio: '',
      dataFim: '',
      tipoMeta: '',
      valorMeta: 0,
      valorRealizado: 0,
      unidade: '',
      statusMeta: 'EM_ANDAMENTO',
      descricao: '',
      caminhao: null,
      categoria: null,
      motorista: null,
      renovarAutomaticamente: false
    };
    this.editando = false;
  }

  editarMeta(meta: Meta) {
    this.novaMeta = JSON.parse(JSON.stringify(meta));
    this.editando = true;
  }

  salvarMeta() {
    if (!this.novaMeta) return;

    if (this.editando) {
      this.metas = this.metas.map(m =>
        m.id === this.novaMeta!.id ? this.novaMeta! : m
      );
    } else {
      this.metas.push(this.novaMeta);
    }

    this.novaMeta = null;
  }

  cancelar() {
    this.novaMeta = null;
  }

  excluirMeta(id: UUID) {
    this.metas = this.metas.filter(m => m.id !== id);
  }
}
