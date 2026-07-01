import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OfertadorFacturasRoutingModule } from './ofertador-facturas-routing.module';

import { DashboardHomeComponent } from './ofertador-home/ofertador-home.component';
import {
  CardColaboradorComponent,
  CardComponent,
  CardTitleDirective,
  CardFooterDirective,
  SearchableCardSelectComponent,
} from 'shared-utils';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    OfertadorFacturasRoutingModule,
    DashboardHomeComponent,
    CardColaboradorComponent,
    CardComponent,
    CardTitleDirective,
    CardFooterDirective,
    SearchableCardSelectComponent,
  ],
})
export class OfertadorFacturasModule {}
