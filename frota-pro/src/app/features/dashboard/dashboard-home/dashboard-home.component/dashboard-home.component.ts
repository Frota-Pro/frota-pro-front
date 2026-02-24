import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';
import { ActionButtonComponent } from '../../../../shared/ui/action-button/action-button.component';

import { DashboardApiService } from '../../../../core/api/dashboard-api.service';
import { DashboardResumoResponse } from '../../../../core/api/dashboard-api.models';
import { Observable, Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthMeResponse } from '../../../../core/auth/auth-user.model';
import { AuthUserService } from '../../../../core/auth/auth-user.service';
import { formatKgFromTon } from '../../../../shared/utils/weight';
import { NotificacaoApiService } from '../../../../core/api/notificacao-api.service';
import { NotificacaoResponse, NotificacaoTipo } from '../../../../core/api/notificacao-api.models';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, StatCardComponent, ActionButtonComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css'],
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private dashboardApi: DashboardApiService,
    public authUser: AuthUserService,
    private notificacaoApi: NotificacaoApiService,
  ) {
    this.user$ = this.authUser.user$;
  }

  private destroy$ = new Subject<void>();

  isClosed = false;
  user$!: Observable<AuthMeResponse | null>;
  // --- Header ---
  readonly pageTitle = 'Dashboard';
  readonly pageSubtitle = this.formatToday();

  loading = true;
  errorMsg: string | null = null;

  // KPIs (preenchido pela API)
  kpis = [
    { title: 'Cargas Ativas', value: 0, helper: '', icon: 'fas fa-cube', variant: 'primary' as const },
    { title: 'Finalizadas Hoje', value: 0, helper: '', icon: 'fas fa-check', variant: 'success' as const },
    { title: 'Litros (30d)', value: '0,0L', helper: '', icon: 'fas fa-gas-pump', variant: 'warning' as const },
    { title: 'Metas Ativas', value: 0, helper: '', icon: 'fas fa-bullseye', variant: 'info' as const },
    { title: 'OS Abertas', value: 0, helper: '', icon: 'fas fa-wrench', variant: 'neutral' as const },
  ];

  cargasRecentes: Array<{
    numero: string;
    origem: string;
    destino: string;
    valor: string;
    peso: string;
    status: string;
  }> = [];

  readonly notificationPageSize = 5;
  readonly notificationModalPageSize = 20;
  readonly notificationsPollMs = 10000;
  unreadCount = 0;
  notificationsOpen = false;
  activeTab: 'todas' | 'naoLidas' = 'todas';
  hasIncomingNotification = false;
  private cueTimeoutId: number | null = null;
  private unreadSnapshot: number | null = null;

  notifications: NotificacaoResponse[] = [];
  notificationsLoading = false;
  notificationsLoadingMore = false;
  notificationsError: string | null = null;
  notificationsPage = 0;
  notificationsLastPage = false;

  notificationsModalOpen = false;
  modalActiveTab: 'todas' | 'naoLidas' = 'todas';
  modalNotifications: NotificacaoResponse[] = [];
  modalNotificationsLoading = false;
  modalNotificationsLoadingMore = false;
  modalNotificationsError: string | null = null;
  modalNotificationsPage = 0;
  modalNotificationsLastPage = false;

  ngOnInit(): void {
    this.loading = true;
    this.errorMsg = null;

    this.dashboardApi.getResumo().subscribe({
      next: (res) => this.applyResumo(res),
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Erro ao carregar o dashboard.';
        this.loading = false;
      },
    });

    this.refreshUnreadCount();
    interval(this.notificationsPollMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.pollNotifications());
  }

  ngOnDestroy(): void {
    if (this.cueTimeoutId !== null) {
      window.clearTimeout(this.cueTimeoutId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyResumo(res: DashboardResumoResponse) {
    // KPIs
    this.kpis = [
      { title: 'Cargas Ativas', value: res.cargasAtivas ?? 0, helper: '', icon: 'fas fa-cube', variant: 'primary' as const },
      { title: 'Finalizadas Hoje', value: res.finalizadasHoje ?? 0, helper: '', icon: 'fas fa-check', variant: 'success' as const },
      { title: 'Litros (30d)', value: `${this.formatNumber(res.litros30d ?? 0)}L`, helper: '', icon: 'fas fa-gas-pump', variant: 'warning' as const },
      { title: 'Metas Ativas', value: res.metasAtivas ?? 0, helper: '', icon: 'fas fa-bullseye', variant: 'info' as const },
      { title: 'OS Abertas', value: res.osAbertas ?? 0, helper: '', icon: 'fas fa-wrench', variant: 'neutral' as const },
    ];

    // Cargas recentes
    this.cargasRecentes = (res.cargasRecentes ?? []).map((c) => ({
      numero: c.numeroCarga,
      origem: c.origem || 'N/A',
      destino: c.destino || 'N/A',
      valor: this.formatMoney(c.valorTotal),
      peso: this.formatKg(c.pesoCarga),
      status: this.formatStatus(c.status),
    }));

    this.loading = false;
  }

  // --- Ações rápidas ---
  novaCarga() {
    this.router.navigate(['/dashboard/cargas']);
  }
  novoAbastecimento() {
    this.router.navigate(['/dashboard/abastecimentos']);
  }
  novaOS() {
    this.router.navigate(['/dashboard/manutencoes']);
  }
  novaMeta() {
    this.router.navigate(['/dashboard/metas']);
  }
  verTodasCargas() {
    this.router.navigate(['/dashboard/cargas']);
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.hasIncomingNotification = false;
      this.loadNotifications(true);
    }
  }

  switchTab(tab: 'todas' | 'naoLidas'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.loadNotifications(true);
  }

  openNotificationsModal(event?: MouseEvent): void {
    event?.stopPropagation();
    this.notificationsOpen = false;
    this.notificationsModalOpen = true;
    this.modalActiveTab = this.activeTab;
    this.loadModalNotifications(true);
  }

  closeNotificationsModal(): void {
    this.notificationsModalOpen = false;
  }

  switchModalTab(tab: 'todas' | 'naoLidas'): void {
    if (this.modalActiveTab === tab) return;
    this.modalActiveTab = tab;
    this.loadModalNotifications(true);
  }

  markAllAsRead(): void {
    this.notificacaoApi.marcarTodasComoLidas().subscribe({
      next: () => {
        this.refreshUnreadCount();
        this.loadNotifications(true);
        if (this.notificationsModalOpen) {
          this.loadModalNotifications(true);
        }
      },
    });
  }

  openNotification(item: NotificacaoResponse): void {
    const navigate = () => this.navigateByReference(item);

    if (!item.lida) {
      this.notificacaoApi.marcarComoLida(item.id).subscribe({
        next: () => {
          item.lida = true;
          item.lidaEm = new Date().toISOString();
          this.syncNotificationRead(item.id);
          this.refreshUnreadCount();
          if (this.activeTab === 'naoLidas') {
            this.notifications = this.notifications.filter((n) => n.id !== item.id);
          }
          if (this.modalActiveTab === 'naoLidas') {
            this.modalNotifications = this.modalNotifications.filter((n) => n.id !== item.id);
          }
          navigate();
        },
        error: () => navigate(),
      });
      return;
    }

    navigate();
  }

  notificationIcon(tipo: NotificacaoTipo): string {
    return {
      INFO: 'fas fa-info-circle',
      SUCESSO: 'fas fa-check-circle',
      ALERTA: 'fas fa-exclamation-triangle',
      ERRO: 'fas fa-times-circle',
    }[tipo];
  }

  formatNotificationDate(value: string): string {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getNotificationTitle(value: unknown): string {
    const parsed = this.stringifyNotificationValue(value);
    return parsed || 'Notificação';
  }

  getNotificationMessage(value: unknown): string {
    const parsed = this.stringifyNotificationValue(value);
    return parsed || 'Sem detalhes para esta notificação.';
  }

  private loadNotifications(reset: boolean): void {
    if (reset) {
      this.notificationsPage = 0;
      this.notificationsLastPage = false;
      this.notifications = [];
      this.notificationsError = null;
      this.notificationsLoading = true;
    } else {
      this.notificationsLoadingMore = true;
    }

    this.notificacaoApi
      .listar(this.activeTab === 'naoLidas', this.notificationsPage, this.notificationPageSize)
      .subscribe({
        next: (res) => {
          this.notifications = reset ? res.content : [...this.notifications, ...res.content];
          this.notificationsPage += 1;
          this.notificationsLastPage = res.last;
          this.notificationsLoading = false;
          this.notificationsLoadingMore = false;
        },
        error: () => {
          this.notificationsError = 'Não foi possível carregar notificações.';
          this.notificationsLoading = false;
          this.notificationsLoadingMore = false;
        },
      });
  }

  onModalListScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (this.modalNotificationsLoading || this.modalNotificationsLoadingMore || this.modalNotificationsLastPage) {
      return;
    }
    const threshold = 120;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      this.loadModalNotifications(false);
    }
  }

  private loadModalNotifications(reset: boolean): void {
    if (reset) {
      this.modalNotificationsPage = 0;
      this.modalNotificationsLastPage = false;
      this.modalNotifications = [];
      this.modalNotificationsError = null;
      this.modalNotificationsLoading = true;
    } else {
      this.modalNotificationsLoadingMore = true;
    }

    this.notificacaoApi
      .listar(this.modalActiveTab === 'naoLidas', this.modalNotificationsPage, this.notificationModalPageSize)
      .subscribe({
        next: (res) => {
          this.modalNotifications = reset ? res.content : [...this.modalNotifications, ...res.content];
          this.modalNotificationsPage += 1;
          this.modalNotificationsLastPage = res.last;
          this.modalNotificationsLoading = false;
          this.modalNotificationsLoadingMore = false;
        },
        error: () => {
          this.modalNotificationsError = 'Não foi possível carregar notificações.';
          this.modalNotificationsLoading = false;
          this.modalNotificationsLoadingMore = false;
        },
      });
  }

  private refreshUnreadCount(): void {
    this.notificacaoApi.totalNaoLidas().subscribe({
      next: (count) => {
        const parsed = this.parseUnreadCount(count);
        const previous = this.unreadSnapshot;
        this.unreadSnapshot = parsed;
        this.unreadCount = parsed;

        if (previous !== null && parsed > previous) {
          this.triggerIncomingNotificationCue();
          if (this.notificationsOpen) {
            this.loadNotifications(true);
          }
        }
      },
    });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.notificationsOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.notificationsModalOpen) {
      this.notificationsModalOpen = false;
      return;
    }
    this.notificationsOpen = false;
  }

  private pollNotifications(): void {
    this.refreshUnreadCount();
    if (this.notificationsOpen) {
      this.loadNotifications(true);
    }
    if (this.notificationsModalOpen) {
      this.loadModalNotifications(true);
    }
  }

  private navigateByReference(item: NotificacaoResponse): void {
    const refTipo = (item.referenciaTipo || '').toUpperCase();

    if (refTipo === 'CARGA' && item.referenciaCodigo) {
      this.router.navigate(['/dashboard/cargas', item.referenciaCodigo]);
      return;
    }

    if (refTipo === 'PARADA_CARGA') {
      this.router.navigate(['/dashboard/cargas'], {
        queryParams: {
          paradaId: item.referenciaId || undefined,
          codigo: item.referenciaCodigo || undefined,
        },
      });
      return;
    }

    if (refTipo === 'MANUTENCAO' && item.referenciaCodigo) {
      this.router.navigate(['/dashboard/manutencoes', item.referenciaCodigo]);
      return;
    }

    if (refTipo === 'ABASTECIMENTO') {
      this.router.navigate(['/dashboard/abastecimentos'], {
        queryParams: { codigo: item.referenciaCodigo || undefined },
      });
    }
  }

  // --- Formatadores ---
  private formatToday(): string {
    const now = new Date();
    const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayMonth = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
    return `Visão geral • ${weekday}, ${dayMonth}`;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
  }

  private formatMoney(value: number | null): string {
    const v = value ?? 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  private formatKg(value: number | null): string {
    return `${formatKgFromTon(value, 3)} kg`;
  }

  private formatStatus(status: string | null): string {
    if (!status) return 'N/A';
    // deixa mais “bonito” no badge
    return status.replaceAll('_', ' ');
  }

  private parseUnreadCount(value: unknown): number {
    if (typeof value === 'number') return Math.max(0, value);
    if (value && typeof value === 'object') {
      const candidate = (value as { total?: unknown; quantidade?: unknown }).total
        ?? (value as { total?: unknown; quantidade?: unknown }).quantidade;
      if (typeof candidate === 'number') return Math.max(0, candidate);
    }
    return 0;
  }

  private triggerIncomingNotificationCue(): void {
    this.hasIncomingNotification = true;
    if (this.cueTimeoutId !== null) {
      window.clearTimeout(this.cueTimeoutId);
    }
    this.cueTimeoutId = window.setTimeout(() => {
      this.hasIncomingNotification = false;
      this.cueTimeoutId = null;
    }, 3500);
  }

  private syncNotificationRead(id: string): void {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, lida: true, lidaEm: new Date().toISOString() } : n));
    this.modalNotifications = this.modalNotifications.map((n) => (n.id === id ? { ...n, lida: true, lidaEm: new Date().toISOString() } : n));
  }

  private stringifyNotificationValue(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (value == null) return '';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      const candidate = (value as { mensagem?: unknown; message?: unknown; descricao?: unknown }).mensagem
        ?? (value as { mensagem?: unknown; message?: unknown; descricao?: unknown }).message
        ?? (value as { mensagem?: unknown; message?: unknown; descricao?: unknown }).descricao;

      if (typeof candidate === 'string' || typeof candidate === 'number' || typeof candidate === 'boolean') {
        return String(candidate).trim();
      }
      try {
        return JSON.stringify(value);
      } catch {
        return '';
      }
    }
    return '';
  }
}
