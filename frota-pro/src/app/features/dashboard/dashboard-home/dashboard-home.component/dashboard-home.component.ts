import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';
import { ActionButtonComponent } from '../../../../shared/ui/action-button/action-button.component';

import { DashboardApiService } from '../../../../core/api/dashboard-api.service';
import { DashboardResumoResponse } from '../../../../core/api/dashboard-api.models';
import {Observable} from 'rxjs';
import {AuthMeResponse} from '../../../../core/auth/auth-user.model';
import {AuthUserService} from '../../../../core/auth/auth-user.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, StatCardComponent, ActionButtonComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css'],
})
export class DashboardHomeComponent implements OnInit {
  constructor(private router: Router, private dashboardApi: DashboardApiService, public authUser: AuthUserService) {
    this.user$ = this.authUser.user$;
  }

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
    const v = value ?? 0;
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(v)} kg`;
  }

  private formatStatus(status: string | null): string {
    if (!status) return 'N/A';
    // deixa mais “bonito” no badge
    return status.replaceAll('_', ' ');
  }
}
