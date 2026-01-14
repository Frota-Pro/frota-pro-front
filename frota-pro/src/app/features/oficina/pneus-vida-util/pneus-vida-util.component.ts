import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;

type StatusPneu = 'EM_USO' | 'ESTOQUE' | 'RECAPAGEM' | 'DESCARTE' | string;

type PosicaoPneu =
  | 'DIRECAO_ESQ'
  | 'DIRECAO_DIR'
  | 'TRACAO_1_ESQ'
  | 'TRACAO_1_DIR'
  | 'TRACAO_2_ESQ'
  | 'TRACAO_2_DIR'
  | 'EIXO_3_ESQ'
  | 'EIXO_3_DIR'
  | 'ESTEPE'
  | string;

interface CaminhaoMini {
  id: UUID;
  placa: string;
  modelo?: string;
}

interface MovimentacaoPneu {
  id: UUID;
  dt: string; // ISO
  acao: 'INSTALADO' | 'REMOVIDO' | 'TROCA_POSICAO' | 'ENVIADO_RECAPAGEM' | 'RETORNO_RECAPAGEM' | 'DESCARTE' | string;
  caminhaoAntes?: string | null;
  posicaoAntes?: string | null;
  kmAntes?: number | null;

  caminhaoDepois?: string | null;
  posicaoDepois?: string | null;
  kmDepois?: number | null;

  observacao?: string;
}

interface Pneu {
  id: UUID;
  codigo: string;       // PNE-000123
  fogo: string;         // número do pneu (popular)
  serie?: string;       // serial do fabricante
  marca?: string;
  modelo?: string;
  medida?: string;      // 295/80R22.5
  dot?: string;         // DOT
  status: StatusPneu;

  recapagens: number;
  custoAquisicao?: number | null;
  custoTotal?: number | null;

  vidaPrevistaKm?: number; // ex 90000
  kmAtual?: number;        // rodado acumulado pneu
  kmInstalacao?: number | null; // km do caminhão quando instalou

  profundidadeMm?: number | null; // sulco atual
  profundidadeMinMm?: number | null; // mínimo para troca (alerta)

  caminhaoAtual?: CaminhaoMini | null;
  posicaoAtual?: PosicaoPneu | null;

  dtCadastro: string; // ISO
  dtUltMov?: string | null;

  observacao?: string;

  historico: MovimentacaoPneu[];
}

@Component({
  selector: 'app-pneus-vida-util',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pneus-vida-util.component.html',
  styleUrls: ['./pneus-vida-util.component.css'],
})
export class PneusVidaUtilComponent {
  // ======== filtros ========
  searchTerm = '';
  filtroStatus: '' | StatusPneu = '';
  filtroCaminhao: '' | string = '';
  filtroPosicao: '' | PosicaoPneu = '';
  filtroMarca: '' | string = '';
  filtroSomenteAlertas = false;

  // ======== dados mock ========
  caminhoes: CaminhaoMini[] = [
    { id: 'c1', placa: 'ABC-1234', modelo: 'Volvo FH 540' },
    { id: 'c2', placa: 'DEF-5678', modelo: 'Scania R450' },
  ];

  posicoes: PosicaoPneu[] = [
    'DIRECAO_ESQ','DIRECAO_DIR','TRACAO_1_ESQ','TRACAO_1_DIR','TRACAO_2_ESQ','TRACAO_2_DIR','EIXO_3_ESQ','EIXO_3_DIR','ESTEPE'
  ];

