import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TipoConfirmacao = 'perigo' | 'aviso' | 'info';

/** O que a janela de confirmação mostra e o que fazer se a pessoa confirmar. */
export interface PedidoDeConfirmacao {
  /** perigo = ação que não volta (vermelho); aviso = atenção (âmbar); info = pergunta normal (azul). */
  tipo: TipoConfirmacao;
  titulo: string;
  mensagem?: string;
  /** Lista do que vai ser afetado (cargas, inconsistências...). */
  itens?: string[];
  /** Frase menor no fim (ex.: "Isso não pode ser desfeito"). */
  rodape?: string;
  textoConfirmar: string;
  textoCancelar: string;
  /** Classe do Font Awesome (ex.: "fa-lock"); se faltar, usa o ícone do tipo. */
  icone?: string;
  aoConfirmar: () => void;
}

const ICONE_POR_TIPO: Record<TipoConfirmacao, string> = {
  perigo: 'fa-trash-alt',
  aviso: 'fa-exclamation-triangle',
  info: 'fa-question-circle',
};

/**
 * Janela de confirmação do sistema (no lugar do quadro cinza do navegador). Cobre a tela toda, esmaece o fundo e
 * pede um "sim" claro. Esc ou clicar fora cancela; o foco já nasce no botão de confirmar.
 */
@Component({
  selector: 'app-confirmacao',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fundo" (click)="cancelar.emit()" role="presentation">
      <div
        class="caixa"
        [ngClass]="pedido.tipo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmacao-titulo"
        (click)="$event.stopPropagation()"
      >
        <div class="topo">
          <span class="icone"><i class="fas" [ngClass]="icone"></i></span>
          <h2 id="confirmacao-titulo">{{ pedido.titulo }}</h2>
        </div>

        <p class="mensagem" *ngIf="pedido.mensagem">{{ pedido.mensagem }}</p>

        <ul class="itens" *ngIf="pedido.itens && pedido.itens.length > 0">
          <li *ngFor="let item of pedido.itens">{{ item }}</li>
        </ul>

        <p class="rodape" *ngIf="pedido.rodape">{{ pedido.rodape }}</p>

        <div class="acoes">
          <button type="button" class="btn-cancelar" (click)="cancelar.emit()">{{ pedido.textoCancelar }}</button>
          <button #botaoConfirmar type="button" class="btn-confirmar" (click)="confirmar.emit()">{{ pedido.textoConfirmar }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host { position: fixed; inset: 0; z-index: 3000; display: block; }
      .fundo { position: absolute; inset: 0; background: rgba(15, 23, 42, .55); display: flex; align-items: center; justify-content: center; padding: 16px; animation: aparecer .15s ease-out; }
      .caixa { width: min(460px, 100%); max-height: 90vh; overflow-y: auto; background: #fff; border-radius: 18px; padding: 22px 22px 18px; box-shadow: 0 24px 60px rgba(0, 0, 0, .35); animation: subir .18s ease-out; border-top: 6px solid var(--cor); --cor: #2563eb; --cor-fundo: #dbeafe; }
      .caixa.perigo { --cor: #dc2626; --cor-fundo: #fee2e2; }
      .caixa.aviso { --cor: #d97706; --cor-fundo: #fef3c7; }
      .topo { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
      .icone { width: 42px; height: 42px; border-radius: 999px; background: var(--cor-fundo); color: var(--cor); display: inline-flex; align-items: center; justify-content: center; font-size: 18px; flex: none; }
      h2 { margin: 0; font-size: 18px; font-weight: 700; color: #111827; line-height: 1.25; }
      .mensagem { margin: 6px 0 0; font-size: 14px; line-height: 1.5; color: #374151; }
      .itens { margin: 12px 0 0; padding: 10px 12px 10px 28px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; font-size: 13px; color: #111827; max-height: 190px; overflow-y: auto; }
      .itens li { margin: 3px 0; line-height: 1.4; }
      .rodape { margin: 12px 0 0; font-size: 12px; color: #6b7280; }
      .acoes { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
      button { font: inherit; font-size: 14px; font-weight: 600; border-radius: 12px; padding: 10px 18px; cursor: pointer; }
      .btn-cancelar { background: #fff; color: #374151; border: 1px solid #d1d5db; }
      .btn-cancelar:hover { border-color: #111827; color: #111827; }
      .btn-confirmar { background: var(--cor); color: #fff; border: 1px solid var(--cor); }
      .btn-confirmar:hover { filter: brightness(.92); }
      button:focus-visible { outline: 3px solid rgba(37, 99, 235, .4); outline-offset: 2px; }
      @keyframes aparecer { from { opacity: 0; } to { opacity: 1; } }
      @keyframes subir { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }
    `,
  ],
})
export class ConfirmacaoComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) pedido!: PedidoDeConfirmacao;
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  @ViewChild('botaoConfirmar') botaoConfirmar?: ElementRef<HTMLButtonElement>;

  constructor(private host: ElementRef<HTMLElement>) {}

  get icone(): string {
    return this.pedido.icone ?? ICONE_POR_TIPO[this.pedido.tipo];
  }

  ngOnInit(): void {
    // Vai para o <body>: assim nenhum elemento em volta (rolagem, transform, filtro) corta ou desloca a janela.
    document.body.appendChild(this.host.nativeElement);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.botaoConfirmar?.nativeElement.focus(), 0);
  }

  ngOnDestroy(): void {
    this.host.nativeElement.remove();
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    this.cancelar.emit();
  }
}
