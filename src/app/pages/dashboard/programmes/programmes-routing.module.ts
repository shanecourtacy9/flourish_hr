import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProgrammeResolveService } from 'src/app/services/resolvers';
import { BatchUploadProgrammeComponent } from './batch-upload-programme/batch-upload-programme.component';
import { ProgrammeDetailComponent } from './programme-detail/programme-detail.component';
import { ProgrammesComponent } from './programmes/programmes.component';


const routes: Routes = [
  {
    path:'',
    component:ProgrammesComponent
  },
  {
    path:'add',
    component:ProgrammeDetailComponent
  },
  {
    path:'edit/:programmeId',
    component:ProgrammeDetailComponent,
    resolve: {
      programme: ProgrammeResolveService
    }
  },
  {
    path:'batchupload',
    component:BatchUploadProgrammeComponent
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProgrammesRoutingModule { }
