import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProgrammesRoutingModule } from './programmes-routing.module';
import { ProgrammesComponent } from './programmes/programmes.component';
import { ProgrammeDetailComponent } from './programme-detail/programme-detail.component';
import { BatchUploadProgrammeComponent } from './batch-upload-programme/batch-upload-programme.component';
import { MaterialFileInputModule } from 'ngx-material-file-input';
import { MaterialsModule } from 'src/app/materials/materials.module';
import { LayoutModule } from '@angular/cdk/layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {NgxMaterialTimepickerModule} from 'ngx-material-timepicker';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
@NgModule({
  declarations: [ProgrammesComponent,
     ProgrammeDetailComponent, 
     ConfirmDialogComponent,
     BatchUploadProgrammeComponent],
  imports: [
    CommonModule,
    ProgrammesRoutingModule,
    MaterialFileInputModule,
    MaterialsModule,
    LayoutModule,
    FormsModule,
    ReactiveFormsModule,
    NgxSkeletonLoaderModule,
    NgxMaterialTimepickerModule
  ],
  entryComponents: [ ConfirmDialogComponent]
})
export class ProgrammesModule { }
