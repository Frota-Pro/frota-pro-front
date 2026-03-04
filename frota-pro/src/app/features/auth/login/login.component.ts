import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = false;

  login = '';
  senha = '';
  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  loginSubmit() {
    const l = (this.login ?? '').trim();
    const s = (this.senha ?? '').trim();

    if (!l || !s) {
      this.toast.warn('Informe usuário e senha.');
      return;
    }

    this.loading = true;

    this.auth.login({ login: l, senha: s } as any).subscribe({
      next: () => {
        this.toast.success('Login realizado com sucesso!');
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 429) {
          this.toast.error('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.');
          this.loading = false;
          return;
        }

        if (error.status === 401) {
          this.toast.error('Credenciais inválidas. Verifique usuário e senha.');
          this.loading = false;
          return;
        }

        this.toast.error('Não foi possível realizar login. Tente novamente.');
        this.loading = false;
      }
    });
  }
}
