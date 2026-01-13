import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;

type TipoCombustivel = 'DIESEL' | 'GASOLINA' | 'ETANOL' | 'DIESEL_S10' | 'GNV' | string;

interface CaminhaoMini {
  id: UUID;
  codigo: string;
  placa: string;
  modelo?: string;
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
   NOVO TIPO — evita erros
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

  /* ======================================================
     ALIASES para o HTML “novo” (sem quebrar sua estrutura)
     ====================================================== */

  // 🔎 filtros (HTML novo)
  searchText: string = '';              // alias de searchTerm
  combustivelSelecionado: string = '';  // alias de filtroTipo
  dataInicio: string = '';              // alias de filtroDataInicio
  dataFim: string = '';                 // alias de filtroDataFim

  // 🔎 filtros (seus antigos — mantidos)
  filtroMotorista: string = '';
  filtroCaminhao: string = '';
  filtroTipo: string = '';
  filtroDataInicio: string = '';
  filtroDataFim: string = '';
  searchTerm: string = '';

  // 🧩 Expand (HTML novo usa expandId)
  expandId: string | null = null; // alias do expanded
  expanded: string | null = null;

  // 🪟 Modal (HTML novo usa isModalOpen/isEditMode/form)
  isModalOpen = false; // alias de showAddModal
  showAddModal = false;

  isEditMode = false;  // alias de isEditing
  isEditing = false;

  editingId: string | null = null;

  // form (HTML novo usa "form.*")
  form: any = {
    codigo: '',
    dtAbastecimento: '',
    tipoCombustivel: 'DIESEL',
    qtLitros: 0,
    valorLitro: 0,
    valorTotal: 0,
    precoLitro: 0,
    odometro: null,
    posto: '',
    observacao: '',
    caminhaoId: '',
    motoristaId: '',
    mediaKmLitro: null,
    formaPagamento: '',
    cidade: '',
    uf: '',
    numNotaOuCupom: ''
  };

  // ✅ listas para selects do modal
  combustiveis: TipoCombustivel[] = ['DIESEL', 'DIESEL_S10', 'GASOLINA', 'ETANOL', 'GNV'];

  // (mock) - você pode substituir por dados da API depois
  caminhoes: CaminhaoMini[] = [
    { id: 'v-1', codigo: 'CAM-001', placa: 'ABC1D23', modelo: 'Volvo FH 540' },
    { id: 'v-2', codigo: 'CAM-002', placa: 'XYZ9A87', modelo: 'Scania R450' },
  ];

  motoristas: MotoristaMini[] = [
    { id: 'm-1', nome: 'Carlos Silva', codigo: 'MTR-001' },
    { id: 'm-2', nome: 'Mariana Costa', codigo: 'MTR-002' },
  ];

