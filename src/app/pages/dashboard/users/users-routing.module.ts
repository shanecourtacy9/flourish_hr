import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserResolveService } from 'src/app/services/resolvers';
import { BatchUploadUsersComponent } from './batch-upload-users/batch-upload-users.component';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { UsersComponent } from './users/users.component';


const routes: Routes = [
  {
    path:'',
    component:UsersComponent
  },
  {
    path:'add',
    component:UserDetailComponent
  },
  {
    path:'edit/:userId',
    component:UserDetailComponent,
    resolve: {
      user: UserResolveService
    }
  },
  {
    path:'batchupload',
    component:BatchUploadUsersComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }
