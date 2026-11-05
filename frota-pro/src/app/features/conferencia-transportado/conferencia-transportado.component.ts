import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { ConferenciaTransportadoApiService } from '../../core/api/conferencia-transportado-api.service';
import {
  ConferenciaCargaDiferenca,
  ConferenciaMovimento,
  ConferenciaNotaDetalhe,
  ConferenciaTransportadoResponse,
} from '../../core/api/conferencia-transportado-api.models';

const MOTIVOS: Record<string, string> = {
  CANCELADA: 'Nota cancelada',
  SEM_CARREGAMENTO: 'Sem carregamento (balcão, venda direta, retirada)',
  CARREGAMENTO_INEXISTENTE: 'Carregamento inexistente no WinThor',
  SEM_PEDIDO: 'Carregamento sem pedido',
  SEM_MDFE: 'Sem manifesto (MDF-e)',
  SEM_MOTORISTA_VEICULO: 'Sem motorista ou veículo',
  CAMINHAO_FORA_DA_FROTA: 'Caminhão do manifesto não é da frota (terceiro): não entra',
  MOVIDA_PARA_OUTRA_CARGA: 'Movida para outra carga',
  NOVA_NO_WINTHOR: 'Nota nova no WinThor',
  TRANSPORTADA: 'Transportada',
  NA_MESMA_CARGA: 'Ainda na mesma carga',
  FORA_DO_PERIODO_CONSULTADO: 'Fora do período consultado',
};

const CATEGORIAS: Record<string, string> = {
  CARGA_NAO_SINCRONIZADA: 'Ainda não chegou ao FrotaPRO',
  DATA_DIFERENTE_NO_FROTAPRO: 'Data diferente no FrotaPRO',
  DATA_DIFERENTE_NO_WINTHOR: 'Data diferente no WinThor',
  VALOR_DIFERENTE: 'Valor diferente',
  CARGA_SUMIDA_DO_WINTHOR: 'Sumiu do WinThor',
  CARGA_SEM_TRANSPORTE_HOJE: 'Sem transporte hoje',
  CARGA_DE_TERCEIRO: 'Caminhão de terceiro',
  CARGA_DESCARTADA_NO_SYNC: 'O sync descartou',
};

const ORIGENS: Record<string, string> = {
  REENTREGA: 'Reentrega',
  TRANSFERENCIA: 'Sobra de transferência',
  SEM_NOTA: 'Ficou sem nota',
  COMUM: 'Sem origem registrada',
};

@Component({
  selector: 'app-conferencia-transportado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conferencia-transportado.component.html',
  styleUrls: ['./conferencia-transportado.component.css'],
})
export class ConferenciaTransportadoComponent implements OnInit {
  mes = '';
  dados: ConferenciaTransportadoResponse | null = null;
  loading = false;
  erro: string | null = null;

  filtroCategoria = '';
  expandidas = new Set<number>();
  mostrarNotasFora = false;

  zerando = false;
  mensagemZerar: string | null = null;

  constructor(private api: ConferenciaTransportadoApiService) {}

