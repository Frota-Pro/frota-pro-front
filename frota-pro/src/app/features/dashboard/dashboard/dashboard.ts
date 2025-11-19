import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard {
  isClosed = false;
  toggleSidebar() {
    this.isClosed = !this.isClosed;
  }
  statusFrota = {
    total: 25,
    emRota: 8,
    manutencao: 3,
  };
  notificacoes = [
    { tipo: 'alerta', mensagem: 'Caminhão ABC-1234 está há 5 dias sem movimentação.' },
    { tipo: 'risco', mensagem: 'Caminhão XYZ-8899 excedeu o limite de km diário.' },
    { tipo: 'aviso', mensagem: 'Caminhão FGH-5521 está há 12 dias na oficina.' },
  ];
}
