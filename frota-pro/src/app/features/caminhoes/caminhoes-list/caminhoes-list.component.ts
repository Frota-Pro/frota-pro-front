import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type StatusCaminhao = 'ATIVO' | 'INATIVO';

interface CaminhaoVM {
  id: string;          // Código interno (ex: CAM001)
  placa: string;
  modelo: string;
  categoria: string;
  status: StatusCaminhao;
}

@Component({
  selector: 'app-caminhoes-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './caminhoes-list.component.html',
  styleUrls: ['./caminhoes-list.component.css'],
})
export class CaminhoesListComponent {
  search = '';
  statusFilter: 'Todos' | StatusCaminhao = 'Todos';

  // Mock inicial (depois liga na API)
  caminhoes: CaminhaoVM[] = [
    { placa: 'ABC-1234', modelo: 'Volvo FH 540', categoria: 'Carreta', id: 'CAM001', status: 'ATIVO' },
    { placa: 'DEF-5678', modelo: 'Scania R450', categoria: 'Truck', id: 'CAM002', status: 'ATIVO' },
    { placa: 'GHI-9012', modelo: 'Mercedes Actros', categoria: 'Carreta', id: 'CAM003', status: 'ATIVO' },
  ];

  get filtered(): CaminhaoVM[] {
    const q = this.search.trim().toLowerCase();

    return this.caminhoes.filter(c => {
      const matchText =
        !q ||
        c.placa.toLowerCase().includes(q) ||
        c.modelo.toLowerCase().includes(q) ||
        c.categoria.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);

      const matchStatus =
        this.statusFilter === 'Todos' ? true : c.status === this.statusFilter;

      return matchText && matchStatus;
    });
  }

  // Ações (depois você liga em modal/rota)
  novoCaminhao() {
    console.log('Novo Caminhão');
  }

  ver(c: CaminhaoVM) {
    console.log('Ver', c);
  }

  editar(c: CaminhaoVM) {
    console.log('Editar', c);
  }

  excluir(c: CaminhaoVM) {
    console.log('Excluir', c);
  }
}
