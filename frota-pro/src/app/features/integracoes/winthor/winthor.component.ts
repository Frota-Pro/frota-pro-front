import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { IntegracaoWinthorApiService } from '../../../core/api/integracao-winthor-api.service';
import {
  IntegracaoWinthorConfigResponse,
  IntegracaoWinthorConfigUpdateRequest,
  IntegracaoWinthorJobResponse,
  IntegracaoWinthorStatusResponse,
  StatusSincronizacao,
  IntegracaoJobTipo,
} from '../../../core/api/integracao-winthor-api.models';

type TabKey = 'overview' | 'jobs' | 'logs';

@Component({
  selector: 'app-winthor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './winthor.component.html',
  styleUrl: './winthor.component.css',
})
export class WinthorComponent implements OnInit {

  tab: TabKey = 'overview';

  loading = false;
  saving = false;
  refreshing = false;

  // Config
  config?: IntegracaoWinthorConfigResponse;
  form: IntegracaoWinthorConfigUpdateRequest = {
    ativo: true,
    intervaloMin: null,
    syncCaminhoes: true,
    syncMotoristas: true,
    syncCargas: true,
  };

  // Status (API -> Integradora -> Oracle)
  status?: IntegracaoWinthorStatusResponse;
  statusLoading = false;

  // Manual sync inputs
  codFilial: number | null = null;
  dataCargas: string = this.todayISO();

  // Jobs
  jobsLoading = false;
  jobsPendente: IntegracaoWinthorJobResponse[] = [];
  jobsConcluido: IntegracaoWinthorJobResponse[] = [];
  jobsErro: IntegracaoWinthorJobResponse[] = [];

  jobsTipo: IntegracaoJobTipo = 'TODOS';
  pageSize = 50;

  // UI feedback
  toast: { type: 'success' | 'error' | 'info'; text: string } | null = null;

  constructor(
    private api: IntegracaoWinthorApiService
  ) {}

  ngOnInit(): void {
    this.bootstrap();
  }

