import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;

type TipoCombustivel = 'DIESEL' | 'GASOLINA' | 'ETANOL' | 'DIESEL_S10' | 'GNV' | string;

interface CaminhaoMini {
  id: UUID;
  codigo: string;
  placa: string;
}
interface MotoristaMini {
  id: UUID;
  nome: string;
  codigo: string;
}

interface Abastecimento {
  id: UUID;
  codigo: string;
  dtAbastecimento: string; // ISO
  caminhao: CaminhaoMini;
  motorista?: MotoristaMini | null;
  kmOdometro?: number | null;
  qtLitros?: number;
  valorLitro?: number;
  valorTotal?: number;
  tipoCombustivel?: TipoCombustivel;
  formaPagamento?: string;
  posto?: string;
  cidade?: string;
  uf?: string;
  numNotaOuCupom?: string;
  mediaKmLitro?: number | null;
}

/* =============================
   NOVO TIPO — evita todos os erros
   ============================= */
interface NovoAbastecimento {
  codigo: string;
  dtAbastecimento: string;
  tipoCombustivel: TipoCombustivel;
  qtLitros: number;
  valorLitro: number;
  valorTotal: number;
  caminhao: CaminhaoMini;
  motorista: MotoristaMini;
  kmOdometro?: number | null;
  formaPagamento?: string;
  posto?: string;
  cidade?: string;
  uf?: string;
  numNotaOuCupom?: string;
  mediaKmLitro?: number | null;
}

@Component({
  selector: 'app-abastecimentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './abastecimentos.component.html',
  styleUrls: ['./abastecimentos.component.css'],
})
export class AbastecimentosComponent {
  // filtros
  filtroMotorista: string = '';
  filtroCaminhao: string = '';
  filtroTipo: string = '';
  filtroDataInicio: string = '';
  filtroDataFim: string = '';
  searchTerm: string = '';

  // modal
  showAddModal = false;
  isEditing = false;
  editingId: string | null = null;

  expanded: string | null = null;

  abastecimentos: Abastecimento[] = [
    {
      id: 'ab-1',
      codigo: 'AB-2025-0001',
      dtAbastecimento: '2025-12-01T09:30:00',
      caminhao: { id: 'v-1', codigo: 'CAM-001', placa: 'ABC1D23' },
      motorista: { id: 'm-1', nome: 'Carlos Silva', codigo: 'MTR-001' },
      kmOdometro: 12034,
      qtLitros: 150.345,
      valorLitro: 6.59,
      valorTotal: 150.345 * 6.59,
      tipoCombustivel: 'DIESEL',
      formaPagamento: 'CARTAO',
      posto: 'Posto Central',
      cidade: 'Campina',
      uf: 'PB',
      numNotaOuCupom: 'NF12345',
      mediaKmLitro: 3.2,
    },
    {
      id: 'ab-2',
      codigo: 'AB-2025-0002',
      dtAbastecimento: '2025-12-05T15:10:00',
      caminhao: { id: 'v-2', codigo: 'CAM-002', placa: 'XYZ9A87' },
      motorista: { id: 'm-2', nome: 'Mariana Costa', codigo: 'MTR-002' },
      kmOdometro: 20120,
      qtLitros: 80,
      valorLitro: 6.79,
      valorTotal: 80 * 6.79,
      tipoCombustivel: 'DIESEL_S10',
      formaPagamento: 'DINHEIRO',
      posto: 'Posto Norte',
      cidade: 'João Pessoa',
      uf: 'PB',
      numNotaOuCupom: 'NF54321',
      mediaKmLitro: 4.1,
    },
  ];

  /* =============================
     AQUI ESTÁ O FIX DEFINITIVO
     ============================= */
  novo: NovoAbastecimento = {
    codigo: '',
    dtAbastecimento: '',
    tipoCombustivel: 'DIESEL',
    qtLitros: 0,
    valorLitro: 0,
    valorTotal: 0,
    caminhao: { id: '', codigo: '', placa: '' },
    motorista: { id: '', nome: '', codigo: '' },
  };

