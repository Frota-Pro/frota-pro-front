import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private router: Router) {}

  login() {
    if (this.email === 'igor' && this.password === '123456') {
      this.router.navigate(['/dashboard/dashboard-home']);
    } else {
      alert('Usuário ou senha inválidos!');
    }
  }
}
