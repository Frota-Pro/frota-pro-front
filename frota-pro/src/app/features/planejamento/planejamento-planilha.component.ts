import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { AuthUserService } from '../../core/auth/auth-user.service';
import { PlanejamentoApiService } from '../../core/api/planejamento-api.service';
import { MotoristaApiService } from '../../core/api/motorista-api.service';
import { CaminhaoApiService } from '../../core/api/caminhao-api.service';
import { AjudanteApiService } from '../../core/api/ajudante-api.service';
import { PlanejamentoBox, PlanejamentoConflito, PlanejamentoPlanilha, PlanejamentoRota } from '../../core/api/planejamento-api.models';
import { ConfirmacaoComponent, PedidoDeConfirmacao } from '../../shared/ui/confirmacao/confirmacao.component';
import { AutocompleteComponent } from './autocomplete.component';
import { OpcaoAuto } from './autocomplete.utils';
import {
  CorDaRota,
  DIAS_SAIDA,
  FILTROS_VAZIOS,
  Filtros,
  LinhaPlanilha,
  Selo,
  TOTAIS_ZERADOS,
  TURNOS_SAIDA,
  Totais,
  corDaRota,
  ehClienteVemBuscar,
  filtrar,
  filtrosAtivos,
  formatarData,
  formatarMoeda,
  formatarToneladas,
  linhasDaPlanilha,
  montarHtmlImpressao,
  montarMensagem,
  opcoesDestino,
  opcoesWinThor,
  partesWinThor,
  podeEditarPlanejamento,
  rotaPlanejada,
  rotasJuntas,
  rotuloTurno,
  selosDoCarregamento,
  totaisDe,
} from './planejamento.utils';

interface Mensagem {
  tipo: 'success' | 'error';
  texto: string;
}

/** Uma inconsistência para mostrar no alto da planilha (a mesma pessoa/caminhão em várias rotas, uma vez só). */
export interface Inconsistencia {
  chave: string;
  tipo: PlanejamentoConflito['tipo'];
  nome: string;
  rotas: number[];
  mesmoHorario: boolean;
  texto: string;
}

const ROTULO_TIPO: Record<PlanejamentoConflito['tipo'], string> = { MOTORISTA: 'O motorista', AJUDANTE: 'O ajudante', CAMINHAO: 'O caminhão' };

/**
 * Junta os avisos de cada rota em uma lista só, sem repetir: "o ajudante João está nas rotas 10 e 11" aparece uma
 * vez (e não uma por rota).
 */
export function agruparInconsistencias(rotas: PlanejamentoRota[]): Inconsistencia[] {
  const grupos = new Map<string, Inconsistencia>();
  for (const r of rotas) {
    for (const c of r.conflitos ?? []) {
      const chave = c.tipo + ':' + c.codigo;
      const grupo = grupos.get(chave) ?? { chave, tipo: c.tipo, nome: c.nome, rotas: [], mesmoHorario: true, texto: '' };
      for (const n of [r.numeroPrincipal, ...c.rotas]) if (!grupo.rotas.includes(n)) grupo.rotas.push(n);
      grupo.mesmoHorario = grupo.mesmoHorario && c.mesmoHorario;
      grupos.set(chave, grupo);
    }
  }
  return [...grupos.values()].map((g) => {
    g.rotas.sort((a, b) => a - b);
    const quais = g.rotas.length === 2 ? g.rotas.join(' e ') : g.rotas.join(', ');
    g.texto =
      `${ROTULO_TIPO[g.tipo]} ${g.nome} está nas rotas ${quais}` +
      (g.mesmoHorario ? ', no mesmo dia e turno.' : '. Se saem em horários diferentes, escolha o dia e o turno de cada uma.');
    return g;
  });
}

/**
 * A planilha do dia: UMA LINHA POR ROTA, como no papel. Cada carga do WinThor já nasce numa linha; o que se
 * preenche (complementos, motorista, ajudantes, caminhão, box, dia e turno de saída) é tudo na própria linha.
 */