  pneus: Pneu[] = [
    {
      id: 'p1',
      codigo: 'PNE-000001',
      fogo: 'FGO-101',
      serie: 'SR-AX9-0101',
      marca: 'Michelin',
      modelo: 'X Multi',
      medida: '295/80R22.5',
      dot: '2424',
      status: 'EM_USO',
      recapagens: 1,
      custoAquisicao: 2600,
      custoTotal: 3100,
      vidaPrevistaKm: 90000,
      kmAtual: 68500,
      kmInstalacao: 120340,
      profundidadeMm: 6.2,
      profundidadeMinMm: 3.0,
      caminhaoAtual: { id: 'c1', placa: 'ABC-1234', modelo: 'Volvo FH 540' },
      posicaoAtual: 'TRACAO_1_ESQ',
      dtCadastro: '2026-01-01T10:10',
      dtUltMov: '2026-01-10T09:10',
      observacao: 'Pneu recapado, monitorar desgaste.',
      historico: [
        {
          id: 'h1',
          dt: '2026-01-10T09:10',
          acao: 'TROCA_POSICAO',
          caminhaoAntes: 'ABC-1234',
          posicaoAntes: 'TRACAO_1_DIR',
          kmAntes: 182000,
          caminhaoDepois: 'ABC-1234',
          posicaoDepois: 'TRACAO_1_ESQ',
          kmDepois: 182000,
          observacao: 'Balanceamento realizado.',
        },
      ],
    },
    {
      id: 'p2',
      codigo: 'PNE-000002',
      fogo: 'FGO-202',
      serie: 'SR-BB2-0202',
      marca: 'Pirelli',
      modelo: 'FH55',
      medida: '295/80R22.5',
      dot: '1025',
      status: 'ESTOQUE',
      recapagens: 0,
      custoAquisicao: 2400,
      custoTotal: 2400,
      vidaPrevistaKm: 80000,
      kmAtual: 0,
      kmInstalacao: null,
      profundidadeMm: 14.0,
      profundidadeMinMm: 3.0,
      caminhaoAtual: null,
      posicaoAtual: null,
      dtCadastro: '2026-01-06T11:00',
      dtUltMov: '2026-01-06T11:00',
      observacao: '',
      historico: [
        { id: 'h2', dt: '2026-01-06T11:00', acao: 'REMOVIDO', observacao: 'Entrada em estoque.' },
      ],
    },
    {
      id: 'p3',
      codigo: 'PNE-000003',
      fogo: 'FGO-303',
      serie: 'SR-CC3-0303',
      marca: 'Bridgestone',
      modelo: 'R-Steer',
      medida: '295/80R22.5',
      dot: '4223',
      status: 'EM_USO',
      recapagens: 0,
      custoAquisicao: 2300,
      custoTotal: 2300,
      vidaPrevistaKm: 85000,
      kmAtual: 83000,
      kmInstalacao: 201200,
      profundidadeMm: 2.7,
      profundidadeMinMm: 3.0,
      caminhaoAtual: { id: 'c2', placa: 'DEF-5678', modelo: 'Scania R450' },
      posicaoAtual: 'DIRECAO_DIR',
      dtCadastro: '2025-12-12T09:00',
      dtUltMov: '2026-01-12T14:30',
      observacao: 'Atingiu mínimo de sulco.',
      historico: [
        {
          id: 'h3',
          dt: '2026-01-12T14:30',
          acao: 'INSTALADO',
          caminhaoDepois: 'DEF-5678',
          posicaoDepois: 'DIRECAO_DIR',
          kmDepois: 201200,
          observacao: 'Instalação inicial.',
        },
      ],
    },
  ];

  // ======== UI ========
  expandedId: UUID | null = null;

  // ======== modal cadastro ========
  showCadastro = false;
  cadastroEditing = false;
  cadastroEditingId: UUID | null = null;
  formCad: any = this.emptyCad();

  // ======== modal movimentação ========
  showMov = false;
  movingId: UUID | null = null;
  formMov: any = this.emptyMov();

  // ======== helpers ========
  private emptyCad() {
    return {
      codigo: '',
      fogo: '',
      serie: '',
      marca: '',
      modelo: '',
      medida: '295/80R22.5',
      dot: '',
      status: 'ESTOQUE' as StatusPneu,
      recapagens: 0,
      custoAquisicao: null as number | null,
      custoTotal: null as number | null,
      vidaPrevistaKm: 80000,
      kmAtual: 0,
      profundidadeMm: null as number | null,
      profundidadeMinMm: 3.0,
      observacao: '',
    };
  }