  private generateId(): string {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      try {
        return (crypto as any).randomUUID();
      } catch {}
    }
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  openAddModal() {
    this.isEditing = false;
    this.editingId = null;

    this.novo = {
      codigo: `AB-${new Date().getFullYear()}-${(this.abastecimentos.length + 1)
        .toString()
        .padStart(4, '0')}`,
      dtAbastecimento: new Date().toISOString().slice(0, 16),
      tipoCombustivel: 'DIESEL',
      qtLitros: 0,
      valorLitro: 0,
      valorTotal: 0,
      caminhao: { id: '', codigo: '', placa: '' },
      motorista: { id: '', nome: '', codigo: '' },
    };

    this.showAddModal = true;
  }

  openEditModal(ab: Abastecimento) {
    this.isEditing = true;
    this.editingId = ab.id;

    // converte dt para input datetime-local format yyyy-MM-ddTHH:mm (já está em ISO nos mocks)
    const dt = ab.dtAbastecimento ? ab.dtAbastecimento.slice(0, 16) : '';

    this.novo = {
      codigo: ab.codigo,
      dtAbastecimento: dt,
      tipoCombustivel: ab.tipoCombustivel || 'DIESEL',
      qtLitros: ab.qtLitros ?? 0,
      valorLitro: ab.valorLitro ?? 0,
      valorTotal: ab.valorTotal ?? 0,
      caminhao: { ...ab.caminhao },
      motorista: ab.motorista ? { ...ab.motorista } : { id: '', nome: '', codigo: '' },
      kmOdometro: ab.kmOdometro ?? null,
      formaPagamento: ab.formaPagamento ?? '',
      posto: ab.posto ?? '',
      cidade: ab.cidade ?? '',
      uf: ab.uf ?? '',
      numNotaOuCupom: ab.numNotaOuCupom ?? '',
      mediaKmLitro: ab.mediaKmLitro ?? null,
    };

    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.novo = {
      codigo: '',
      dtAbastecimento: '',
      tipoCombustivel: 'DIESEL',
      qtLitros: 0,
      valorLitro: 0,
      valorTotal: 0,
      caminhao: { id: '', codigo: '', placa: '' },
      motorista: { id: '', nome: '', codigo: '' },
    };
  }

  saveAbastecimento() {
    const qt = Number(this.novo.qtLitros || 0);
    const vl = Number(this.novo.valorLitro || 0);
    const total = qt * vl;

    if (!this.novo.caminhao || !(this.novo.caminhao.placa || this.novo.caminhao.codigo)) {
      alert('Informe o caminhão (placa ou código).');
      return;
    }
    if (!this.novo.dtAbastecimento) {
      alert('Informe a data do abastecimento.');
      return;
    }

    if (this.isEditing && this.editingId) {
      // atualizar
      const idx = this.abastecimentos.findIndex((x) => x.id === this.editingId);
      if (idx >= 0) {
        this.abastecimentos[idx] = {
          id: this.editingId,
          codigo: this.novo.codigo,
          dtAbastecimento: this.novo.dtAbastecimento,
          caminhao: { ...this.novo.caminhao },
          motorista:
            this.novo.motorista && this.novo.motorista.nome ? { ...this.novo.motorista } : null,
          kmOdometro: this.novo.kmOdometro ?? null,
          qtLitros: qt,
          valorLitro: vl,
          valorTotal: total,
          tipoCombustivel: this.novo.tipoCombustivel,
          formaPagamento: this.novo.formaPagamento || '',
          posto: this.novo.posto || '',
          cidade: this.novo.cidade || '',
          uf: this.novo.uf || '',
          numNotaOuCupom: this.novo.numNotaOuCupom || '',
          mediaKmLitro: this.novo.mediaKmLitro ?? null,
        };
      }
    } else {
      // novo
      const ab: Abastecimento = {
        id: this.generateId(),
        codigo: this.novo.codigo,
        dtAbastecimento: this.novo.dtAbastecimento,
        caminhao: { ...this.novo.caminhao },
        motorista:
          this.novo.motorista && this.novo.motorista.nome ? { ...this.novo.motorista } : null,
        kmOdometro: this.novo.kmOdometro ?? null,
        qtLitros: qt,
        valorLitro: vl,
        valorTotal: total,
        tipoCombustivel: this.novo.tipoCombustivel,
        formaPagamento: this.novo.formaPagamento || '',
        posto: this.novo.posto || '',
        cidade: this.novo.cidade || '',
        uf: this.novo.uf || '',
        numNotaOuCupom: this.novo.numNotaOuCupom || '',
        mediaKmLitro: this.novo.mediaKmLitro ?? null,
      };

      this.abastecimentos.unshift(ab);
    }

    this.closeAddModal();
  }

