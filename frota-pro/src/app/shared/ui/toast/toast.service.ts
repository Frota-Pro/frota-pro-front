import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'ok' | 'info' | 'warn' | 'err';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  ttlMs: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = new BehaviorSubject<ToastMessage[]>([]);
  readonly toasts$ = this._toasts.asObservable();

  success(message: string, title = 'Sucesso') {
    this.push({ type: 'ok', title, message });
  }

  info(message: string, title = 'Info') {
    this.push({ type: 'info', title, message });
  }

  warn(message: string, title = 'Atenção') {
    this.push({ type: 'warn', title, message });
  }

  error(message: string, title = 'Erro') {
    this.push({ type: 'err', title, message });
  }

  dismiss(id: string) {
    this._toasts.next(this._toasts.value.filter(t => t.id !== id));
  }

  private push(partial: { type: ToastType; title?: string; message: string; ttlMs?: number }) {
    const id = (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));
    const ttlMs = partial.ttlMs ?? 4500;

    const toast: ToastMessage = {
      id,
      type: partial.type,
      title: partial.title,
      message: partial.message,
      ttlMs
    };

    this._toasts.next([toast, ...this._toasts.value].slice(0, 5));
    window.setTimeout(() => this.dismiss(id), ttlMs);
  }
}
