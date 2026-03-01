import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() fullWidth: boolean = false;
  @Input() loading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() icon?: string;
  @Input() iconPosition: 'start' | 'end' = 'start';
  
  @Output() buttonClick = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const classes = [
      'app-button',
      `app-button--${this.variant}`,
      `app-button--${this.size}`
    ];
    
    if (this.fullWidth) {
      classes.push('app-button--full');
    }
    
    if (this.loading) {
      classes.push('app-button--loading');
    }
    
    if (this.disabled) {
      classes.push('app-button--disabled');
    }
    
    return classes.join(' ');
  }

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  onClick(event: MouseEvent): void {
    if (!this.isDisabled) {
      this.buttonClick.emit(event);
    }
  }
}