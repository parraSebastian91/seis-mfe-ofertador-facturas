import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountdownPipe } from './countdown.pipe';

export interface FacturaMarketplace {
  folio: string;
  razonSocial: string;
  rutDeudor: string;
  monto: number;
  tiempoRestante: number; // segundos
  ofertas: number;
  tasaMinima: number | null;
  nueva?: boolean;
}

@Component({
  selector: 'app-facturas-marketplace',
  templateUrl: './facturas-marketplace.component.html',
  styleUrls: ['./facturas-marketplace.component.scss'],
  standalone: true,
  imports: [CommonModule, CountdownPipe]
})
export class FacturasMarketplaceComponent implements OnInit, OnChanges {
  @Input() facturas: FacturaMarketplace[] = [];
  @Output() seleccionarFactura = new EventEmitter<FacturaMarketplace>();

  filtroActivo: 'ninguno' | 'preferidas' | 'liquidez' | 'reloj' = 'ninguno';
  facturasFiltradas: FacturaMarketplace[] = [];

  // Simulación: deudores preferidos y alta liquidez
  deudoresPreferidos = ['Inversiones Chile S.A.', 'Comercial Andes SpA'];
  deudoresAltaLiquidez = ['Inversiones Chile S.A.', 'Servicios Financieros Ltda.'];

  ngOnInit() {
    this.aplicarFiltro('ninguno');
  }

  ngOnChanges() {
    this.aplicarFiltro(this.filtroActivo);
  }

  aplicarFiltro(filtro: 'ninguno' | 'preferidas' | 'liquidez' | 'reloj') {
    this.filtroActivo = filtro;
    if (filtro === 'preferidas') {
      this.facturasFiltradas = this.facturas.filter(f => this.deudoresPreferidos.includes(f.razonSocial));
    } else if (filtro === 'liquidez') {
      this.facturasFiltradas = this.facturas.filter(f => this.deudoresAltaLiquidez.includes(f.razonSocial));
    } else if (filtro === 'reloj') {
      this.facturasFiltradas = [...this.facturas].sort((a, b) => a.tiempoRestante - b.tiempoRestante);
    } else {
      this.facturasFiltradas = [...this.facturas];
    }
  }

  onSeleccionar(factura: FacturaMarketplace) {
    this.seleccionarFactura.emit(factura);
  }
}