@Component({
  selector: 'app-planejamento-planilha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AutocompleteComponent, ConfirmacaoComponent],
  templateUrl: './planejamento-planilha.component.html',
  styleUrls: ['./planejamento.component.css'],
})
export class PlanejamentoPlanilhaComponent implements OnInit {
  planilha: PlanejamentoPlanilha | null = null;
  loading = false;
  trabalhando = false;
  errorMsg: string | null = null;
  mensagem: Mensagem | null = null;

  // o que dá para escolher nos campos de busca
  motoristas: OpcaoAuto[] = [];
  caminhoes: OpcaoAuto[] = [];
  ajudantes: OpcaoAuto[] = [];

  filtros: Filtros = { ...FILTROS_VAZIOS };
  /** Rotas marcadas (pelo número do principal): para tirar, juntar ou entrar na mensagem do grupo. */
  selecionadas = new Set<number>();

  // Tudo abaixo é recalculado em recalcular(): a tela só lê.
  linhas: LinhaPlanilha[] = [];
  filtradas: LinhaPlanilha[] = [];
  rotasVisiveis: PlanejamentoRota[] = [];
  /** O que está repetido entre rotas que podem sair na mesma hora (mostrado no alto da planilha). */
  inconsistencias: Inconsistencia[] = [];
  /** A linha para onde a pessoa acabou de ser levada (pisca um instante). */
  destacada: number | null = null;
  /** As rotas que têm complementos: viram os atalhos coloridos do filtro. */
  juntas: PlanejamentoRota[] = [];
  destinosDoFiltro: { chave: string; rotulo: string; qtd: number }[] = [];
  winthorDoFiltro: { chave: string; rotulo: string; qtd: number }[] = [];
  totaisFiltro: Totais = TOTAIS_ZERADOS;
  totaisSelecao: Totais = TOTAIS_ZERADOS;
  temFaturadaNaSelecao = false;
  /** Para cada rota: as cargas que ainda dá para encaixar nela como complemento (sem a própria rota). */
  private complementosPossiveis = new Map<number, OpcaoAuto[]>();
  /** Para cada rota: os ajudantes que ainda não estão nela. */
  private ajudantesLivres = new Map<number, OpcaoAuto[]>();
  /** Motoristas e caminhões de cada linha, com a dica "já na rota X" de quem está em outra. */
  private motoristasPorRota = new Map<number, OpcaoAuto[]>();
  private caminhoesPorRota = new Map<number, OpcaoAuto[]>();

  /** A janela de confirmação aberta (tirar, fechar...); vazia quando não há pergunta na tela. */
  confirmacao: PedidoDeConfirmacao | null = null;

  // mensagem para o grupo
  mensagemAberta = false;
  mensagemTexto = '';
  copiado = false;

  readonly dias = DIAS_SAIDA;
  readonly turnos = TURNOS_SAIDA;
  readonly formatarData = formatarData;
  readonly formatarToneladas = formatarToneladas;
  readonly formatarMoeda = formatarMoeda;
  readonly ehClienteVemBuscar = ehClienteVemBuscar;
  readonly partesWinThor = partesWinThor;

  private id = '';

  constructor(
    private route: ActivatedRoute,
    private api: PlanejamentoApiService,
    private authUser: AuthUserService,
    private motoristaApi: MotoristaApiService,
    private caminhaoApi: CaminhaoApiService,
    private ajudanteApi: AjudanteApiService,
  ) {}

  get podeEditar(): boolean {
    return podeEditarPlanejamento(this.authUser.snapshot?.authorities);
  }

  /** Só dá para mexer com a planilha aberta e com o perfil certo. */
  get editavel(): boolean {
    return this.podeEditar && this.planilha?.status === 'ABERTA';
  }

  get filtrando(): boolean {
    return filtrosAtivos(this.filtros);
  }

  get todasMarcadas(): boolean {
    return this.rotasVisiveis.length > 0 && this.rotasVisiveis.every((r) => this.selecionadas.has(r.numeroPrincipal));
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.carregar();
    // As listas (motorista, caminhão, ajudante) carregam sempre: ao recarregar a página o perfil ainda não chegou, e
    // esperar por ele deixava os campos de busca vazios.
    this.carregarOpcoes();
  }

