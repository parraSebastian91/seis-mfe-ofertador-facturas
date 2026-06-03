import { Component, Input, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidacionCalculada } from '../calculadora-liquidacion/calculadora-liquidacion.component';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule]
})
export class PreLiquidacionComponent {
  /** Liquidación calculada completa desde CalculadoraLiquidacionComponent */
  @Input() liquidacion: LiquidacionCalculada | null = null;
  @Input() permitirEnvio = true;
  @Output() readonly enviarOferta = new EventEmitter<SolicitudEnvioOferta>();

  onEnviarOferta(): void {
    if (!this.liquidacion) return;
    this.enviarOferta.emit({
      montoTransferencia: this.liquidacion.montoAnticipado,
      excedenteRetenido: this.liquidacion.excedenteRetenido,
      ganancia: this.liquidacion.margenBruto,
      plazo: this.liquidacion.plazoDias
    });
  }
}

