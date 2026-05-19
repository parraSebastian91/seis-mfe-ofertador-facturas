import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

export interface HistorialPago {
  promedio: number;
  desviacion: number;
  barras: number[];
}

export interface CupoDeudor {
  total: number;
  utilizado: number;
  disponible: number;
}

@Component({
  selector: 'app-perfil-riesgo-deudor',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './perfil-riesgo-deudor.component.html',
  styleUrls: ['./perfil-riesgo-deudor.component.scss']
})
export class PerfilRiesgoDeudorComponent {
  @Input() historial: HistorialPago | null = null;
  @Input() cupo: CupoDeudor | null = null;
  @Input() cupoAsignado = true;

  get porcentajeUso(): number {
    if (!this.cupo) return 0;
    return Math.round((this.cupo.utilizado / this.cupo.total) * 100);
  }

  get colorBarra(): string {
    const p = this.porcentajeUso;
    if (p <= 50) return 'verde';
    if (p <= 74) return 'amarillo';
    if (p <= 89) return 'naranja';
    return 'rojo';
  }
}
