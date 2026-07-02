import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FacturaSeleccionada {
  folio: string;
  razonSocial: string;
  status: string;
  deudorName: string;
  deudorRut: string;
  montoNeto: number;
  montoTotal: number;
  diasAlVencimiento: number;
}

export interface LeadsMarketplace {
  razonSocial: string;
  rut: string;
  totalFacturas: number;
}

@Component({
  selector: 'app-ofertador-aside',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './ofertador-aside.component.html',
  styleUrl: './ofertador-aside.component.scss',
})
export class OfertadorAsideComponent implements OnChanges {
  @Input() factura: FacturaSeleccionada | null = null;
  @Input() cliente: LeadsMarketplace | null = null;
  @Input() abierto: boolean = false;
  @Output() cerrar = new EventEmitter<void>();

  tasaSimulada: number = 0;
  descuentoInteres: number = 0;
  comisionFija: number = 0;
  giroLiquidoCalculado: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['factura'] && this.factura) {
      this.tasaSimulada = 0;
      this.recalcularOperacion();
    }
  }

  cerrarOfertador(): void {
    this.cerrar.emit();
  }

  recalcularOperacion(): void {
    if (!this.factura) return;
    const tasaMensual = this.tasaSimulada / 100;
    const meses = this.factura.diasAlVencimiento / 30;
    this.descuentoInteres = Math.round(this.factura.montoTotal * tasaMensual * meses);
    this.comisionFija = Math.round(this.factura.montoTotal * 0.005);
    this.giroLiquidoCalculado = Math.max(
      0,
      this.factura.montoTotal - this.descuentoInteres - this.comisionFija,
    );
  }

  enviarOfertaComercial(): void {
    console.log('Enviando oferta comercial:', this.factura, this.cliente);
  }
}