  carregar(): void {
    this.loading = true;
    this.errorMsg = null;
    this.api
      .obter(this.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (p) => this.receber(p),
        error: (err) => (this.errorMsg = extrairMensagemErro(err, 'Não foi possível abrir a planilha.')),
      });
  }

  private carregarOpcoes(): void {
    this.motoristaApi.listar({ ativo: true, size: 500, sort: 'nome,asc' }).subscribe({
      next: (r) => {
        this.motoristas = (r.content ?? []).map((m) => ({ codigo: m.codigo, rotulo: m.nome, detalhe: m.codigo }));
        this.recalcularOpcoes();
      },
      error: () => (this.motoristas = []),
    });
    this.caminhaoApi.listar({ ativo: true, size: 500, sort: 'placa,asc' }).subscribe({
      next: (r) => {
        this.caminhoes = (r.content ?? []).map((c) => ({ codigo: c.codigo, rotulo: c.placa, detalhe: c.descricao }));
        this.recalcularOpcoes();
      },
      error: () => (this.caminhoes = []),
    });
    this.ajudanteApi.listar({ size: 500, sort: 'nome,asc' }).subscribe({
      next: (r) => {
        this.ajudantes = (r.content ?? []).map((a) => ({ codigo: a.codigo, rotulo: a.nome }));
        this.recalcularOpcoes();
      },
      error: () => (this.ajudantes = []),
    });
  }

  // ---- estado derivado -----------------------------------------------------------------------------------

  /** Troca a planilha pela versão nova e recalcula o que a tela mostra. */
  private receber(p: PlanejamentoPlanilha): void {
    this.planilha = p;
    this.linhas = linhasDaPlanilha(p);
    const existentes = new Set(p.rotas.map((r) => r.numeroPrincipal));
    this.selecionadas = new Set([...this.selecionadas].filter((n) => existentes.has(n)));
    this.destinosDoFiltro = opcoesDestino(this.linhas);
    this.winthorDoFiltro = opcoesWinThor(this.linhas);
    // Se o destino/combinação filtrado deixou de existir, o filtro não pode ficar preso nele.
    if (this.filtros.destino && !this.destinosDoFiltro.some((d) => d.chave === this.filtros.destino)) this.filtros.destino = '';
    if (this.filtros.winthor && !this.winthorDoFiltro.some((w) => w.chave === this.filtros.winthor)) this.filtros.winthor = '';
    this.recalcular();
  }

  recalcular(): void {
    const rotas = this.planilha?.rotas ?? [];
    this.juntas = rotasJuntas(this.planilha);
    this.inconsistencias = agruparInconsistencias(rotas);
    // Se a rota filtrada deixou de ter complementos (ou saiu da planilha), o filtro não pode ficar preso nela.
    if (this.filtros.rota !== null && !this.juntas.some((r) => r.numeroPrincipal === this.filtros.rota)) this.filtros.rota = null;
    this.filtradas = filtrar(this.linhas, this.filtros);
    const visiveis = new Set(this.filtradas.map((l) => l.rota.numeroPrincipal));
    this.rotasVisiveis = rotas.filter((r) => visiveis.has(r.numeroPrincipal));

    this.totaisFiltro = totaisDe(this.filtradas);
    const marcadas = rotas.filter((r) => this.selecionadas.has(r.numeroPrincipal));
    this.totaisSelecao = totaisDe(marcadas.flatMap((r) => r.carregamentos.map((carregamento) => ({ carregamento, rota: r }))));
    this.temFaturadaNaSelecao = marcadas.some((r) => this.rotaTravada(r));
    this.recalcularOpcoes();
  }

  /** As listas dos campos de busca de cada linha (guardadas prontas: a tela não pode criar lista nova a cada leitura). */
  private recalcularOpcoes(): void {
    const rotas = this.planilha?.rotas ?? [];
    // Complemento só pode ser uma carga que está sozinha, sem nada preenchido e ainda não faturada.
    const livres: OpcaoAuto[] = rotas
      .filter((r) => r.carregamentos.length === 1 && !rotaPlanejada(r) && !this.rotaTravada(r))
      .map((r) => ({
        codigo: String(r.numeroPrincipal),
        rotulo: `${r.numeroPrincipal} · ${r.carregamentos[0]?.destino ?? ''}`,
        detalhe: `${formatarToneladas(r.pesoToneladas)} t`,
      }));
    this.complementosPossiveis = new Map(rotas.map((r) => [r.numeroPrincipal, livres.filter((o) => o.codigo !== String(r.numeroPrincipal))]));
    // Quem já está em outra rota que ainda não saiu: aparece com a dica "já na rota X" nas listas de escolha.
    const usoMotorista = new Map<string, number[]>();
    const usoCaminhao = new Map<string, number[]>();
    const usoAjudante = new Map<string, number[]>();
    const anotar = (mapa: Map<string, number[]>, codigo: string, rota: number) => mapa.set(codigo, [...(mapa.get(codigo) ?? []), rota]);
    for (const r of rotas.filter((x) => !this.rotaTravada(x))) {
      if (r.motorista) anotar(usoMotorista, r.motorista.codigo, r.numeroPrincipal);
      if (r.caminhao) anotar(usoCaminhao, r.caminhao.codigo, r.numeroPrincipal);
      (r.ajudantes ?? []).forEach((a) => anotar(usoAjudante, a.codigo, r.numeroPrincipal));
    }
    this.motoristasPorRota = new Map(rotas.map((r) => [r.numeroPrincipal, this.comUso(this.motoristas, usoMotorista, r.numeroPrincipal)]));
    this.caminhoesPorRota = new Map(rotas.map((r) => [r.numeroPrincipal, this.comUso(this.caminhoes, usoCaminhao, r.numeroPrincipal)]));
    this.ajudantesLivres = new Map(
      rotas.map((r) => {
        const jaTem = new Set((r.ajudantes ?? []).map((a) => a.codigo));
        return [r.numeroPrincipal, this.comUso(this.ajudantes.filter((a) => !jaTem.has(a.codigo)), usoAjudante, r.numeroPrincipal)];
      }),
    );
  }

  /** Acrescenta "já na rota X" a quem está em outra rota (as demais opções ficam como estão). */
  private comUso(lista: OpcaoAuto[], uso: Map<string, number[]>, propria: number): OpcaoAuto[] {
    return lista.map((o) => {
      const outras = (uso.get(o.codigo) ?? []).filter((n) => n !== propria);
      return outras.length === 0 ? o : { ...o, detalhe: [o.detalhe, `já na rota ${outras.join(', ')}`].filter(Boolean).join(' · ') };
    });
  }

  opcoesMotorista(r: PlanejamentoRota): OpcaoAuto[] {
    return this.motoristasPorRota.get(r.numeroPrincipal) ?? this.motoristas;
  }

  opcoesCaminhao(r: PlanejamentoRota): OpcaoAuto[] {
    return this.caminhoesPorRota.get(r.numeroPrincipal) ?? this.caminhoes;
  }

  /** O item da linha (motorista, caminhão ou um ajudante) está repetido em outra rota? */
  temConflito(r: PlanejamentoRota, tipo: PlanejamentoConflito['tipo'], codigo?: string): boolean {
    return (r.conflitos ?? []).some((c) => c.tipo === tipo && (codigo === undefined || c.codigo === codigo));
  }

  /** Leva a pessoa até a linha (tirando o filtro que a esconde) e a faz piscar um instante. */
  irParaLinha(numero: number): void {
    if (!this.rotasVisiveis.some((r) => r.numeroPrincipal === numero)) this.limparFiltros();
    setTimeout(() => {
      document.getElementById('linha-' + numero)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.destacada = numero;
      setTimeout(() => (this.destacada = null), 2500);
    }, 50);
  }

  opcoesComplemento(r: PlanejamentoRota): OpcaoAuto[] {
    return this.complementosPossiveis.get(r.numeroPrincipal) ?? [];
  }

  opcoesAjudante(r: PlanejamentoRota): OpcaoAuto[] {
    return this.ajudantesLivres.get(r.numeroPrincipal) ?? [];
  }

  /** Atalho colorido: mostra só aquela rota (clicar de novo solta o filtro). */
  filtrarRota(r: PlanejamentoRota): void {
    this.filtros.rota = this.filtros.rota === r.numeroPrincipal ? null : r.numeroPrincipal;
    this.recalcular();
  }

  limparFiltros(): void {
    this.filtros = { ...FILTROS_VAZIOS };
    this.recalcular();
  }

  // ---- marcar linhas: tirar, juntar, mensagem ------------------------------------------------------------

  estaMarcada(r: PlanejamentoRota): boolean {
    return this.selecionadas.has(r.numeroPrincipal);
  }

  alternar(r: PlanejamentoRota): void {
    if (this.selecionadas.has(r.numeroPrincipal)) this.selecionadas.delete(r.numeroPrincipal);
    else this.selecionadas.add(r.numeroPrincipal);
    this.recalcular();
  }

  /** Marca (ou desmarca) todas as linhas que o filtro está mostrando. */
  alternarTodas(): void {
    if (this.todasMarcadas) this.rotasVisiveis.forEach((r) => this.selecionadas.delete(r.numeroPrincipal));
    else this.rotasVisiveis.forEach((r) => this.selecionadas.add(r.numeroPrincipal));
    this.recalcular();
  }

  limparSelecao(): void {
    this.selecionadas.clear();
    this.recalcular();
  }

  private rotasMarcadas(): PlanejamentoRota[] {
    return (this.planilha?.rotas ?? []).filter((r) => this.selecionadas.has(r.numeroPrincipal));
  }

  /** Tira as linhas marcadas (com os complementos delas): somem e não voltam em nenhuma planilha. */
  tirarSelecionadas(): void {
    const marcadas = this.rotasMarcadas();
    const cargas = marcadas.flatMap((r) => r.carregamentos);
    const numeros = cargas.map((c) => c.numero);
    if (numeros.length === 0) return;

    const maximo = 8;
    const itens = cargas.slice(0, maximo).map((c) => `${c.numero} · ${c.destino ?? ''}${c.principal ? '' : ' (complemento)'}`);
    if (cargas.length > maximo) itens.push(`… e mais ${cargas.length - maximo}`);

    this.perguntar({
      tipo: 'perigo',
      titulo: numeros.length === 1 ? 'Tirar este carregamento da planilha?' : `Tirar ${numeros.length} carregamentos da planilha?`,
      mensagem: numeros.length === 1 ? 'Ele sai desta planilha:' : 'Eles saem desta planilha:',
      itens,
      rodape: 'O que for tirado não aparece mais em nenhuma planilha. Isso não tem como desfazer pela tela.',
      textoConfirmar: numeros.length === 1 ? 'Tirar carregamento' : 'Tirar carregamentos',
      textoCancelar: 'Voltar',
      aoConfirmar: () =>
        this.executar(
          this.api.tirar(this.id, numeros),
          numeros.length === 1 ? `Carregamento ${numeros[0]} tirado.` : `${numeros.length} carregamentos tirados.`,
        ),
    });
  }

  /**
   * Junta as linhas marcadas numa rota só: a que já tem complementos (ou, senão, a de menor número) fica como
   * principal e as outras viram complementos dela.
   */
  juntarSelecionadas(): void {
    const marcadas = this.rotasMarcadas();
    if (marcadas.length < 2 || this.temFaturadaNaSelecao) return;
    const principal = [...marcadas].sort((a, b) => b.carregamentos.length - a.carregamentos.length || a.numeroPrincipal - b.numeroPrincipal)[0];
    const outras = marcadas.filter((r) => r !== principal);
    if (outras.some((r) => r.carregamentos.length > 1)) {
      this.mensagem = { tipo: 'error', texto: 'Só uma das linhas marcadas pode já ter complementos. Tire os complementos das outras antes de juntar.' };
      return;
    }
    this.executar(
      this.api.juntar(this.id, principal.numeroPrincipal, outras.map((r) => r.numeroPrincipal)),
      `${outras.length} carga(s) juntada(s) na rota ${principal.numeroPrincipal}.`,
    );
  }

  // ---- ações gerais --------------------------------------------------------------------------------------

  /** Roda uma chamada que devolve a planilha inteira e já troca a tela pela versão nova. */
  private executar(chamada: Observable<PlanejamentoPlanilha>, sucesso?: string): void {
    if (this.trabalhando) return;
    this.trabalhando = true;
    this.mensagem = null;
    chamada.pipe(finalize(() => (this.trabalhando = false))).subscribe({
      next: (p) => {
        this.receber(p);
        if (sucesso) this.mensagem = { tipo: 'success', texto: sucesso };
      },
      error: (err) => {
        this.mensagem = { tipo: 'error', texto: extrairMensagemErro(err, 'Não foi possível concluir a ação.') };
        // O que a tela mostra pode estar defasado (ex.: alguém mexeu na planilha): lê de novo.
        this.api.obter(this.id).subscribe({ next: (p) => this.receber(p) });
      },
    });
  }

  atualizar(): void {
    this.executar(this.api.atualizar(this.id), 'Planilha atualizada com o WinThor.');
  }

  fechar(): void {
    const p = this.planilha;
    if (!p) return;
    const problemas = this.inconsistencias;

    if (problemas.length > 0) {
      this.perguntar({
        tipo: 'aviso',
        titulo: problemas.length === 1 ? 'Fechar com 1 inconsistência?' : `Fechar com ${problemas.length} inconsistências?`,
        mensagem: 'Ainda tem coisa repetida nesta planilha (está no aviso vermelho do alto):',
        itens: problemas.map((i) => i.texto),
        rodape: 'Se fechar assim, elas ficam como estão. No mesmo dia você ainda consegue reabrir e corrigir.',
        icone: 'fa-lock',
        textoConfirmar: 'Fechar mesmo assim',
        textoCancelar: 'Voltar e corrigir',
        aoConfirmar: () => this.executar(this.api.fechar(this.id), 'Planilha fechada.'),
      });
      return;
    }

    this.perguntar({
      tipo: 'info',
      titulo: `Fechar a planilha de ${formatarData(p.data)}?`,
      mensagem: `${p.totalRotas} linha(s) · ${formatarToneladas(p.pesoToneladas)} t · ${formatarMoeda(p.valorTotal)}`,
      rodape: 'Depois de fechada ela não muda mais. No mesmo dia você ainda consegue reabrir.',
      icone: 'fa-lock',
      textoConfirmar: 'Fechar planilha',
      textoCancelar: 'Voltar',
      aoConfirmar: () => this.executar(this.api.fechar(this.id), 'Planilha fechada.'),
    });
  }

  /** Abre a janela de confirmação; o que fazer se a pessoa confirmar vem no próprio pedido. */
  private perguntar(pedido: PedidoDeConfirmacao): void {
    this.confirmacao = pedido;
  }

  confirmarPergunta(): void {
    const pedido = this.confirmacao;
    this.confirmacao = null;
    pedido?.aoConfirmar();
  }

  cancelarPergunta(): void {
    this.confirmacao = null;
  }

  reabrir(): void {
    this.executar(this.api.reabrir(this.id), 'Planilha reaberta.');
  }

  // ---- complementos (a coluna "S. Carga") ----------------------------------------------------------------

  /** Encaixa uma carga solta nesta linha como complemento (a linha dela some e entra aqui). */
  adicionarComplemento(rota: PlanejamentoRota, codigo: string): void {
    const numero = Number(codigo);
    if (!numero) return;
    this.executar(this.api.juntar(this.id, rota.numeroPrincipal, [numero]), `Carga ${numero} na rota ${rota.numeroPrincipal}.`);
  }

  /** Tira um complemento da linha: ele volta a ter a linha dele. */
  removerComplemento(numero: number): void {
    this.executar(this.api.separar(this.id, [numero]), `Carga ${numero} voltou para uma linha própria.`);
  }

  // ---- motorista, caminhão e ajudantes -------------------------------------------------------------------

  /** Motorista, caminhão e ajudantes: cada mudança manda a rota inteira como ela fica. */
  private salvarRota(rota: PlanejamentoRota, parcial: { motorista?: string; caminhao?: string; ajudantes?: string[] }): void {
    const motorista = parcial.motorista !== undefined ? parcial.motorista : rota.motorista?.codigo ?? '';
    const caminhao = parcial.caminhao !== undefined ? parcial.caminhao : rota.caminhao?.codigo ?? '';
    const ajudantes = parcial.ajudantes ?? (rota.ajudantes ?? []).map((a) => a.codigo);
    this.executar(this.api.definirRota(this.id, rota.numeroPrincipal, motorista || null, ajudantes, caminhao || null));
  }

  escolherMotorista(rota: PlanejamentoRota, codigo: string): void {
    this.salvarRota(rota, { motorista: codigo });
  }

  limparMotorista(rota: PlanejamentoRota): void {
    this.salvarRota(rota, { motorista: '' });
  }

  escolherCaminhao(rota: PlanejamentoRota, codigo: string): void {
    this.salvarRota(rota, { caminhao: codigo });
  }

  limparCaminhao(rota: PlanejamentoRota): void {
    this.salvarRota(rota, { caminhao: '' });
  }

  adicionarAjudante(rota: PlanejamentoRota, codigo: string): void {
    if (!codigo) return;
    const atuais = (rota.ajudantes ?? []).map((a) => a.codigo);
    if (atuais.includes(codigo)) return;
    this.salvarRota(rota, { ajudantes: [...atuais, codigo] });
  }

  removerAjudante(rota: PlanejamentoRota, codigo: string): void {
    this.salvarRota(rota, { ajudantes: (rota.ajudantes ?? []).map((a) => a.codigo).filter((c) => c !== codigo) });
  }

  /** O ajudante não existe na lista: cadastra pelo nome e já coloca na rota. */
  cadastrarAjudante(rota: PlanejamentoRota, nome: string): void {
    if (this.trabalhando) return;
    this.trabalhando = true;
    this.mensagem = null;
    this.ajudanteApi
      .criar({ nome })
      .pipe(finalize(() => (this.trabalhando = false)))
      .subscribe({
        next: (novo) => {
          this.ajudantes = [...this.ajudantes, { codigo: novo.codigo, rotulo: novo.nome }].sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
          this.recalcularOpcoes();
          this.adicionarAjudante(rota, novo.codigo);
        },
        error: (err) => (this.mensagem = { tipo: 'error', texto: extrairMensagemErro(err, 'Não foi possível cadastrar o ajudante.') }),
      });
  }

  nomesDosAjudantes(rota: PlanejamentoRota): string {
    return (rota.ajudantes ?? []).map((a) => a.nome).join(', ');
  }

  rotuloMotorista(rota: PlanejamentoRota): string {
    return rota.motorista?.nome ?? '';
  }

  rotuloCaminhao(rota: PlanejamentoRota): string {
    return rota.caminhao?.placa ?? '';
  }

  // ---- box e saída ---------------------------------------------------------------------------------------

  /** Box e saída: cada mudança manda os três valores como a rota fica. */
  private salvarSaida(rota: PlanejamentoRota, parcial: { box?: string; dia?: string; turno?: string }): void {
    const boxTexto = parcial.box !== undefined ? parcial.box : rota.box ? String(rota.box.numero) : '';
    const dia = parcial.dia !== undefined ? parcial.dia : rota.diaSaida ?? '';
    const turno = parcial.turno !== undefined ? parcial.turno : rota.turnoSaida ?? '';
    this.executar(this.api.definirSaida(this.id, rota.numeroPrincipal, boxTexto ? Number(boxTexto) : null, dia || null, turno || null));
  }

  escolherBox(rota: PlanejamentoRota, numero: string): void {
    this.salvarSaida(rota, { box: numero });
  }

  escolherDia(rota: PlanejamentoRota, dia: string): void {
    this.salvarSaida(rota, { dia });
  }

  escolherTurno(rota: PlanejamentoRota, turno: string): void {
    this.salvarSaida(rota, { turno });
  }

  /** Box ocupado por OUTRA rota que ainda não foi faturada (o da própria rota continua valendo). */
  boxOcupado(box: PlanejamentoBox, rota: PlanejamentoRota): boolean {
    return box.ocupadoPorRota !== null && box.ocupadoPorRota !== undefined && box.ocupadoPorRota !== rota.numeroPrincipal;
  }

  // ---- mensagem para o grupo -----------------------------------------------------------------------------

  /** Monta a mensagem só das linhas marcadas (a pessoa pode editar o texto antes de copiar). */
  abrirMensagem(): void {
    if (!this.planilha) return;
    this.mensagemTexto = montarMensagem(this.rotasMarcadas(), this.planilha.data);
    this.mensagemAberta = true;
    this.copiado = false;
  }

  /** A caixa da mensagem cresce para mostrar o texto inteiro (entre 8 e 26 linhas). */
  get linhasDaMensagem(): number {
    return Math.min(26, Math.max(8, this.mensagemTexto.split('\n').length + 1));
  }

  fecharMensagem(): void {
    this.mensagemAberta = false;
  }

  async copiarMensagem(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.mensagemTexto);
      this.copiado = true;
      setTimeout(() => (this.copiado = false), 2000);
    } catch {
      // sem permissão para a área de transferência: a pessoa ainda pode selecionar o texto e copiar à mão
      this.mensagem = { tipo: 'error', texto: 'Não deu para copiar sozinho. Selecione o texto da mensagem e copie (Ctrl+C).' };
    }
  }

  abrirWhatsApp(): void {
    window.open('https://wa.me/?text=' + encodeURIComponent(this.mensagemTexto), '_blank', 'noopener');
  }

  /** O que o botão vai imprimir: as marcadas; se não há marcadas, o que o filtro mostra (ou tudo, sem filtro). */
  rotasParaImprimir(): PlanejamentoRota[] {
    return this.selecionadas.size > 0 ? this.rotasMarcadas() : this.rotasVisiveis;
  }

  get textoImprimir(): string {
    if (this.selecionadas.size > 0) return `Imprimir marcadas (${this.selecionadas.size})`;
    return this.filtrando ? `Imprimir filtro (${this.rotasVisiveis.length})` : 'Imprimir';
  }

  get dicaImprimir(): string {
    return this.selecionadas.size > 0
      ? 'Imprime só as linhas marcadas'
      : this.filtrando
        ? 'Imprime só as linhas que o filtro está mostrando'
        : 'Imprime a planilha inteira. Para imprimir só algumas, marque as linhas antes.';
  }

  imprimir(): void {
    if (!this.planilha) return;
    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    document.body.appendChild(frame);

    const doc = frame.contentWindow?.document;
    if (!doc || !frame.contentWindow) {
      document.body.removeChild(frame);
      return;
    }
    doc.open();
    doc.write(montarHtmlImpressao(this.planilha, this.rotasParaImprimir()));
    doc.close();
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => document.body.removeChild(frame), 1000);
  }

  // ---- apoio da tela -------------------------------------------------------------------------------------

  turnoRotulo(valor: string | null | undefined): string {
    return rotuloTurno(valor);
  }

  /** Os selos de situação do carregamento principal da linha. */
  selos(r: PlanejamentoRota): Selo[] {
    return selosDoCarregamento(r.carregamentos[0]);
  }

  /** A rota inteira é travada quando o principal já foi faturado. */
  rotaTravada(r: PlanejamentoRota): boolean {
    return !!r.carregamentos[0]?.faturada;
  }

  cor(r: PlanejamentoRota | null | undefined): CorDaRota | null {
    return corDaRota(r);
  }

  trackRota(_: number, r: PlanejamentoRota): number {
    return r.numeroPrincipal;
  }
}
