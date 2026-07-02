import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisorDocumentalComponent } from '../visor-documental/visor-documental.component';
import { AdjuntoItem, AdjuntosListComponent } from 'shared-utils';
import {
  CalculadoraLiquidacionComponent,
  LiquidacionCalculada,
} from '../calculadora-liquidacion/calculadora-liquidacion.component';
import {
  PreLiquidacionComponent,
  SolicitudEnvioOferta,
} from '../pre-liquidacion/pre-liquidacion.component';
import { CambioFactura } from '../servicios/cambios-factura.service';

export interface FacturaSeleccionada {
  facturaId: string;
  folio: string;
  razonSocial: string;
  status: string;
  deudorName: string;
  deudorRut: string;
  montoNeto: number;
  montoTotal: number;
  /** Alias de montoTotal — requerido por CalculadoraLiquidacionComponent */
  monto: number;
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
  imports: [FormsModule, DecimalPipe, VisorDocumentalComponent, AdjuntosListComponent, CalculadoraLiquidacionComponent, PreLiquidacionComponent],
  templateUrl: './ofertador-aside.component.html',
  styleUrl: './ofertador-aside.component.scss',
})
export class OfertadorAsideComponent implements OnChanges {
  @Input() factura: FacturaSeleccionada | null = null;
  @Input() cliente: LeadsMarketplace | null = null;
  @Input() abierto: boolean = false;
  @Input() urlDocumento: string | null = null;
  @Input() adjuntos: AdjuntoItem[] = [];
  @Input() mejorTasaMercado: number | null = null;
  @Input() hayOfertasCompetidoras = false;
  @Input() mostrarOverlayCambios = false;
  @Input() cambioActual: CambioFactura | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() ofertaEnviada = new EventEmitter<SolicitudEnvioOferta>();

  visorAbierto = false;

  // ── Stepper (3 pasos) ────────────────────────────────────────────────────
  readonly pasos = [
    { numero: 1, label: 'Factura',      icono: '📋' },
    { numero: 2, label: 'Calculadora',  icono: '🧮' },
    { numero: 3, label: 'Liquidación',  icono: '🚀' },
  ] as const;
  stepActual = 1;

  // Estado interno de la liquidación
  liquidacion: LiquidacionCalculada | null = null;
  montoAnticipar = 0;
  facturaDisponible = true;
  cupoExcedido = false;

  /** Adjunto actualmente seleccionado para el visor */
  selectedAdjuntoId: string | null = null;
  loadingAdjuntoId: string | null = null;

  /** Alias de acceso para bindings del template (↔ calculadora) */
  get facturaSeleccionada(): FacturaSeleccionada | null {
    return this.factura;
  }

  get plazoDias(): number {
    return this.factura?.diasAlVencimiento ?? 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['factura'] && this.factura) {
      this.visorAbierto = false;
      this.liquidacion = null;
      this.montoAnticipar = 0;
      this.facturaDisponible = true;
      this.cupoExcedido = false;
      this.stepActual = 1;
      this.selectedAdjuntoId = null;
    }
    if (changes['abierto'] && !this.abierto) {
      this.visorAbierto = false;
      this.stepActual = 1;
    }
  }

  irAPaso(paso: number): void {
    this.stepActual = Math.max(1, Math.min(paso, this.pasos.length));
  }

  siguiente(): void { this.irAPaso(this.stepActual + 1); }
  anterior(): void  { this.irAPaso(this.stepActual - 1); }

  onAdjuntoSeleccionado(adj: AdjuntoItem): void {
    this.selectedAdjuntoId = adj.id;
    this.urlDocumento = adj.url;
    this.visorAbierto = true;
  }

  toggleVisor(): void {
    this.visorAbierto = !this.visorAbierto;
  }

  cerrarOfertador(): void {
    this.cerrar.emit();
  }

  onEnviarOferta(solicitud: SolicitudEnvioOferta): void {
    this.ofertaEnviada.emit(solicitud);
  }
}
