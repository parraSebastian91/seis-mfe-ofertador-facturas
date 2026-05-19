import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CambioFactura } from '../servicios/cambios-factura.service';

@Component({
  selector: 'app-overlay-cambios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overlay-cambios.component.html',
  styleUrls: ['./overlay-cambios.component.scss']
})
export class OverlayCambiosComponent implements OnInit {
  @Input() mostrar = false;
  @Input() cambio: CambioFactura | null = null;

  ngOnInit() {}

  obtenerMensaje(): string {
    if (!this.cambio) {
      return 'Los datos de la factura han cambiado. Recalculando parámetros...';
    }

    if (this.cambio.tipo === 'retirada') {
      return 'Esta factura ya no está disponible. El cliente la ha retirado del marketplace.';
    }

    return 'Los datos de la factura han cambiado. Recalculando parámetros...';
  }
}
