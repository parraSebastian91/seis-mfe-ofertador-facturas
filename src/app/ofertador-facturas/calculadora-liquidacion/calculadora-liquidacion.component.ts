import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OverlayCambiosComponent } from '../overlay-cambios/overlay-cambios.component';
import { CambioFactura } from '../servicios/cambios-factura.service';

@Component({
  selector: 'app-calculadora-liquidacion',
  templateUrl: './calculadora-liquidacion.component.html',
  styleUrls: ['./calculadora-liquidacion.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, OverlayCambiosComponent]
})
export class CalculadoraLiquidacionComponent implements OnChanges {
  @Input() montoFactura = 12500000;
  @Input() cupoDisponible = 2000000;
  @Input() tasaMaxima = 3.5;
  @Input() mejorTasaMercado: number | null = 2.20;
  @Input() hayOfertasCompetidoras = true;
  @Input() mostrarOverlayCambios = false;
  @Input() cambioActual: CambioFactura | null = null;

  porcentajeAnticipo = 100;
  tasaInteres = 2.35;
  comisionEstructuracion = 0;
  gastosOperacionales = 0;
  gastoContrato = 0;
  gastoApertura = 0;

  montoAnticipar = 0;
  excedenteRetenido = 0;
  advertenciaCupo = '';
  
  // Match & Beat
  diferencialCompetitivo = 0.05;
  tasaMinimaSistema = 0.50;
  mensajeMatchAndBeat = '';
  mostrarMensajeMatchAndBeat = false;

  ngOnInit() {
    this.recalcular();
  }

  ngOnChanges() {
    this.recalcular();
  }

  onInputChange() {
    this.recalcular();
  }

  onSliderChange(event: any) {
    this.porcentajeAnticipo = +event.target.value;
    this.recalcular();
  }

  recalcular() {
    if (!this.porcentajeAnticipo || this.porcentajeAnticipo < 10) this.porcentajeAnticipo = 10;
    if (this.porcentajeAnticipo > 100) this.porcentajeAnticipo = 100;
    if (!this.tasaInteres || this.tasaInteres < 0) this.tasaInteres = 0;
    if (this.tasaInteres > this.tasaMaxima) this.tasaInteres = this.tasaMaxima;
    this.comisionEstructuracion = Math.max(0, +this.comisionEstructuracion || 0);
    this.gastosOperacionales = Math.max(0, +this.gastosOperacionales || 0);
    this.gastoContrato = Math.max(0, +this.gastoContrato || 0);
    this.gastoApertura = Math.max(0, +this.gastoApertura || 0);

    this.montoAnticipar = Math.round(this.montoFactura * (this.porcentajeAnticipo / 100));
    this.excedenteRetenido = this.montoFactura - this.montoAnticipar;

    if (this.montoAnticipar > this.cupoDisponible) {
      this.advertenciaCupo = `Advertencia: Tu oferta de $${this.montoAnticipar.toLocaleString()} supera el cupo disponible de $${this.cupoDisponible.toLocaleString()} para este deudor.`;
    } else {
      this.advertenciaCupo = '';
    }
    
    this.mostrarMensajeMatchAndBeat = false;
  }

  matchAndBeat() {
    if (!this.hayOfertasCompetidoras || this.mejorTasaMercado === null) {
      this.mensajeMatchAndBeat = 'No hay ofertas activas para esta factura.';
      this.mostrarMensajeMatchAndBeat = true;
      return;
    }

    const tasaTarget = this.mejorTasaMercado - this.diferencialCompetitivo;

    // Verificar si ya es competitiva
    const tasaCompetitiva = this.mejorTasaMercado - this.diferencialCompetitivo;
    if (this.tasaInteres <= tasaCompetitiva) {
      this.mensajeMatchAndBeat = 'Tu tasa ya es la más competitiva del mercado.';
      this.mostrarMensajeMatchAndBeat = true;
      return;
    }

    // Validar si la tasa resultante sería negativa o menor que la mínima
    if (tasaTarget < this.tasaMinimaSistema) {
      this.tasaInteres = this.tasaMinimaSistema;
      this.mensajeMatchAndBeat = `Se ajustó a la tasa mínima permitida: ${this.tasaMinimaSistema}%`;
      this.mostrarMensajeMatchAndBeat = true;
    } else {
      this.tasaInteres = Math.round(tasaTarget * 100) / 100;
      this.mensajeMatchAndBeat = `Tasa actualizada a ${this.tasaInteres}%`;
      this.mostrarMensajeMatchAndBeat = true;
    }

    this.recalcular();
    setTimeout(() => {
      this.mostrarMensajeMatchAndBeat = false;
    }, 3000);
  }

  obtenerTooltipMatchAndBeat(): string {
    if (!this.hayOfertasCompetidoras) {
      return 'No hay ofertas activas para esta factura.';
    }
    if (this.mejorTasaMercado !== null && this.tasaInteres <= (this.mejorTasaMercado - this.diferencialCompetitivo)) {
      return 'Tu tasa ya es la más competitiva del mercado.';
    }
    return 'Iguala y supera la mejor tasa del mercado automáticamente';
  }
}
