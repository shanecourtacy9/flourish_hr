import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';
import { UsersComponent } from './users/users.component';
import { MaterialsModule } from 'src/app/materials/materials.module';
import { LayoutModule } from '@angular/cdk/layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { BatchUploadUsersComponent } from './batch-upload-users/batch-upload-users.component';
import { MaterialFileInputModule } from 'ngx-material-file-input';
@NgModule({
  declarations: [UsersComponent, UserDetailComponent, BatchUploadUsersComponent],
  imports: [
    CommonModule,
    UsersRoutingModule,
    MaterialFileInputModule,
    MaterialsModule,
    LayoutModule,
    FormsModule,
    ReactiveFormsModule,
    NgxSkeletonLoaderModule
  ]
})
export class UsersModule { }