  private emptyMov() {
    return {
      acao: 'INSTALADO',
      caminhaoId: '',
      posicao: '',
      kmCaminhao: null as number | null,
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

  private nextCodigo(): string {
    const nums = this.pneus
      .map(p => Number((p.codigo || '').replace(/\D/g, '')))
      .filter(n => !Number.isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `PNE-${String(next).padStart(6, '0')}`;
  }

  trackById(_: number, p: Pneu) {
    return p.id;
  }

  toggleExpand(id: UUID) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  // ======== KPIs ricos ========

  get totalPneus() {
    return this.pneus.length;
  }

  get emUso() {
    return this.pneus.filter(p => (p.status || '').toUpperCase() === 'EM_USO').length;
  }

  get emEstoque() {
    return this.pneus.filter(p => (p.status || '').toUpperCase() === 'ESTOQUE').length;
  }

  get emRecapagem() {
    return this.pneus.filter(p => (p.status || '').toUpperCase() === 'RECAPAGEM').length;
  }

  get emAlerta() {
    return this.pneus.filter(p => this.isAlerta(p)).length;
  }

  get custoTotalFrota() {
    return this.pneus.reduce((s, p) => s + Number(p.custoTotal || p.custoAquisicao || 0), 0);
  }

  get kmTotalRodado() {
    return this.pneus.reduce((s, p) => s + Number(p.kmAtual || 0), 0);
  }

  get custoPorKm() {
    const km = this.kmTotalRodado;
    if (!km) return 0;
    return this.custoTotalFrota / km;
  }

  get taxaMediaRecapagem() {
    if (!this.totalPneus) return 0;
    const totalRec = this.pneus.reduce((s, p) => s + Number(p.recapagens || 0), 0);
    return totalRec / this.totalPneus;
  }

  // ======== regras de alerta ========
  isAlerta(p: Pneu): boolean {
    // alerta por sulco
    const mm = p.profundidadeMm;
    const min = p.profundidadeMinMm ?? 3.0;
    if (mm != null && mm <= min) return true;

    // alerta por vida útil (>= 90% da prevista)
    const prev = Number(p.vidaPrevistaKm || 0);
    const atual = Number(p.kmAtual || 0);
    if (prev > 0 && atual >= prev * 0.9) return true;

    return false;
  }

  getAlertaLabel(p: Pneu): string {
    const mm = p.profundidadeMm;
    const min = p.profundidadeMinMm ?? 3.0;
    const prev = Number(p.vidaPrevistaKm || 0);
    const atual = Number(p.kmAtual || 0);

    if (mm != null && mm <= min) return 'Sulco no mínimo';
    if (prev > 0 && atual >= prev * 0.9) return 'Próximo da vida útil';
    return '—';
  }

  progressoVida(p: Pneu): number {
    const prev = Number(p.vidaPrevistaKm || 0);
    const atual = Number(p.kmAtual || 0);
    if (!prev) return 0;
    const pct = (atual / prev) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  statusClass(s: string) {
    const v = (s || '').toUpperCase();
    return {
      'pill-success': v === 'EM_USO',
      'pill-info': v === 'ESTOQUE',
      'pill-warn': v === 'RECAPAGEM',
      'pill-muted': v === 'DESCARTE',
    };
  }

  // ======== filtros ========
  get pneusFiltrados(): Pneu[] {
    const t = (this.searchTerm || '').toLowerCase().trim();
    const st = (this.filtroStatus || '').toUpperCase().trim();
    const cam = (this.filtroCaminhao || '').trim();
    const pos = (this.filtroPosicao || '').trim();
    const marca = (this.filtroMarca || '').toLowerCase().trim();

    return this.pneus.filter(p => {
      if (st && (p.status || '').toUpperCase() !== st) return false;

      if (cam) {
        const placa = p.caminhaoAtual?.placa || '';
        if (placa !== cam) return false;
      }

      if (pos) {
        const pp = p.posicaoAtual || '';
        if (pp !== pos) return false;
      }

      if (marca) {
        if (!String(p.marca || '').toLowerCase().includes(marca)) return false;
      }

      if (this.filtroSomenteAlertas && !this.isAlerta(p)) return false;

      if (t) {
        const hay = [
          p.codigo,
          p.fogo,
          p.serie || '',
          p.marca || '',
          p.modelo || '',
          p.medida || '',
          p.dot || '',
          p.status || '',
          p.caminhaoAtual?.placa || '',
          p.posicaoAtual || '',
        ].join(' ').toLowerCase();

        if (!hay.includes(t)) return false;
      }

      return true;
    });
  }

  // ======== cadastro ========
  openCadastro() {
    this.cadastroEditing = false;
    this.cadastroEditingId = null;
    this.formCad = this.emptyCad();
    this.formCad.codigo = this.nextCodigo();
    this.formCad.status = 'ESTOQUE';
    this.formCad.kmAtual = 0;
    this.showCadastro = true;
  }

  openEditarCadastro(p: Pneu) {
    this.cadastroEditing = true;
    this.cadastroEditingId = p.id;
    this.formCad = {
      codigo: p.codigo,
      fogo: p.fogo,
      serie: p.serie || '',
      marca: p.marca || '',
      modelo: p.modelo || '',
      medida: p.medida || '',
      dot: p.dot || '',
      status: p.status,
      recapagens: p.recapagens || 0,
      custoAquisicao: p.custoAquisicao ?? null,
      custoTotal: p.custoTotal ?? null,
      vidaPrevistaKm: p.vidaPrevistaKm ?? 0,
      kmAtual: p.kmAtual ?? 0,
      profundidadeMm: p.profundidadeMm ?? null,
      profundidadeMinMm: p.profundidadeMinMm ?? 3.0,
      observacao: p.observacao || '',
    };
    this.showCadastro = true;
  }

  closeCadastro() {
    this.showCadastro = false;
    this.cadastroEditing = false;
    this.cadastroEditingId = null;
    this.formCad = this.emptyCad();
  }

  salvarCadastro() {
    if (!this.formCad.fogo) {
      alert('Informe o "Fogo" do pneu.');
      return;
    }
    if (!this.formCad.codigo) this.formCad.codigo = this.nextCodigo();

    const payloadBase = {
      codigo: this.formCad.codigo.trim(),
      fogo: this.formCad.fogo.trim(),
      serie: (this.formCad.serie || '').trim() || undefined,
      marca: (this.formCad.marca || '').trim() || undefined,
      modelo: (this.formCad.modelo || '').trim() || undefined,
      medida: (this.formCad.medida || '').trim() || undefined,
      dot: (this.formCad.dot || '').trim() || undefined,
      status: this.formCad.status as StatusPneu,
      recapagens: Number(this.formCad.recapagens || 0),
      custoAquisicao: this.formCad.custoAquisicao != null ? Number(this.formCad.custoAquisicao) : null,
      custoTotal: this.formCad.custoTotal != null ? Number(this.formCad.custoTotal) : null,
      vidaPrevistaKm: Number(this.formCad.vidaPrevistaKm || 0),
      kmAtual: Number(this.formCad.kmAtual || 0),
      profundidadeMm: this.formCad.profundidadeMm != null ? Number(this.formCad.profundidadeMm) : null,
      profundidadeMinMm: this.formCad.profundidadeMinMm != null ? Number(this.formCad.profundidadeMinMm) : 3.0,
      observacao: (this.formCad.observacao || '').trim() || '',
    };

    if (this.cadastroEditing && this.cadastroEditingId) {
      this.pneus = this.pneus.map(p => {
        if (p.id !== this.cadastroEditingId) return p;
        return {
          ...p,
          ...payloadBase,
          dtUltMov: p.dtUltMov || new Date().toISOString().slice(0, 16),
        };
      });
    } else {
      const novo: Pneu = {
        id: this.generateId(),
        ...payloadBase,
        caminhaoAtual: null,
        posicaoAtual: null,
        kmInstalacao: null,
        dtCadastro: new Date().toISOString().slice(0, 16),
        dtUltMov: new Date().toISOString().slice(0, 16),
        historico: [
          {
            id: this.generateId(),
            dt: new Date().toISOString().slice(0, 16),
            acao: 'REMOVIDO',
            observacao: 'Cadastro inicial / entrada no sistema.',
          },
        ],
      };
      this.pneus.unshift(novo);
    }

    this.closeCadastro();
  }

  // ======== movimentação ========
  openMovimentar(p: Pneu) {
    this.movingId = p.id;
    this.formMov = this.emptyMov();

    // se já está instalado, sugere caminhão/posição atual
    if (p.caminhaoAtual?.id) this.formMov.caminhaoId = p.caminhaoAtual.id;
    if (p.posicaoAtual) this.formMov.posicao = p.posicaoAtual;

    this.showMov = true;
  }

  closeMovimentar() {
    this.showMov = false;
    this.movingId = null;
    this.formMov = this.emptyMov();
  }

  aplicarMovimentacao() {
    if (!this.movingId) return;
    const idx = this.pneus.findIndex(p => p.id === this.movingId);
    if (idx < 0) return;

    const p = this.pneus[idx];

    const acao = String(this.formMov.acao || '').toUpperCase();
    const caminhao = this.caminhoes.find(c => c.id === this.formMov.caminhaoId) || null;
    const posicao = this.formMov.posicao || null;
    const kmCaminhao = this.formMov.kmCaminhao != null ? Number(this.formMov.kmCaminhao) : null;

    const beforeCaminhao = p.caminhaoAtual?.placa || null;
    const beforePos = p.posicaoAtual || null;

    const mov: MovimentacaoPneu = {
      id: this.generateId(),
      dt: new Date().toISOString().slice(0, 16),
      acao,
      caminhaoAntes: beforeCaminhao,
      posicaoAntes: beforePos,
      kmAntes: kmCaminhao,
      caminhaoDepois: null,
      posicaoDepois: null,
      kmDepois: kmCaminhao,
      observacao: (this.formMov.observacao || '').trim() || '',
    };

    // regras por ação
    if (acao === 'INSTALADO') {
      if (!caminhao || !posicao) {
        alert('Para INSTALAR, informe caminhão e posição.');
        return;
      }
      p.caminhaoAtual = caminhao;
      p.posicaoAtual = posicao;
      p.status = 'EM_USO';
      p.kmInstalacao = kmCaminhao ?? p.kmInstalacao ?? null;

      mov.caminhaoDepois = caminhao.placa;
      mov.posicaoDepois = posicao;
    }

    if (acao === 'REMOVIDO') {
      // volta para estoque
      p.caminhaoAtual = null;
      p.posicaoAtual = null;
      p.status = 'ESTOQUE';

      mov.caminhaoDepois = null;
      mov.posicaoDepois = null;
    }

    if (acao === 'TROCA_POSICAO') {
      if (!caminhao || !posicao) {
        alert('Para TROCA, informe caminhão e posição.');
        return;
      }
      // mantém EM_USO
      p.caminhaoAtual = caminhao;
      p.posicaoAtual = posicao;
      p.status = 'EM_USO';

      mov.caminhaoDepois = caminhao.placa;
      mov.posicaoDepois = posicao;
    }

    if (acao === 'ENVIADO_RECAPAGEM') {
      // sai do caminhão
      p.caminhaoAtual = null;
      p.posicaoAtual = null;
      p.status = 'RECAPAGEM';

      mov.caminhaoDepois = null;
      mov.posicaoDepois = null;
    }

    if (acao === 'RETORNO_RECAPAGEM') {
      p.status = 'ESTOQUE';
      p.recapagens = Number(p.recapagens || 0) + 1;
      // opcional: reset sulco (não inventar, mas pode sugerir)
      mov.caminhaoDepois = null;
      mov.posicaoDepois = null;
    }

    if (acao === 'DESCARTE') {
      p.caminhaoAtual = null;
      p.posicaoAtual = null;
      p.status = 'DESCARTE';

      mov.caminhaoDepois = null;
      mov.posicaoDepois = null;
    }

    p.dtUltMov = mov.dt;
    p.historico = [mov, ...(p.historico || [])];

    this.pneus[idx] = { ...p };
    this.closeMovimentar();
  }

  excluir(id: UUID) {
    if (!confirm('Tem certeza que deseja excluir este pneu?')) return;
    this.pneus = this.pneus.filter(p => p.id !== id);
    if (this.expandedId === id) this.expandedId = null;
  }

  formatCurrency(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
