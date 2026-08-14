import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { UsuarioApiService } from '../../../core/api/usuario-api.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-trocar-senha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trocar-senha.component.html',
  styleUrl: './trocar-senha.component.css'
})
export class TrocarSenhaComponent {

  private auth = inject(AuthService);
  private usuarioApi = inject(UsuarioApiService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = false;
  showPassword = false;

  senhaAtual = '';
  novaSenha = '';
  confirmarNovaSenha = '';

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  salvar() {
    const atual = (this.senhaAtual ?? '').trim();
    const nova = (this.novaSenha ?? '').trim();
    const confirmar = (this.confirmarNovaSenha ?? '').trim();

    if (!atual || !nova || !confirmar) {
      this.toast.warn('Preencha todos os campos.');
      return;
    }

    if (nova.length < 6) {
      this.toast.warn('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (nova !== confirmar) {
      this.toast.warn('A confirmação não confere com a nova senha.');
      return;
    }

    if (nova === 'padrao123') {
      this.toast.warn('Escolha uma senha diferente da senha padrão.');
      return;
    }

    this.loading = true;

    this.usuarioApi.atualizarMinhaSenha({ senhaAtual: atual, novaSenha: nova }).subscribe({
      next: () => {
        // Renova o token pra já refletir que a senha não é mais temporária,
        // sem precisar deslogar o usuário.
        this.auth.refreshSession().subscribe({
          next: () => {
            this.toast.success('Senha alterada com sucesso!');
            this.loading = false;
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.loading = false;
            this.toast.success('Senha alterada com sucesso! Faça login novamente.');
            this.auth.forceLogout();
            this.router.navigate(['/login']);
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        if (error.status === 401) {
          this.toast.error('Senha atual inválida.');
          return;
        }
        if (error.status === 400) {
          this.toast.error('Escolha uma senha diferente da senha padrão.');
          return;
        }
        this.toast.error('Não foi possível trocar a senha. Tente novamente.');
      }
    });
  }

  sair() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
