import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StressThermometerRoutingModule } from './stress-thermometer-routing.module';
import { StressThermometerComponent } from './stress-thermometer/stress-thermometer.component';
import { StressThermometerListComponent } from './stress-thermometer-list/stress-thermometer-list.component';
import { MaterialsModule } from 'src/app/materials/materials.module';

@NgModule({
  declarations: [StressThermometerComponent, StressThermometerListComponent],
  imports: [CommonModule, MaterialsModule, StressThermometerRoutingModule],
})
export class StressThermometerModule {}

