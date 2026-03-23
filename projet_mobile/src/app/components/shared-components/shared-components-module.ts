import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ButtonComponent } from '../button/button.component'; // Update the path to the correct location
import { InputFieldComponent } from '../input-field/input-field.component';

@NgModule({
  declarations: [
    ButtonComponent,
    InputFieldComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule
  ],
  exports: [
    ButtonComponent,
    InputFieldComponent
  ]
})
export class SharedComponentsModule {}