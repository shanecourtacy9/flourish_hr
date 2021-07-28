import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { RootComponent } from './root/root.component';
import { MaterialsModule } from 'src/app/materials/materials.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from './sidebar/sidebar.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NavbarComponent } from './navbar/navbar.component';
import { ResetPasswordComponent } from "../shared/reset-password/reset-password.component";
@NgModule({
  declarations: [
    RootComponent,
    SidebarComponent,
    NavbarComponent,
    ResetPasswordComponent],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    FormsModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    MaterialsModule,
  ],
  entryComponents: [ResetPasswordComponent]
})
export class DashboardModule { }
