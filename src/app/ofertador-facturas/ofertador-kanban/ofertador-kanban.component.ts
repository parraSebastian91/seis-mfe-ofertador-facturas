import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  CardComponent,
  CardTitleDirective,
} from '../../../../../shared-utils/src/public-api';
export interface LeadsMarketplace {
  razonSocial: string;
  rut: string;
  totalFacturas: number;
}

export interface FacturasPublicadas {
  id: string;
  folio: string;
  vencimiento: string;
  deudorName: string;
  giroLiquido: number;
  montoTotal: number;
}

export interface FacturasOfertadas {
  id: number;
  folio: string;
  tasaAplicada: number;
  deudorName: string;
  giroLiquido: number;
}

export interface FacturasNegociables {
  id: number;
  folio: string;
  tasaAplicada: number;
  deudorName: string;
  giroLiquido: number;
  tasaSolicitadaPyme: number;
}

@Component({
  selector: 'app-ofertador-kanban',
  standalone: true,
  templateUrl: './ofertador-kanban.component.html',
  styleUrl: './ofertador-kanban.component.scss',
  imports: [DecimalPipe, CardComponent, CardTitleDirective],
})
export class OfertadorKanbanComponent {
  clienteSeleccionado: LeadsMarketplace | null = null;
  facturasPublicadas: FacturasPublicadas[] = [
    {
      id: '1',
      folio: 'F123',
      vencimiento: '2024-07-01',
      deudorName: 'Empresa XYZ',
      giroLiquido: 1000000,
      montoTotal: 1200000,
    },
    {
      id: '2',
      folio: 'F124',
      vencimiento: '2024-07-15',
      deudorName: 'Empresa ABC',
      giroLiquido: 2000000,
      montoTotal: 2400000,
    },
    {
      id: '3',
      folio: 'F125',
      vencimiento: '2024-08-01',
      deudorName: 'Empresa DEF',
      giroLiquido: 1500000,
      montoTotal: 1800000,
    },
  ];

  facturasNegociables: FacturasNegociables[] = [
    {
      id: 1,
      folio: 'F123',
      tasaAplicada: 5,
      deudorName: 'Empresa XYZ',
      giroLiquido: 1000000,
      tasaSolicitadaPyme: 6,
    },
  ];

  facturasOfertadas: FacturasOfertadas[] = [
    {
      id: 1,
      folio: 'F123',
      tasaAplicada: 5,
      deudorName: 'Empresa XYZ',
      giroLiquido: 1000000,
    },
    {
      id: 2,
      folio: 'F124',
      tasaAplicada: 4.5,
      deudorName: 'Empresa ABC',
      giroLiquido: 2000000,
    },
  ];

  seleccionarCliente(cliente: LeadsMarketplace) {
    this.clienteSeleccionado = cliente;
  }

  deseleccionarCliente() {
    this.clienteSeleccionado = null;
  }

  calcularDiasVencimiento(fechaVencimiento: string): number {
    const fechaActual = new Date();
    const fechaVencimientoDate = new Date(fechaVencimiento);
    const diferenciaTiempo =
      fechaVencimientoDate.getTime() - fechaActual.getTime();
    const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
    return diferenciaDias;
  }

  abrirOfertadorLateral(factura: FacturasNegociables | FacturasPublicadas) {}
}
