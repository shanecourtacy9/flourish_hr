import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { HomeRoutingModule } from "./home-routing.module";
import { HomeComponent } from "./home/home.component";
import { MaterialsModule } from "src/app/materials/materials.module";
// import { NavbarComponent } from '../navbar/navbar.component';
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";
import { FormsModule } from "@angular/forms";
import { NgbProgressbarModule } from "@ng-bootstrap/ng-bootstrap";

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    HomeRoutingModule,
    NgxSkeletonLoaderModule,
    MaterialsModule,
    FormsModule,
    NgbProgressbarModule,
  ],
})
export class HomeModule {}
