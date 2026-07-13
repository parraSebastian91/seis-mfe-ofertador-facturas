import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FacturaGlobalPool {
  id: string;
  folio: number;
  rutEmisor: string;
  emisorName: string;
  rutDeudor: string;
  deudorName: string;
  montoNeto: number;
  montoTotal: number;
  vencimiento: string;
  fechaPublicacion: string;
  competencia: {
    estaEnOtrasPlataformas: boolean;
    plataformasDetectadas: string[];
    ejecutivasMirandoActualmente: number;
  };
}

@Component({
  selector: 'app-global-ofertador-aside',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-ofertador-aside.component.html',
  styleUrl: './global-ofertador-aside.component.scss',
})
export class GlobalOfertadorAsideComponent {
  @Input() factura: FacturaGlobalPool | null = null;
  @Input() abierto: boolean = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() capturar = new EventEmitter<FacturaGlobalPool>();
}
