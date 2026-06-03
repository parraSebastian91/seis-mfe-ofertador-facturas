import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ComparacionCampo {
  campo: string;
  declarado: string;
  ocr: string;
  coincide: boolean;
  alerta?: string;
  prioridad?: 'alta' | 'media' | 'baja';
  noLegible?: boolean;
}

@Component({
  selector: 'app-validador-delta-ocr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './validador-delta-ocr.component.html',
  styleUrls: ['./validador-delta-ocr.component.scss']
})
export class ValidadorDeltaOcrComponent {
  @Input() comparaciones: ComparacionCampo[] = [];

  todosCoinciden(): boolean {
    return this.comparaciones.length > 0 && this.comparaciones.every(c => c.coincide);
  }

  obtenerMensajeResumen(): string {
    if (this.todosCoinciden()) {
      return 'Todos los campos coinciden correctamente';
    }
    const sinCoincidencias = this.comparaciones.filter(c => !c.coincide && !c.noLegible);
    return `${sinCoincidencias.length} campo(s) con discrepancias`;
  }
}
