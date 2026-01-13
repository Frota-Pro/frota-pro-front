import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.css'],
})
export class ActionButtonComponent {
  @Input({ required: true }) label!: string;
  @Input() iconClass: string = 'fas fa-bolt';

  @Output() action = new EventEmitter<void>();

  onClick() {
    this.action.emit();
  }
}
