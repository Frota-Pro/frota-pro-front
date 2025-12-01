import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Categoria {
  id?: string;
  codigo: string;
  descricao: string;
  observacao?: string;
  ativo: boolean;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent {

  categorias: Categoria[] = [
    { codigo: 'TRK', descricao: 'Truck', observacao: 'Caminhão truck', ativo: true },
    { codigo: 'CAR', descricao: 'Carreta', observacao: '', ativo: true },
    { codigo: 'TB', descricao: 'Toco Baú', observacao: '', ativo: false },
  ];

  formVisivel = false;
  editando = false;
  editIndex: number | null = null;

  form: Categoria = this.criarFormVazio();

  criarFormVazio(): Categoria {
    return {
      codigo: '',
      descricao: '',
      observacao: '',
      ativo: true
    };
  }

  abrirFormulario() {
    this.form = this.criarFormVazio();
    this.formVisivel = true;
    this.editando = false;
    this.editIndex = null;
  }

  salvar() {
    if (!this.form.codigo.trim() || !this.form.descricao.trim()) return;

    if (this.editando && this.editIndex !== null) {
      this.categorias[this.editIndex] = { ...this.form };
    } else {
      this.categorias.push({ ...this.form });
    }

    this.cancelar();
  }

  editar(index: number) {
    this.form = { ...this.categorias[index] };
    this.formVisivel = true;
    this.editando = true;
    this.editIndex = index;
  }

  excluir(index: number) {
    this.categorias.splice(index, 1);
  }

  cancelar() {
    this.formVisivel = false;
    this.form = this.criarFormVazio();
    this.editando = false;
    this.editIndex = null;
  }
}