  bootstrap(): void {
    this.loading = true;
    this.toast = null;

    this.api.getConfig()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (cfg) => {
          this.config = cfg;
          this.form = {
            ativo: cfg.ativo,
            intervaloMin: cfg.intervaloMin ?? null,
            syncCaminhoes: cfg.syncCaminhoes,
            syncMotoristas: cfg.syncMotoristas,
            syncCargas: cfg.syncCargas,
          };

          // Carrega status e jobs em seguida
          this.refreshStatus();
          this.refreshJobs();
        },
        error: (err) => this.showError('Falha ao carregar configuração da integração.', err),
      });
  }

  // =========================
  // Tabs
  // =========================
  setTab(t: TabKey): void {
    this.tab = t;
    if (t === 'jobs') this.refreshJobs();
    if (t === 'overview') this.refreshStatus();
  }

  // =========================
  // Config
  // =========================
  saveConfig(): void {
    this.saving = true;
    this.toast = null;

    const payload: IntegracaoWinthorConfigUpdateRequest = {
      ativo: !!this.form.ativo,
      intervaloMin: this.form.intervaloMin ?? null,
      syncCaminhoes: !!this.form.syncCaminhoes,
      syncMotoristas: !!this.form.syncMotoristas,
      syncCargas: !!this.form.syncCargas,
    };

    this.api.updateConfig(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (cfg) => {
          this.config = cfg;
          this.form = {
            ativo: cfg.ativo,
            intervaloMin: cfg.intervaloMin ?? null,
            syncCaminhoes: cfg.syncCaminhoes,
            syncMotoristas: cfg.syncMotoristas,
            syncCargas: cfg.syncCargas,
          };
          this.showToast('success', 'Configuração salva com sucesso.');
          this.refreshStatus();
        },
        error: (err) => this.showError('Falha ao salvar configuração.', err),
      });
  }

  // =========================
  // Status
  // =========================
  refreshStatus(): void {
    this.statusLoading = true;
    this.api.getStatus()
      .pipe(finalize(() => (this.statusLoading = false)))
      .subscribe({
        next: (st) => (this.status = st),
        error: (err) => {
          // Se status falhar, não quebra tela
          this.status = {
            apiOk: true,
            integradoraOk: false,
            oracleOk: false,
            integradoraStatus: 'DOWN',
            oracleStatus: 'UNKNOWN',
            latenciaMs: null,
            verificadoEm: new Date().toISOString(),
          };
          this.showError('Não foi possível verificar status da integradora.', err);
        }
      });
  }

  // =========================
  // Manual Sync
  // =========================
  syncMotoristas(): void {
    this.refreshing = true;
    this.toast = null;
    this.api.syncMotoristas()
      .pipe(finalize(() => (this.refreshing = false)))
      .subscribe({
        next: (res) => {
          this.showToast('success', `Sincronização de motoristas solicitada. Job: ${res?.jobId ?? '-'}`);
          this.refreshJobs();
        },
        error: (err) => this.showError('Falha ao solicitar sincronização de motoristas.', err),
      });
  }

  syncCaminhoes(): void {
    this.refreshing = true;
    this.toast = null;
    this.api.syncCaminhoes(this.codFilial)
      .pipe(finalize(() => (this.refreshing = false)))
      .subscribe({
        next: (res) => {
          this.showToast('success', `Sincronização de caminhões solicitada. Job: ${res?.jobId ?? '-'}`);
          this.refreshJobs();
        },
        error: (err) => this.showError('Falha ao solicitar sincronização de caminhões.', err),
      });
  }

  syncCargas(): void {
    this.refreshing = true;
    this.toast = null;
    const data = (this.dataCargas || '').trim() || null;

    this.api.syncCargas(data)
      .pipe(finalize(() => (this.refreshing = false)))
      .subscribe({
        next: (res) => {
          this.showToast('success', `Sincronização de cargas solicitada. Job: ${res?.jobId ?? '-'}`);
          this.refreshJobs();
        },
        error: (err) => this.showError('Falha ao solicitar sincronização de cargas.', err),
      });
  }

  // =========================
  // Jobs
  // =========================
  refreshJobs(): void {
    this.jobsLoading = true;
    this.toast = null;

    const pendentes: StatusSincronizacao[] = ['PENDENTE', 'PROCESSANDO'];
    const erros: StatusSincronizacao[] = ['ERRO'];
    const concluidos: StatusSincronizacao[] = ['CONCLUIDO'];

    // Carrega em paralelo (3 chamadas)
    let done = 0;
    const finish = () => {
      done += 1;
      if (done >= 3) this.jobsLoading = false;
    };

    this.api.listJobs({ tipo: this.jobsTipo, status: pendentes, page: 0, size: this.pageSize })
      .pipe(finalize(() => finish()))
      .subscribe({
        next: (rows) => (this.jobsPendente = rows || []),
        error: (err) => {
          this.jobsPendente = [];
          this.showError('Falha ao carregar jobs pendentes/processando.', err);
        }
      });

    this.api.listJobs({ tipo: this.jobsTipo, status: erros, page: 0, size: this.pageSize })
      .pipe(finalize(() => finish()))
      .subscribe({
        next: (rows) => (this.jobsErro = rows || []),
        error: (err) => {
          this.jobsErro = [];
          this.showError('Falha ao carregar jobs com erro.', err);
        }
      });

    this.api.listJobs({ tipo: this.jobsTipo, status: concluidos, page: 0, size: this.pageSize })
      .pipe(finalize(() => finish()))
      .subscribe({
        next: (rows) => (this.jobsConcluido = rows || []),
        error: (err) => {
          this.jobsConcluido = [];
          this.showError('Falha ao carregar jobs concluídos.', err);
        }
      });
  }

  retryJob(row: IntegracaoWinthorJobResponse): void {
    if (!row?.jobId || !row?.tipo) return;

    const tipo = row.tipo; // 'CARGAS' | 'CAMINHOES' | 'MOTORISTAS'
    this.toast = null;

    this.api.retryJob(tipo, row.jobId)
      .subscribe({
        next: () => {
          this.showToast('success', `Job reenfileirado (${tipo}).`);
          this.refreshJobs();
        },
        error: (err) => this.showError(`Falha ao reenfileirar job (${tipo}).`, err),
      });
  }

  // =========================
  // Helpers UI
  // =========================
  chipClass(status?: StatusSincronizacao | null): string {
    const s = (status || '').toUpperCase();
    if (s === 'CONCLUIDO') return 'chip ok';
    if (s === 'PROCESSANDO') return 'chip warn';
    if (s === 'PENDENTE') return 'chip info';
    if (s === 'ERRO') return 'chip err';
    return 'chip';
  }

  pillClass(ok?: boolean): string {
    if (ok === true) return 'pill ok';
    if (ok === false) return 'pill err';
    return 'pill';
  }

  formatDateTime(iso?: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('pt-BR');
  }

  formatDate(iso?: string | null): string {
    if (!iso) return '-';
    // LocalDate (yyyy-MM-dd)
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m, day] = iso.split('-').map(Number);
      const d = new Date(y, m - 1, day);
      return d.toLocaleDateString('pt-BR');
    }
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('pt-BR');
  }

  private todayISO(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  showToast(type: 'success' | 'error' | 'info', text: string): void {
    this.toast = { type, text };
    // auto-hide
    setTimeout(() => {
      if (this.toast?.text === text) this.toast = null;
    }, 5000);
  }

  showError(userMsg: string, err: any): void {
    const apiMsg = err?.error?.message || err?.error?.erro || err?.message;
    const text = apiMsg ? `${userMsg} (${apiMsg})` : userMsg;
    this.showToast('error', text);
    // eslint-disable-next-line no-console
    console.error(userMsg, err);
  }
}
