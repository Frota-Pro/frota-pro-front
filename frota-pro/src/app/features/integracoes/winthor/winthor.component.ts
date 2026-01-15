import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Aba = 'CONFIG' | 'HIST';

type SyncTipo = 'CAMINHOES' | 'MOTORISTAS' | 'CARGAS';

interface WinThorConfig {
  ativo: boolean;
  intervaloMin: number;

  syncCaminhoes: boolean;
  syncMotoristas: boolean;
  syncCargas: boolean;

  endpointPath: string; // exibido como referência
}

type LogStatus = 'SUCESSO' | 'FALHA' | 'EM_ANDAMENTO';

interface WinThorSyncLog {
  id: string;
  dt: string; // ISO
  tipo: SyncTipo;
  status: LogStatus;
  duracaoMs?: number;
  registros?: number;
  mensagem?: string;
}

@Component({
  selector: 'app-winthor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './winthor.component.html',
  styleUrls: ['./winthor.component.css'],
})
export class WinthorComponent {
  aba: Aba = 'CONFIG';

  // ======== estado/config ========
  config: WinThorConfig = {
    ativo: false,
    intervaloMin: 60,
    syncCaminhoes: true,
    syncMotoristas: true,
    syncCargas: true,
    endpointPath: '/functions/v1/winthor-sync',
  };

  // status conexão (mock)
  status = {
    conectado: true,
    ultimaVerificacao: '2026-01-15T11:10',
    ambiente: 'Produção',
    banco: 'Oracle (WinThor)',
    latenciaMs: 48,
  };

  // logs (mock)
  logs: WinThorSyncLog[] = [
    {
      id: 'lg1',
      dt: '2026-01-15T10:10',
      tipo: 'CAMINHOES',
      status: 'SUCESSO',
      duracaoMs: 2120,
      registros: 148,
      mensagem: 'Sincronização concluída.',
    },
    {
      id: 'lg2',
      dt: '2026-01-15T09:10',
      tipo: 'MOTORISTAS',
      status: 'SUCESSO',
      duracaoMs: 1540,
      registros: 62,
      mensagem: 'Sincronização concluída.',
    },
    {
      id: 'lg3',
      dt: '2026-01-15T08:10',
      tipo: 'CARGAS',
      status: 'FALHA',
      duracaoMs: 980,
      registros: 0,
      mensagem: 'Timeout ao consultar PCCARREG.',
    },
  ];

  // filtros histórico
  filtroTipo: '' | SyncTipo = '';
  filtroStatus: '' | LogStatus = '';
  searchTerm = '';

  // ======== UI ========
  setAba(a: Aba) {
    this.aba = a;
  }

  toggleAtivo() {
    this.config.ativo = !this.config.ativo;
  }

  salvarConfiguracao() {
    // aqui você depois conecta no backend
    alert('Configuração salva (mock).');
  }

  testarIntegracao() {
    // mock de “rodar agora”
    const tipo: SyncTipo =
      this.config.syncCargas ? 'CARGAS' : this.config.syncMotoristas ? 'MOTORISTAS' : 'CAMINHOES';

    const now = new Date().toISOString().slice(0, 16);

    this.logs.unshift({
      id: this.generateId(),
      dt: now,
      tipo,
      status: 'EM_ANDAMENTO',
      mensagem: 'Execução manual iniciada...',
    });

    // simula final
    setTimeout(() => {
      const idx = this.logs.findIndex((l) => l.dt === now && l.status === 'EM_ANDAMENTO');
      if (idx >= 0) {
        this.logs[idx] = {
          ...this.logs[idx],
          status: 'SUCESSO',
          duracaoMs: 1800,
          registros: Math.floor(Math.random() * 200) + 10,
          mensagem: 'Execução manual concluída.',
        };
      }
    }, 900);
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      try {
        return (crypto as any).randomUUID();
      } catch {}
    }
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  // ======== helpers UI ========
  pillStatusIntegracao() {
    return this.config.ativo ? 'ATIVA' : 'INATIVA';
  }

  pillClassIntegracao() {
    return {
      'pill-success': this.config.ativo,
      'pill-muted': !this.config.ativo,
    };
  }

  pillClassLog(s: LogStatus) {
    const v = (s || '').toUpperCase();
    return {
      'pill-success': v === 'SUCESSO',
      'pill-danger': v === 'FALHA',
      'pill-warn': v === 'EM_ANDAMENTO',
    };
  }

  iconForTipo(t: SyncTipo) {
    switch ((t || '').toUpperCase()) {
      case 'CAMINHOES':
        return 'fas fa-truck';
      case 'MOTORISTAS':
        return 'fas fa-user';
      case 'CARGAS':
        return 'fas fa-box';
      default:
        return 'fas fa-database';
    }
  }

  labelTipo(t: SyncTipo) {
    switch ((t || '').toUpperCase()) {
      case 'CAMINHOES':
        return 'Caminhões';
      case 'MOTORISTAS':
        return 'Motoristas';
      case 'CARGAS':
        return 'Cargas';
      default:
        return t;
    }
  }

  get logsFiltrados(): WinThorSyncLog[] {
    const t = (this.searchTerm || '').toLowerCase().trim();
    const ft = (this.filtroTipo || '').toUpperCase().trim();
    const fs = (this.filtroStatus || '').toUpperCase().trim();

    return this.logs.filter((l) => {
      if (ft && (l.tipo || '').toUpperCase() !== ft) return false;
      if (fs && (l.status || '').toUpperCase() !== fs) return false;

      if (t) {
        const hay = [l.tipo, l.status, l.mensagem || '', l.dt].join(' ').toLowerCase();
        if (!hay.includes(t)) return false;
      }

      return true;
    });
  }

  // payload exibido
  get payloadEsperado(): string {
    return `{
  "empresaId": "uuid",
  "tipo": "caminhoes | motoristas | cargas",
  "dados": [
    // Array de registros do WinThor
  ]
}`;
  }
}
