import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardHomeComponent } from './ofertador-home/ofertador-home.component';
import { GlobalOfertadorFacturasComponent } from './global-ofertador-facturas/global-ofertador-facturas.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardHomeComponent
  },
  {
    path: 'global',
    component: GlobalOfertadorFacturasComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OfertadorFacturasRoutingModule { }
