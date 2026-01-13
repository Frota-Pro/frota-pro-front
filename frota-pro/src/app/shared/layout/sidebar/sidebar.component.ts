import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type RoleLabel = 'OPERADOR_LOGISTICA' | string;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  // Se você já tem AuthService/UserStore, substitua esses mocks depois
  userName = 'Arthenyo';
  userRole: RoleLabel = 'OPERADOR_LOGISTICA';

  // Estados dos grupos colapsáveis
  open = {
    oficina: true,
    integracoes: false,
    administracao: false,
  };

  toggle(key: keyof typeof this.open) {
    this.open[key] = !this.open[key];
  }

  logout() {
    // Troque por sua lógica real
    console.log('logout');
  }
}