  // Dados (mock)
  abastecimentos: Abastecimento[] = [
    {
      id: 'ab-1',
      codigo: 'AB-2025-0001',
      dtAbastecimento: '2025-12-01T09:30:00',
      caminhao: { id: 'v-1', codigo: 'CAM-001', placa: 'ABC1D23', modelo: 'Volvo FH 540' },
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
      caminhao: { id: 'v-2', codigo: 'CAM-002', placa: 'XYZ9A87', modelo: 'Scania R450' },
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
     Modelo “novo” (mantido)
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

  /* =============================
     KPI getters (HTML novo usa kpi*)
     ============================= */
  get kpiLitrosMes() {
    return this.litersThisMonth;
  }

  get kpiGastoTotal() {
    return this.totalSpent;
  }

  get kpiPrecoMedio() {
    return this.avgPricePerLiter;
  }

  get kpiConsumoMedio() {
    return this.avgConsumption;
  }

  /* =============================
     IDs
     ============================= */
  private generateId(): string {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      try {
        return (crypto as any).randomUUID();
      } catch {}
    }
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  /* ======================================================
     MODAL — Wrappers compatíveis com HTML novo
     ====================================================== */

  openModal() {
    // abre como "novo"
    this.openAddModal();
  }

  closeModal() {
    this.closeAddModal();
  }

  openAddModal() {
    this.isEditing = false;
    this.isEditMode = false;
    this.editingId = null;

    const codigo = `AB-${new Date().getFullYear()}-${(this.abastecimentos.length + 1)
      .toString()
      .padStart(4, '0')}`;

    const dt = new Date().toISOString().slice(0, 16);

    this.novo = {
      codigo,
      dtAbastecimento: dt,
      tipoCombustivel: 'DIESEL',
      qtLitros: 0,
      valorLitro: 0,
      valorTotal: 0,
      caminhao: { id: '', codigo: '', placa: '' },
      motorista: { id: '', nome: '', codigo: '' },
    };

    // preenche form para o HTML novo
    this.form = {
      codigo,
      dtAbastecimento: dt,
      tipoCombustivel: 'DIESEL',
      qtLitros: 0,
      valorLitro: 0,
      precoLitro: 0,
      valorTotal: 0,
      odometro: null,
      posto: '',
      observacao: '',
      caminhaoId: '',
      motoristaId: '',
      mediaKmLitro: null,
      formaPagamento: '',
      cidade: '',
      uf: '',
      numNotaOuCupom: '',
    };

    this.showAddModal = true;
    this.isModalOpen = true;
  }

  openEditModal(ab: Abastecimento) {
    this.isEditing = true;
    this.isEditMode = true;
    this.editingId = ab.id;

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

    // form para o HTML novo
    this.form = {
      codigo: ab.codigo,
      dtAbastecimento: dt,
      tipoCombustivel: ab.tipoCombustivel || 'DIESEL',
      qtLitros: ab.qtLitros ?? 0,
      valorLitro: ab.valorLitro ?? 0,
      precoLitro: ab.valorLitro ?? 0,
      valorTotal: ab.valorTotal ?? 0,
      odometro: ab.kmOdometro ?? null,
      posto: ab.posto ?? '',
      observacao: '', // você não tem observacao no modelo; deixe opcional
      caminhaoId: ab.caminhao?.id || '',
      motoristaId: ab.motorista?.id || '',
      mediaKmLitro: ab.mediaKmLitro ?? null,
      formaPagamento: ab.formaPagamento ?? '',
      cidade: ab.cidade ?? '',
      uf: ab.uf ?? '',
      numNotaOuCupom: ab.numNotaOuCupom ?? '',
    };

    this.showAddModal = true;
    this.isModalOpen = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.isModalOpen = false;

    this.isEditing = false;
    this.isEditMode = false;

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

    this.form = {
      codigo: '',
      dtAbastecimento: '',
      tipoCombustivel: 'DIESEL',
      qtLitros: 0,
      valorLitro: 0,
      precoLitro: 0,
      valorTotal: 0,
      odometro: null,
      posto: '',
      observacao: '',
      caminhaoId: '',
      motoristaId: '',
      mediaKmLitro: null,
      formaPagamento: '',
      cidade: '',
      uf: '',
      numNotaOuCupom: '',
    };
  }

  saveAbastecimento() {
    // Se o HTML novo está usando this.form, calculamos a partir dele
    const qt = Number(this.form.qtLitros || 0);
    const vl = Number(this.form.valorLitro || this.form.precoLitro || 0);
    const total = qt * vl;

    const caminhao = this.caminhoes.find(c => c.id === this.form.caminhaoId) || null;
    const motorista = this.motoristas.find(m => m.id === this.form.motoristaId) || null;

    if (!caminhao) {
      alert('Selecione um caminhão.');
      return;
    }
    if (!this.form.dtAbastecimento) {
      alert('Informe a data do abastecimento.');
      return;
    }

    if (this.isEditing && this.editingId) {
      const idx = this.abastecimentos.findIndex(x => x.id === this.editingId);
      if (idx >= 0) {
        this.abastecimentos[idx] = {
          id: this.editingId,
          codigo: this.form.codigo,
          dtAbastecimento: this.form.dtAbastecimento,
          caminhao: { ...caminhao },
          motorista: motorista ? { ...motorista } : null,
          kmOdometro: this.form.odometro ?? null,
          qtLitros: qt,
          valorLitro: vl,
          valorTotal: total,
          tipoCombustivel: this.form.tipoCombustivel,
          formaPagamento: this.form.formaPagamento || '',
          posto: this.form.posto || '',
          cidade: this.form.cidade || '',
          uf: this.form.uf || '',
          numNotaOuCupom: this.form.numNotaOuCupom || '',
          mediaKmLitro: this.form.mediaKmLitro ?? null,
        };
      }
    } else {
      const ab: Abastecimento = {
        id: this.generateId(),
        codigo: this.form.codigo,
        dtAbastecimento: this.form.dtAbastecimento,
        caminhao: { ...caminhao },
        motorista: motorista ? { ...motorista } : null,
        kmOdometro: this.form.odometro ?? null,
        qtLitros: qt,
        valorLitro: vl,
        valorTotal: total,
        tipoCombustivel: this.form.tipoCombustivel,
        formaPagamento: this.form.formaPagamento || '',
        posto: this.form.posto || '',
        cidade: this.form.cidade || '',
        uf: this.form.uf || '',
        numNotaOuCupom: this.form.numNotaOuCupom || '',
        mediaKmLitro: this.form.mediaKmLitro ?? null,
      };

      this.abastecimentos.unshift(ab);
    }

    this.closeAddModal();
  }

  deleteAbastecimento(id: UUID) {
    if (!confirm('Tem certeza que deseja excluir este abastecimento?')) return;
    this.abastecimentos = this.abastecimentos.filter(a => a.id !== id);
    if (this.expanded === id) this.expanded = null;
    if (this.expandId === id) this.expandId = null;
  }

  /* ======================================================
     EXPAND — compatível com HTML novo
     ====================================================== */
  toggleExpand(id: UUID) {
    this.expanded = this.expanded === id ? null : id;
    this.expandId = this.expanded; // mantém sincronizado
  }

  isExpanded(id: UUID) {
    return this.expanded === id;
  }

  trackById(index: number, item: Abastecimento) {
    return item.id;
  }

  /* ======================================================
     FILTROS — compatível com HTML novo
     ====================================================== */
  applyFilters() {
    // Só sincroniza aliases para o getter usar
    this.searchTerm = this.searchText || '';
    this.filtroTipo = this.combustivelSelecionado || '';
    this.filtroDataInicio = this.dataInicio || '';
    this.filtroDataFim = this.dataFim || '';
  }

  get abastecimentosFiltrados() {
    // garante sincronização mesmo se não chamar applyFilters
    this.applyFilters();

    const t = (this.searchTerm || '').toLowerCase().trim();
    const mot = (this.filtroMotorista || '').toLowerCase().trim();
    const cam = (this.filtroCaminhao || '').toLowerCase().trim();
    const tipo = (this.filtroTipo || '').toLowerCase().trim();

    // 🔥 normaliza datas (sem fuso)
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

    return this.abastecimentos.filter((a) => {
      const dt = new Date(a.dtAbastecimento);

      if (inicio && dt < inicio) return false;
      if (fim && dt > fim) return false;

      if (mot) {
        if (!`${a.motorista?.nome || ''} ${a.motorista?.codigo || ''}`.toLowerCase().includes(mot)) {
          return false;
        }
      }

      if (cam) {
        if (!`${a.caminhao.placa} ${a.caminhao.codigo}`.toLowerCase().includes(cam)) {
          return false;
        }
      }

      if (tipo && !String(a.tipoCombustivel || '').toLowerCase().includes(tipo)) {
        return false;
      }

      if (t) {
        const hay = [
          a.codigo || '',
          a.posto || '',
          a.motorista?.nome || '',
          a.motorista?.codigo || '',
          a.caminhao.placa || '',
          a.caminhao.codigo || '',
          a.numNotaOuCupom || '',
        ].join(' ').toLowerCase();

        if (!hay.includes(t)) return false;
      }

      return true;
    });
  }

  /* ======================================================
     KPIs (mantidos)
     ====================================================== */
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
    return this.totalSpent / totalLiters;
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
