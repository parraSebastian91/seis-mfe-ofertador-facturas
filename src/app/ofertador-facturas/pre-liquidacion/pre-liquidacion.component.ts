import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SolicitudEnvioOferta {
  montoTransferencia: number;
  excedenteRetenido: number;
  ganancia: number;
  plazo: number;
}

@Component({
  selector: 'app-pre-liquidacion',
  templateUrl: './pre-liquidacion.component.html',
  styleUrls: ['./pre-liquidacion.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class PreLiquidacionComponent implements OnChanges {
  @Input() montoFactura = 0;
  @Input() porcentajeAnticipo = 100;
  @Input() tasaInteres = 0;
  @Input() plazoDias = 30;
  @Input() comisionEstructuracion = 0;
  @Input() gastosOperacionales = 0;
  @Input() gastoContrato = 0;
  @Input() gastoApertura = 0;
  @Input() permitirEnvio = true;

  @Output() enviarOferta = new EventEmitter<SolicitudEnvioOferta>();

  montoAnticipado = 0;
  excedenteRetenido = 0;
  interes = 0;
  subtotalGastos = 0;
  iva = 0;
  giroLiquido = 0;
  margenBruto = 0;

  ngOnChanges() {
    this.calcular();
  }

  calcular() {
    this.montoAnticipado = Math.round(this.montoFactura * (this.porcentajeAnticipo / 100));
    this.excedenteRetenido = this.montoFactura - this.montoAnticipado;
    this.interes = Math.round(this.montoAnticipado * (this.tasaInteres / 100) * (this.plazoDias / 30));
    this.subtotalGastos = this.comisionEstructuracion + this.gastosOperacionales + this.gastoContrato + this.gastoApertura;
    this.iva = this.subtotalGastos > 0 ? Math.round(this.subtotalGastos * 0.19) : 0;
    this.giroLiquido = this.montoAnticipado - this.interes - this.subtotalGastos - this.iva;
    this.margenBruto = this.interes;
  }

  onEnviarOferta() {
    this.enviarOferta.emit({
      montoTransferencia: this.montoAnticipado,
      excedenteRetenido: this.excedenteRetenido,
      ganancia: this.margenBruto,
      plazo: this.plazoDias
    });
  }
}