  deleteAbastecimento(id: UUID) {
    if (!confirm('Tem certeza que deseja excluir este abastecimento?')) return;
    this.abastecimentos = this.abastecimentos.filter((a) => a.id !== id);
    // se estava expandido, fecha
    if (this.expanded === id) this.expanded = null;
  }

  toggleExpand(id: UUID) {
    this.expanded = this.expanded === id ? null : id;
  }

  isExpanded(id: UUID) {
    return this.expanded === id;
  }

  trackById(index: number, item: Abastecimento) {
    return item.id;
  }

  get abastecimentosFiltrados() {
  const t = (this.searchTerm || '').toLowerCase().trim();
  const mot = (this.filtroMotorista || '').toLowerCase().trim();
  const cam = (this.filtroCaminhao || '').toLowerCase().trim();
  const tipo = (this.filtroTipo || '').toLowerCase().trim();

  // 🔥 NORMALIZA AS DATAS (SEM FUSO)
  const inicio = this.filtroDataInicio
    ? new Date(
        Number(this.filtroDataInicio.slice(0, 4)),
        Number(this.filtroDataInicio.slice(5, 7)) - 1,
        Number(this.filtroDataInicio.slice(8, 10)),
        0,
        0,
        0,
        0
      )
    : null;

  const fim = this.filtroDataFim
    ? new Date(
        Number(this.filtroDataFim.slice(0, 4)),
        Number(this.filtroDataFim.slice(5, 7)) - 1,
        Number(this.filtroDataFim.slice(8, 10)),
        23,
        59,
        59,
        999
      )
    : null;

  return this.abastecimentos.filter((a) => {
    const dt = new Date(a.dtAbastecimento);

    if (inicio && dt < inicio) return false;
    if (fim && dt > fim) return false;

    if (mot) {
      if (
        !`${a.motorista?.nome || ''} ${a.motorista?.codigo || ''}`
          .toLowerCase()
          .includes(mot)
      )
        return false;
    }

    if (cam) {
      if (
        !`${a.caminhao.placa} ${a.caminhao.codigo}`
          .toLowerCase()
          .includes(cam)
      )
        return false;
    }

    if (
      tipo &&
      !String(a.tipoCombustivel || '')
        .toLowerCase()
        .includes(tipo)
    )
      return false;

    if (t) {
      const hay = [
        a.codigo || '',
        a.posto || '',
        a.motorista?.nome || '',
        a.motorista?.codigo || '',
        a.caminhao.placa || '',
        a.caminhao.codigo || '',
        a.numNotaOuCupom || '',
      ]
        .join(' ')
        .toLowerCase();

      if (!hay.includes(t)) return false;
    }

    return true;
  });
}


  // CARDS AGREGADOS (REFLECTEM O ARRAY atual de abastecimentos)
  get litersThisMonth() {
    const now = new Date();
    return this.abastecimentos
      .filter((a) => {
        const d = new Date(a.dtAbastecimento);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, a) => s + (a.qtLitros || 0), 0);
  }

  get totalSpent() {
    return this.abastecimentos.reduce((s, a) => s + (a.valorTotal || 0), 0);
  }

  get avgPricePerLiter() {
    const totalLiters = this.abastecimentos.reduce((s, a) => s + (a.qtLitros || 0), 0);
    if (!totalLiters) return 0;
    const totalValue = this.totalSpent;
    return totalValue / totalLiters;
  }

  get avgConsumption() {
    const records = this.abastecimentos
      .map((a) => a.mediaKmLitro)
      .filter((v) => v != null) as number[];

    if (!records.length) return 0;

    return records.reduce((s, v) => s + v, 0) / records.length;
  }

  formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
