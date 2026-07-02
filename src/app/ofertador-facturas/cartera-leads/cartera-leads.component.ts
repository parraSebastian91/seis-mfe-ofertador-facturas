import { CardOrganizacionComponent } from 'shared-utils';
import { Component } from '@angular/core';
import { CardComponent } from '../../../../../shared-utils/src/public-api';

export interface LeadsMarketplace {
  razonSocial: string;
  rut: string;
  totalFacturas: number;
}

@Component({
  selector: 'app-cartera-leads',
  standalone: true,
  templateUrl: './cartera-leads.component.html',
  styleUrl: './cartera-leads.component.scss',
  imports: [CardComponent, CardOrganizacionComponent]
})
export class CarteraLeadsComponent {

  clientesStream: LeadsMarketplace[] = [
    { razonSocial: 'Empresa A', rut: '12345678-9', totalFacturas: 10 },
    { razonSocial: 'Empresa B', rut: '98765432-1', totalFacturas: 5 },
    { razonSocial: 'Empresa C', rut: '45678901-2', totalFacturas: 8 },
    { razonSocial: 'Empresa D', rut: '23456789-0', totalFacturas: 12 },
    { razonSocial: 'Empresa E', rut: '34567890-1', totalFacturas: 7 },
    { razonSocial: 'Empresa B', rut: '98765432-1', totalFacturas: 5 },
    { razonSocial: 'Empresa C', rut: '45678901-2', totalFacturas: 8 },
    { razonSocial: 'Empresa D', rut: '23456789-0', totalFacturas: 12 },
    { razonSocial: 'Empresa E', rut: '34567890-1', totalFacturas: 7 },
    { razonSocial: 'Empresa B', rut: '98765432-1', totalFacturas: 5 },
    { razonSocial: 'Empresa C', rut: '45678901-2', totalFacturas: 8 },
    { razonSocial: 'Empresa D', rut: '23456789-0', totalFacturas: 12 },
    { razonSocial: 'Empresa E', rut: '34567890-1', totalFacturas: 7 },
    { razonSocial: 'Empresa B', rut: '98765432-1', totalFacturas: 5 },
    { razonSocial: 'Empresa C', rut: '45678901-2', totalFacturas: 8 },
    { razonSocial: 'Empresa D', rut: '23456789-0', totalFacturas: 12 },
    { razonSocial: 'Empresa E', rut: '34567890-1', totalFacturas: 7 }
  ];

  clienteSeleccionado?: LeadsMarketplace;

  seleccionarCliente(cliente: LeadsMarketplace) {
    this.clienteSeleccionado = cliente;
  }

  deseleccionarCliente() {
    this.clienteSeleccionado = undefined;
  }

}
