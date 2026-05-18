import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OfertadorFacturasRoutingModule } from './ofertador-facturas-routing.module';
import { DashboardHomeComponent } from './ofertador-home/ofertador-home.component';

@NgModule({
  declarations: [DashboardHomeComponent],
  imports: [
    CommonModule,
    OfertadorFacturasRoutingModule
  ]
})
export class OfertadorFacturasModule { }
