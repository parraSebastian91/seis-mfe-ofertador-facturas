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
  CardOrganizacionComponent,
} from 'shared-utils';
import { CarteraLeadsComponent } from './cartera-leads/cartera-leads.component';
import { GlobalOfertadorFacturasComponent } from './global-ofertador-facturas/global-ofertador-facturas.component';

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
    CarteraLeadsComponent,
    CardOrganizacionComponent,
    GlobalOfertadorFacturasComponent
  ],
})
export class OfertadorFacturasModule {}