  ngOnInit(): void {
    const hoje = new Date();
    // mês corrente como padrão; no começo do mês o gerente quase sempre quer conferir o mês que acabou
    const base = hoje.getDate() <= 5 ? new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1) : hoje;
    this.mes = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
    this.carregar(false);
  }

  carregar(atualizar: boolean): void {
    if (!/^\d{4}-\d{2}$/.test(this.mes)) {
      this.erro = 'Escolha o mês.';
      return;
    }
    this.loading = true;
    this.erro = null;
    this.expandidas.clear();
    this.api
      .buscar(this.mes, atualizar)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (d) => (this.dados = d),
        error: (err) => {
          this.dados = null;
          this.erro = extrairMensagemErro(err) || 'Não foi possível gerar a conferência.';
        },
      });
  }

  get categorias(): { codigo: string; rotulo: string; qtd: number }[] {
    const contagem = new Map<string, number>();
    (this.dados?.cargasComDiferenca ?? []).forEach((c) => contagem.set(c.categoria, (contagem.get(c.categoria) ?? 0) + 1));
    return Array.from(contagem.entries()).map(([codigo, qtd]) => ({ codigo, rotulo: this.categoria(codigo), qtd }));
  }

  get cargasFiltradas(): ConferenciaCargaDiferenca[] {
    const todas = this.dados?.cargasComDiferenca ?? [];
    return this.filtroCategoria ? todas.filter((c) => c.categoria === this.filtroCategoria) : todas;
  }

  origem(codigo: string): string {
    return ORIGENS[codigo] ?? codigo;
  }

  /** Cargas que ficaram sem nota e podem ser tiradas dos totais. */
  get zeraveis(): ConferenciaCargaDiferenca[] {
    return (this.dados?.cargasComDiferenca ?? []).filter((c) => c.podeSerZerada);
  }

  zerarTransferidas(): void {
    const n = this.zeraveis.length;
    if (!n || this.zerando) return;
    if (!window.confirm(`Tirar dos totais ${n} carga(s) que ficaram sem nota? O valor e o peso antigos ficam guardados na própria carga.`)) {
      return;
    }
    this.zerando = true;
    this.mensagemZerar = null;
    this.api
      .zerarTransferidas(this.mes)
      .pipe(finalize(() => (this.zerando = false)))
      .subscribe({
        next: (r) => {
          this.mensagemZerar = `${r.length} carga(s) tirada(s) dos totais.`;
          this.carregar(true);
        },
        error: (err) => (this.mensagemZerar = extrairMensagemErro(err) || 'Não foi possível tirar as cargas dos totais (só administrador).'),
      });
  }

  categoria(codigo: string): string {
    return CATEGORIAS[codigo] ?? codigo;
  }

  motivo(codigo: string): string {
    return MOTIVOS[codigo] ?? codigo;
  }

  /** Carga de origem → destino de cada transferência da nota, com dia e hora, para a coluna "Histórico". */
  historicoTexto(n: ConferenciaNotaDetalhe): string {
    return (n.historico ?? [])
      .map((h) => `${h.deCarga ?? '?'} → ${h.paraCarga ?? '?'}${h.quando ? ' em ' + this.dataHora(h.quando) : ''}`)
      .join(' · ');
  }

  dataHora(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const p = (v: number) => String(v).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  get movimentos(): ConferenciaMovimento[] {
    return this.dados?.movimentosEntreCargas ?? [];
  }

  alternar(numCar: number): void {
    if (this.expandidas.has(numCar)) this.expandidas.delete(numCar);
    else this.expandidas.add(numCar);
  }

  /** Planilha para abrir no Excel (separador ponto e vírgula, números no formato brasileiro). */
  exportarCsv(): void {
    if (!this.dados) return;
    const d = this.dados;
    const n = (v: number | null | undefined) => (v == null ? '' : v.toFixed(2).replace('.', ','));
    const linhas: string[][] = [
      [`Conferência do valor transportado - ${d.mes}`],
      [],
      ['Venda faturada (referência 111)', n(d.totais.vendaFaturada)],
      ['Transportado no WinThor', n(d.totais.transportadoWinThor)],
      ['Transportado no FrotaPRO', n(d.totais.transportadoFrotaPro)],
      ['Diferença', n(d.totais.diferenca)],
      [],
      ['PONTE 1: venda faturada até o transportado no WinThor'],
      ['Item', 'Quantidade', 'Valor', 'Explicação'],
      ...d.ponteVendaParaTransportado.map((l) => [l.titulo, String(l.quantidade), n(l.valor), l.explicacao]),
      [],
      ['PONTE 2: transportado no WinThor até o FrotaPRO'],
      ['Item', 'Quantidade', 'Valor', 'Explicação'],
      ...d.ponteWinThorParaFrotaPro.map((l) => [l.titulo, String(l.quantidade), n(l.valor), l.explicacao]),
      [],
      ['CARGAS COM DIFERENÇA'],
      ['Carga', 'Categoria', 'WinThor', 'FrotaPRO', 'Diferença', 'Explicação'],
      ...d.cargasComDiferenca.map((c) => [String(c.numCar), this.categoria(c.categoria), n(c.valorWinThor), n(c.valorFrotaPro), n(c.diferenca), c.explicacao]),
      [],
      ['CARGAS PEQUENAS (peso abaixo de ' + (d.limitePequenaKg ?? '') + ' kg)'],
      ['Carga', 'Origem', 'Peso kg', 'Valor', 'Motorista', 'Placa', 'Explicacao'],
      ...(d.cargasPequenas ?? []).map((c) => [String(c.numCar), this.origem(c.origem), n(c.pesoKg), n(c.valor), c.motorista ?? '', c.placa ?? '', c.explicacao]),
      [],
      ['LANCAMENTO MANUAL (motorista fora da frota)'],
      ['Carga', 'Motorista', 'Valor', 'Explicacao'],
      ...(d.lancamentoManual ?? []).map((l) => [String(l.numCar), l.codMotorista, n(l.valor), l.explicacao]),
      [],
      ['TRANSFERENCIAS ENTRE CARGAS (o valor sai da carga de origem e entra na de destino)'],
      ['Origem (diminui)', 'Destino (aumenta)', 'Motivo', 'Notas', 'Valor', 'Primeira', 'Ultima'],
      ...this.movimentos.map((m) => [
        String(m.deCarga ?? ''), String(m.paraCarga ?? ''), m.motivo ?? '', String(m.notas), n(m.valor),
        m.primeira ? this.dataHora(m.primeira) : '', m.ultima ? this.dataHora(m.ultima) : '',
      ]),
    ];
    const csv = linhas.map((l) => l.map((c) => `"${(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conferencia-transportado-${d.mes}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  imprimir(): void {
    window.print();
  }

  sinal(v: number): string {
    return v > 0 ? 'pos' : v < 0 ? 'neg' : '';
  }
}
