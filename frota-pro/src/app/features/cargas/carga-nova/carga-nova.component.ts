import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../../core/utils/api-error.util';
import { CargaApiService } from '../../../core/api/carga-api.service';
import { CargaRequest } from '../../../core/api/carga-api.models';
import { CaminhaoApiService } from '../../../core/api/caminhao-api.service';
import { CaminhaoResponse } from '../../../core/api/caminhao-api.models';
import { MotoristaApiService } from '../../../core/api/motorista-api.service';
import { MotoristaResponse } from '../../../core/api/motorista-api.models';
import { RotaApiService } from '../../../core/api/rota-api.service';
import { RotaResponse } from '../../../core/api/rota-api.models';

type ToastType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-carga-nova',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './carga-nova.component.html',
  styleUrls: ['./carga-nova.component.css'],
})
export class CargaNovaComponent implements OnInit {
  saving = false;
  toast: { type: ToastType; text: string } | null = null;

  form: CargaRequest = {
    dtSaida: '',
    dtPrevista: '',
    dtChegada: null,
    kmInicial: null,
    kmFinal: null,
    codigoMotorista: '',
    codigoCaminhao: '',
    codigoRota: '',
  };

  // Combos (carregados uma vez, filtro é local — mesma técnica já usada em Relatórios)
  caminhoes: CaminhaoResponse[] = [];
  motoristas: MotoristaResponse[] = [];
  rotas: RotaResponse[] = [];

  // Textos exibidos nos campos de autocomplete (podem não bater com o código já selecionado)
  buscaCaminhao = '';
  buscaMotorista = '';

  showSugCaminhao = false;
  showSugMotorista = false;
  private blurTimer: any = null;

  constructor(
    private api: CargaApiService,
    private caminhaoApi: CaminhaoApiService,
    private motoristaApi: MotoristaApiService,
    private rotaApi: RotaApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.caminhaoApi.listar({ page: 0, size: 300, sort: 'codigo,asc' }).subscribe({
      next: (res) => (this.caminhoes = res.content || []),
      error: () => (this.caminhoes = []),
    });
    this.motoristaApi.listar({ page: 0, size: 300, sort: 'codigo,asc' }).subscribe({
      next: (res) => (this.motoristas = res.content || []),
      error: () => (this.motoristas = []),
    });
    this.rotaApi.listar({ page: 0, size: 200, sort: 'codigo,asc' }).subscribe({
      next: (res) => (this.rotas = res.content || []),
      error: () => (this.rotas = []),
    });
  }

  // ===== Autocomplete Caminhão =====
  get sugestoesCaminhao(): CaminhaoResponse[] {
    const q = this.buscaCaminhao.trim().toLowerCase();
    if (!q) return [];
    return this.caminhoes
      .filter((c) => {
        const hay = [c.codigo, c.codigoExterno, c.placa, c.descricao, c.marca, c.modelo]
          .map((x) => String(x || '').toLowerCase())
          .join(' | ');
        return hay.includes(q);
      })
      .slice(0, 8);
  }

  onFocusCaminhao(): void {
    this.closeSugestoes();
    this.showSugCaminhao = true;
  }

  onInputCaminhao(): void {
    this.form.codigoCaminhao = '';
    this.showSugCaminhao = this.buscaCaminhao.trim().length > 0;
  }

  selecionarCaminhao(c: CaminhaoResponse): void {
    this.form.codigoCaminhao = c.codigo;
    this.buscaCaminhao = `${c.codigo} — ${c.placa}`;
    this.closeSugestoes();
  }

  // ===== Autocomplete Motorista =====
  get sugestoesMotorista(): MotoristaResponse[] {
    const q = this.buscaMotorista.trim().toLowerCase();
    if (!q) return [];
    return this.motoristas
      .filter((m) => {
        const hay = [m.codigo, m.codigoExterno, m.nome, m.cnh]
          .map((x) => String(x || '').toLowerCase())
          .join(' | ');
        return hay.includes(q);
      })
      .slice(0, 8);
  }

  onFocusMotorista(): void {
    this.closeSugestoes();
    this.showSugMotorista = true;
  }

  onInputMotorista(): void {
    this.form.codigoMotorista = '';
    this.showSugMotorista = this.buscaMotorista.trim().length > 0;
  }

  selecionarMotorista(m: MotoristaResponse): void {
    this.form.codigoMotorista = m.codigo;
    this.buscaMotorista = `${m.codigo} — ${m.nome}`;
    this.closeSugestoes();
  }

  onBlurSugestao(): void {
    if (this.blurTimer) clearTimeout(this.blurTimer);
    this.blurTimer = setTimeout(() => this.closeSugestoes(), 140);
  }

  private closeSugestoes(): void {
    this.showSugCaminhao = false;
    this.showSugMotorista = false;
  }

  // ===== Salvar =====
  formValido(): boolean {
    return !!(
      this.form.dtSaida &&
      this.form.dtPrevista &&
      this.form.codigoMotorista &&
      this.form.codigoCaminhao &&
      this.form.codigoRota
    );
  }

  salvar(): void {
    if (!this.formValido()) {
      this.toast = { type: 'error', text: 'Preencha data de saída, data prevista, motorista, caminhão e rota.' };
      return;
    }

    this.saving = true;
    this.toast = null;

    this.api
      .criar(this.form)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (carga) => {
          this.router.navigate(['/dashboard/cargas', carga.numeroCarga]);
        },
        error: (err) => {
          this.toast = { type: 'error', text: extrairMensagemErro(err, 'Não foi possível cadastrar a carga.') };
        },
      });
  }

  cancelar(): void {
    this.router.navigate(['/dashboard/cargas']);
  }
}
