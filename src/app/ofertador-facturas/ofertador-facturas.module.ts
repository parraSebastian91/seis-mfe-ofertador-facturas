import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OfertadorFacturasRoutingModule } from './ofertador-facturas-routing.module';

import { DashboardHomeComponent } from './ofertador-home/ofertador-home.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    OfertadorFacturasRoutingModule,
    DashboardHomeComponent
  ]
})
export class OfertadorFacturasModule { }
