import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;
type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG' | 'TRACE' | string;

interface LogRecord {
  id: UUID;
  timestamp: string; // ISO
  level: LogLevel;
  message: string;

  correlationId?: string;
  origin?: string; // ex: "frotapro-api"
  module?: string; // ex: "cargas"
  userEmail?: string;

  // detalhes (para drawer)
  path?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  stacktrace?: string;
  payload?: string;
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css'],
})
export class LogsComponent {
  // filtros
  searchTerm = '';
  filtroNivel: '' | LogLevel = '';
  filtroPeriodo: '' | '24H' | '7D' | '30D' = '24H';

  // drawer
  selected: LogRecord | null = null;

  // mock data (substitui por API depois)
  logs: LogRecord[] = [
    {
      id: 'lg-1',
      timestamp: '2026-01-15T17:05:10.000Z',
      level: 'INFO',
      message: 'Login efetuado com sucesso.',
      correlationId: '3b9a9d0f-2bde-4d9f-9c7a-1aa0d1b2c2aa',
      origin: 'frotapro-api',
      module: 'auth',
      userEmail: 'arthenyo@gmail.com',
      path: '/api/v1/auth/login',
      method: 'POST',
      statusCode: 200,
      durationMs: 98,
      payload: '{"email":"arthenyo@gmail.com"}',
    },
    {
      id: 'lg-2',
      timestamp: '2026-01-15T17:10:23.000Z',
      level: 'WARNING',
      message: 'Tentativa de acessar recurso sem permissão.',
      correlationId: 'c4bde0ad-3f32-4d0b-a8a8-3a78c2be3f01',
      origin: 'frotapro-api',
      module: 'admin',
      userEmail: 'operador@empresa.com',
      path: '/api/v1/admin/users',
      method: 'GET',
      statusCode: 403,
      durationMs: 44,
    },
    {
      id: 'lg-3',
      timestamp: '2026-01-15T17:18:40.000Z',
      level: 'ERROR',
      message: 'Falha ao sincronizar WinThor: timeout de conexão.',
      correlationId: 'e36c7c9a-19c3-4a2e-92b1-4bcbf1b7a8f9',
      origin: 'frotapro-integracao',
      module: 'integracoes',
      path: '/api/v1/winthor/sync',
      method: 'POST',
      statusCode: 504,
      durationMs: 30000,
      stacktrace: 'java.net.SocketTimeoutException: Read timed out\n\tat ...',
      payload: '{"tipo":"cargas","empresaId":"..."}',
    },
  ];

  // ===== KPIs =====
  get totalLogs() {
    return this.logsFiltrados.length;
  }
  get totalInfo() {
    return this.logsFiltrados.filter((l) => this.normLevel(l.level) === 'INFO').length;
  }
  get totalWarn() {
    return this.logsFiltrados.filter((l) => this.normLevel(l.level) === 'WARNING').length;
  }
  get totalError() {
    return this.logsFiltrados.filter((l) => this.normLevel(l.level) === 'ERROR').length;
  }

  // ===== FILTRO =====
  get logsFiltrados(): LogRecord[] {
    const t = (this.searchTerm || '').toLowerCase().trim();
    const niv = (this.filtroNivel || '').toUpperCase().trim();

    const now = Date.now();
    const from = this.periodToMs(this.filtroPeriodo);
    const minTime = from ? now - from : null;

    return this.logs
      .filter((l) => {
        // periodo
        if (minTime) {
          const ts = new Date(l.timestamp).getTime();
          if (ts < minTime) return false;
        }

        // nivel
        if (niv) {
          if (this.normLevel(l.level) !== niv) return false;
        }

        // busca
        if (t) {
          const hay = [
            l.message,
            l.correlationId || '',
            l.origin || '',
            l.module || '',
            l.userEmail || '',
            l.path || '',
            l.method || '',
            String(l.statusCode ?? ''),
          ]
            .join(' ')
            .toLowerCase();

          if (!hay.includes(t)) return false;
        }

        return true;
      })
      // ordena desc por data/hora
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private periodToMs(p: string) {
    if (p === '24H') return 24 * 60 * 60 * 1000;
    if (p === '7D') return 7 * 24 * 60 * 60 * 1000;
    if (p === '30D') return 30 * 24 * 60 * 60 * 1000;
    return 0;
  }

  // ===== AÇÕES =====
  refresh() {
    // mock: simula fetch e adiciona um registro
    const now = new Date().toISOString();
    this.logs.unshift({
      id: this.generateId(),
      timestamp: now,
      level: 'INFO',
      message: 'Atualização de logs (mock) executada.',
      correlationId: this.generateId(),
      origin: 'frotapro-ui',
      module: 'admin',
      userEmail: 'arthenyo@gmail.com',
    });
  }

  openDetails(l: LogRecord) {
    this.selected = l;
  }

  closeDetails() {
    this.selected = null;
  }

  trackById(_: number, l: LogRecord) {
    return l.id;
  }

  // ===== HELPERS =====
  private generateId(): string {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      try {
        return (crypto as any).randomUUID();
      } catch {}
    }
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  normLevel(l: string) {
    return (l || '').toUpperCase();
  }

  levelPillClass(l: string) {
    const v = this.normLevel(l);
    return {
      'pill-blue': v === 'INFO',
      'pill-amber': v === 'WARNING',
      'pill-red': v === 'ERROR',
      'pill-muted': !['INFO', 'WARNING', 'ERROR'].includes(v),
    };
  }

  formatIso(ts: string) {
    // deixa no fuso local do browser (pt-BR)
    try {
      const d = new Date(ts);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  }

  copy(text?: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
  }
}
