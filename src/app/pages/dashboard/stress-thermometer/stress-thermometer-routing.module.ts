import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StressThermometerComponent } from './stress-thermometer/stress-thermometer.component';
import { StressThermometerListComponent } from './stress-thermometer-list/stress-thermometer-list.component';

const routes: Routes = [
  {
    path: '',
    component: StressThermometerListComponent,
  },
  {
    path: ':surveyId',
    component: StressThermometerComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StressThermometerRoutingModule {}

