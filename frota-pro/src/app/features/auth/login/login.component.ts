import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  login = '';
  senha = '';
  loading = false;

  constructor(private router: Router, private auth: AuthService) {}

  loginSubmit() {
    this.loading = true;

    this.auth.login({ login: this.login, senha: this.senha }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard/dashboard-home']);
      },
      error: (err) => {
        this.loading = false;
        alert(err?.error?.message ?? 'Usuário ou senha inválidos!');
      },
    });
  }
}
