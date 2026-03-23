import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, AbstractControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-field',
  templateUrl: './input-field.component.html',
  styleUrls: ['./input-field.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFieldComponent),
      multi: true
    }
  ]
})
export class InputFieldComponent implements ControlValueAccessor, OnInit {
  @Input() label?: string;
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() icon?: string;
  @Input() errorMessage?: string;
  @Input() hintText?: string;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() formControlRef?: AbstractControl | null;  // ← CORRIGÉ: AbstractControl au lieu de FormControl
  
  value: string = '';
  showPassword: boolean = false;
  focused: boolean = false;
  
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    if (this.formControlRef) {
      this.formControlRef.statusChanges.subscribe(() => {
        // Trigger change detection
      });
    }
  }

  get inputType(): string {
    if (this.type === 'password' && this.showPassword) {
      return 'text';
    }
    return this.type;
  }

  get isPassword(): boolean {
    return this.type === 'password';
  }

  get hasError(): boolean {
    if (this.formControlRef) {
      return !!(this.formControlRef.invalid && (this.formControlRef.dirty || this.formControlRef.touched));
    }
    return !!this.errorMessage;
  }

  get displayError(): string | null {
    if (this.formControlRef && this.hasError) {
      const errors = this.formControlRef.errors;
      if (errors) {
        if (errors['required']) return `${this.label || 'This field'} is required`;
        if (errors['email']) return 'Please enter a valid email address';
        if (errors['minlength']) return `Minimum length is ${errors['minlength'].requiredLength} characters`;
        if (errors['maxlength']) return `Maximum length is ${errors['maxlength'].requiredLength} characters`;
        if (errors['pattern']) return 'Please enter a valid format';
        if (errors['passwordMismatch']) return 'Passwords do not match';
        if (errors['weakPassword']) return 'Password must be at least 8 characters with uppercase, lowercase, and number';
      }
    }
    return this.errorMessage || null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onInputChange(event: any): void {
    const value = event.target.value;
    this.value = value;
    this.onChange(value);
  }

  onFocus(): void {
    this.focused = true;
  }

  onBlur(): void {
    this.focused = false;
    this.onTouched();
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}