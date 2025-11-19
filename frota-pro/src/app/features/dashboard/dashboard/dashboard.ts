import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {
  isClosed = false;
  toggleSidebar() {
    this.isClosed = !this.isClosed;
  }
  statusFrota = {
  total: 25,
  emRota: 8,
  manutencao: 3
};
}
