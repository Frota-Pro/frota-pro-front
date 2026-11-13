import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OpcaoAuto, filtrarOpcoes, podeCadastrar } from './autocomplete.utils';

/**
 * Campo de busca para escolher: a pessoa digita um pedaço do nome (ou da placa) e a lista aparece. Opcionalmente
 * oferece "+ Cadastrar" quando o que foi digitado não existe.
 */
@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auto" [style.width]="largura" [style.min-width]="largura">
      <input
        type="text"
        class="auto-campo"
        autocomplete="off"
        [placeholder]="placeholder"
        [attr.aria-label]="rotulo"
        [disabled]="desabilitado"
        [(ngModel)]="texto"
        (focus)="abrir()"
        (input)="aoDigitar()"
        (blur)="fechar()"
        (keydown)="aoTeclar($event)"
      />
      <button type="button" class="auto-limpar" *ngIf="limpavel && valorRotulo && !desabilitado" aria-label="Limpar" (mousedown)="limparEscolha($event)">×</button>
      <ul class="auto-lista" *ngIf="aberta && (filtradas.length > 0 || cadastravel)" role="listbox" [ngStyle]="estiloLista">
        <li
          *ngFor="let o of filtradas; let i = index"
          role="option"
          [class.ativa]="i === indice"
          (mousedown)="escolherOpcao(o, $event)"
        >
          <span>{{ o.rotulo }}</span>
          <small *ngIf="o.detalhe">{{ o.detalhe }}</small>
        </li>
        <li class="criar" role="option" *ngIf="cadastravel" [class.ativa]="indice === filtradas.length" (mousedown)="cadastrar($event)">
          + Cadastrar "{{ texto.trim() }}"
        </li>
      </ul>
    </div>
  `,
  styles: [
    `
      .auto { position: relative; display: inline-block; }
      .auto-campo { width: 100%; box-sizing: border-box; border: 1px solid #d1d5db; border-radius: 10px; padding: 7px 26px 7px 10px; font-size: 13px; background: #fff; color: #111827; }
      .auto-campo:focus { outline: 2px solid rgba(59, 130, 246, .45); border-color: #3b82f6; }
      .auto-campo:disabled { background: #f3f4f6; }
      .auto-limpar { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); border: 0; background: transparent; cursor: pointer; font-size: 16px; line-height: 1; color: #6b7280; padding: 2px 6px; }
      .auto-limpar:hover { color: #b91c1c; }
      .auto-lista { position: fixed; z-index: 1000; margin: 0; padding: 4px; list-style: none; background: #fff; border: 1px solid #d1d5db; border-radius: 10px; box-shadow: 0 8px 24px rgba(0, 0, 0, .14); max-height: 260px; overflow-y: auto; }
      .auto-lista li { display: flex; flex-direction: column; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #111827; }
      .auto-lista li small { color: #6b7280; font-size: 11px; }
      .auto-lista li.ativa, .auto-lista li:hover { background: #eff6ff; }
      .auto-lista li.criar { color: #1d4ed8; font-weight: 600; border-top: 1px solid #eef2f7; margin-top: 2px; }
    `,
  ],
})
export class AutocompleteComponent implements OnChanges, OnInit, OnDestroy {
  @Input() opcoes: OpcaoAuto[] = [];
  @Input() placeholder = '';
  @Input() rotulo = '';
  /** O que está escolhido agora (aparece escrito no campo). */
  @Input() valorRotulo = '';
  @Input() desabilitado = false;
  /** Mostra o "×" para limpar a escolha. */
  @Input() limpavel = true;
  /** Oferece "+ Cadastrar" quando o texto não existe na lista. */
  @Input() permitirCriar = false;
  /** Depois de escolher, esvazia o campo (para os que vão acumulando, como ajudantes). */
  @Input() limparAoEscolher = false;
  /** Largura do campo (ex.: '170px'); em tabela, o campo cabe na célula. */
  @Input() largura = '190px';

  @Output() escolher = new EventEmitter<string>();
  @Output() limpar = new EventEmitter<void>();
  @Output() criar = new EventEmitter<string>();

  texto = '';
  aberta = false;
  indice = 0;
  filtradas: OpcaoAuto[] = [];
  private digitou = false;
  private ajusteX = 0;
  private ajusteY = 0;
  /** A lista fica "solta" na tela (position: fixed) para não ser cortada pela rolagem da tabela. */
  estiloLista: Record<string, string> = {};
  private readonly aoRolar = () => {
    if (this.aberta) this.fechar();
  };

  constructor(private elemento: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    document.addEventListener('scroll', this.aoRolar, true);
    window.addEventListener('resize', this.aoRolar);
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.aoRolar, true);
    window.removeEventListener('resize', this.aoRolar);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['valorRotulo'] && !this.aberta) {
      this.texto = this.valorRotulo ?? '';
    }
  }

  get cadastravel(): boolean {
    return this.permitirCriar && this.digitou && podeCadastrar(this.opcoes, this.texto);
  }

  abrir(): void {
    this.digitou = false;
    this.aberta = true;
    this.posicionarLista();
    this.atualizar('');
  }

  aoDigitar(): void {
    this.digitou = true;
    this.aberta = true;
    this.posicionarLista();
    this.atualizar(this.texto);
  }

  fechar(): void {
    this.aberta = false;
    this.digitou = false;
    // quem não escolheu nada volta ao que estava escolhido
    this.texto = this.limparAoEscolher ? '' : this.valorRotulo ?? '';
  }

  aoTeclar(evento: KeyboardEvent): void {
    const total = this.filtradas.length + (this.cadastravel ? 1 : 0);
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      this.aberta = true;
      this.indice = total ? (this.indice + 1) % total : 0;
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      this.indice = total ? (this.indice - 1 + total) % total : 0;
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      if (this.indice < this.filtradas.length) this.escolherOpcao(this.filtradas[this.indice]);
      else if (this.cadastravel) this.cadastrar();
    } else if (evento.key === 'Escape') {
      this.fechar();
    }
  }

  escolherOpcao(o: OpcaoAuto, evento?: Event): void {
    evento?.preventDefault();
    this.escolher.emit(o.codigo);
    this.aberta = false;
    this.digitou = false;
    this.texto = this.limparAoEscolher ? '' : o.rotulo;
  }

  cadastrar(evento?: Event): void {
    evento?.preventDefault();
    const nome = this.texto.trim();
    if (!nome) return;
    this.criar.emit(nome);
    this.aberta = false;
    this.digitou = false;
    this.texto = '';
  }

  limparEscolha(evento: Event): void {
    evento.preventDefault();
    this.texto = '';
    this.limpar.emit();
  }

  /** Põe a lista logo abaixo do campo (ou acima, se não couber embaixo). */
  private posicionarLista(): void {
    const campo = this.elemento.nativeElement.querySelector('input');
    if (!campo) return;
    const r = campo.getBoundingClientRect();
    const largura = Math.max(r.width, 240);
    const cabeEmbaixo = window.innerHeight - r.bottom > 220 || r.top < 220;
    this.ajusteX = 0;
    this.ajusteY = 0;
    this.estiloLista = cabeEmbaixo
      ? { left: r.left + 'px', top: r.bottom + 4 + 'px', width: largura + 'px' }
      : { left: r.left + 'px', bottom: window.innerHeight - r.top + 4 + 'px', width: largura + 'px' };
    // Depois de desenhada, confere se a lista ficou mesmo colada no campo (um elemento em volta com transform ou
    // filter muda a referência do "position: fixed") e, se não, desloca o que faltar.
    setTimeout(() => this.corrigirDesvio(), 0);
  }

  private corrigirDesvio(): void {
    const raiz = this.elemento.nativeElement;
    const lista = raiz.querySelector('.auto-lista') as HTMLElement | null;
    const campo = raiz.querySelector('input');
    if (!lista || !campo) return;
    const c = campo.getBoundingClientRect();
    const l = lista.getBoundingClientRect();
    const abaixo = this.estiloLista['top'] !== undefined;
    const esperadoTop = abaixo ? c.bottom + 4 : c.top - 4 - l.height;
    const dx = c.left - l.left;
    const dy = esperadoTop - l.top;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      this.ajusteX += dx;
      this.ajusteY += dy;
      this.estiloLista = { ...this.estiloLista, transform: `translate(${this.ajusteX}px, ${this.ajusteY}px)` };
    }
  }

  private atualizar(busca: string): void {
    this.filtradas = filtrarOpcoes(this.opcoes, busca);
    this.indice = 0;
  }
}
