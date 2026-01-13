import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';
import { ActionButtonComponent } from '../../../../shared/ui/action-button/action-button.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, StatCardComponent, ActionButtonComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css'],
})
export class DashboardHomeComponent {
  constructor(private router: Router) {}

  // --- Header ---
  readonly pageTitle = 'Dashboard';
  readonly pageSubtitle = this.formatToday();

  // --- KPI Cards (igual ao print) ---
  readonly kpis = [
    {
      title: 'Cargas Ativas',
      value: 1,
      helper: '+12% vs. mês anterior',
      icon: 'fas fa-cube',
      variant: 'primary' as const,
    },
    {
      title: 'Finalizadas Hoje',
      value: 0,
      helper: '',
      icon: 'fas fa-check',
      variant: 'success' as const,
    },
    {
      title: 'Litros (30d)',
      value: '350,5L',
      helper: '',
      icon: 'fas fa-gas-pump',
      variant: 'warning' as const,
    },
    {
      title: 'Metas Ativas',
      value: 1,
      helper: '',
      icon: 'fas fa-bullseye',
      variant: 'info' as const,
    },
    {
      title: 'OS Abertas',
      value: 0,
      helper: '',
      icon: 'fas fa-wrench',
      variant: 'neutral' as const,
    },
  ];

  // --- Cargas recentes ---
  readonly cargasRecentes = [
    {
      numero: 'CARGA-001',
      origem: 'N/A',
      destino: 'N/A',
      valor: 'R$ 15.000,00',
      peso: '8.500 kg',
      status: 'EM ANDAMENTO',
    },
  ];

  // --- Ações rápidas (ajuste as rotas se necessário) ---
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

  private formatToday(): string {
    // "Visão geral • terça-feira, 13 de janeiro"
    const now = new Date();
    const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayMonth = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
    return `Visão geral • ${weekday}, ${dayMonth}`;
  }
}
