import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthUserService } from '../../../core/auth/auth-user.service';
import { AuthMeResponse } from '../../../core/auth/auth-user.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  user$!: Observable<AuthMeResponse | null>;

  open = {
    oficina: true,
    integracoes: false,
    administracao: false,
  };

  constructor(public authUser: AuthUserService) {
    this.user$ = this.authUser.user$;
  }

  toggle(key: keyof typeof this.open) {
    this.open[key] = !this.open[key];
  }

  logout() {
    console.log('logout');
    this.authUser.clear();
    // aqui você navega pro login se quiser
  }
}
