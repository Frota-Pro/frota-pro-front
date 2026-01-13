import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type StatusMotorista = 'ATIVO' | 'INATIVO';

interface MotoristaVM {
  id: string;
  nome: string;
  cpf: string;
  cnh: string;
  categoriaCnh: string;
  telefone: string;
  status: StatusMotorista;
}

@Component({
  selector: 'app-motoristas-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './motoristas-list.component.html',
  styleUrls: ['./motoristas-list.component.css'],
})
export class MotoristasListComponent {
  search = '';
  statusFilter: 'Todos' | StatusMotorista = 'Todos';

  // Mock inicial (depois você liga na API)
  motoristas: MotoristaVM[] = [
    {
      id: 'MOT001',
      nome: 'João Silva',
      cpf: '123.456.789-00',
      cnh: '01234567890',
      categoriaCnh: 'E',
      telefone: '(88) 99999-9999',
      status: 'ATIVO',
    },
    {
      id: 'MOT002',
      nome: 'Maria Souza',
      cpf: '987.654.321-00',
      cnh: '09876543210',
      categoriaCnh: 'D',
      telefone: '(88) 98888-8888',
      status: 'ATIVO',
    },
    {
      id: 'MOT003',
      nome: 'Carlos Lima',
      cpf: '111.222.333-44',
      cnh: '11223344556',
      categoriaCnh: 'E',
      telefone: '(88) 97777-7777',
      status: 'INATIVO',
    },
  ];

  get filtered(): MotoristaVM[] {
    const q = this.search.trim().toLowerCase();

    return this.motoristas.filter(m => {
      const matchText =
        !q ||
        m.nome.toLowerCase().includes(q) ||
        m.cpf.toLowerCase().includes(q) ||
        m.cnh.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q);

      const matchStatus =
        this.statusFilter === 'Todos' ? true : m.status === this.statusFilter;

      return matchText && matchStatus;
    });
  }

  // Ações (depois você liga nos modais/rotas)
  novoMotorista() {
    console.log('Novo Motorista');
  }

  ver(m: MotoristaVM) {
    console.log('Ver', m);
  }

  editar(m: MotoristaVM) {
    console.log('Editar', m);
  }

  excluir(m: MotoristaVM) {
    console.log('Excluir', m);
  }
}
