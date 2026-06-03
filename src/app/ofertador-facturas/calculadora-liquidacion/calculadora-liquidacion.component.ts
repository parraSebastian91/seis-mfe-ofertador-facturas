import {
  Component, Input, Output, EventEmitter, OnChanges, OnInit,
  SimpleChanges, ChangeDetectionStrategy, inject, signal, computed, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OverlayCambiosComponent } from '../overlay-cambios/overlay-cambios.component';
import { CambioFactura } from '../servicios/cambios-factura.service';
import { CalculadoraConfigService } from './calculadora-config.service';

// ─── Interfaz pública ─────────────────────────────────────────────────────────

export interface LiquidacionCalculada {
  porcentajeAnticipo: number;
  tasaInteres: number;
  comisionEstructuracion: number;
  gastosOperacionales: number;
  gastoContrato: number;
  gastoApertura: number;
  montoAnticipado: number;
  excedenteRetenido: number;
  interes: number;
  subtotalGastos: number;
  iva: number;
  giroLiquido: number;
  margenBruto: number;
  plazoDias: number;
  vencida: boolean;
}

@Component({
  selector: 'app-calculadora-liquidacion',
  templateUrl: './calculadora-liquidacion.component.html',
  styleUrls: ['./calculadora-liquidacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, OverlayCambiosComponent]
})
export class CalculadoraLiquidacionComponent implements OnInit, OnChanges {

  @Input() montoFactura = 0;
  /** Plazo en días corridos hasta el vencimiento */
  @Input() plazoDias = 0;
  /** ID de la factura seleccionada — cambio aquí resetea el formulario (EB-03) */
  @Input() facturaId: string | null = null;
  @Input() mejorTasaMercado: number | null = null;
  @Input() hayOfertasCompetidoras = false;
  @Input() mostrarOverlayCambios = false;
  @Input() cambioActual: CambioFactura | null = null;

  /** Emite la liquidación completa calculada en tiempo real */
  @Output() readonly liquidacionChange = new EventEmitter<LiquidacionCalculada | null>();

  // ─── Signals para los 6 inputs del formulario (CA-05) ─────────────────────
  readonly pctAnticipo = signal<number>(100);
  readonly tasa = signal<number>(0);
  readonly comision = signal<number>(0);
  readonly gastosOp = signal<number>(0);
  readonly gContrato = signal<number>(0);
  readonly gApertura = signal<number>(0);

  // Signals internos para los @Inputs que afectan cómputos
  private readonly montoFacturaS = signal<number>(0);
  private readonly plazoDiasS = signal<number>(0);

  // ─── Computeds reactivos (CA-05, CA-06) ───────────────────────────────────
  readonly montoAnticipado = computed(() =>
    Math.round(this.montoFacturaS() * (this.pctAnticipo() / 100))
  );

  readonly excedenteRetenido = computed(() =>
    this.montoFacturaS() - this.montoAnticipado()
  );

  readonly interes = computed(() =>
    Math.round(this.montoAnticipado() * (this.tasa() / 100) * (this.plazoDiasS() / 30))
  );

  readonly subtotalGastos = computed(() =>
    this.comision() + this.gastosOp() + this.gContrato() + this.gApertura()
  );

  // IVA: solo sobre gastos, NUNCA sobre el interés (regla tributaria CL — EB-02)
  readonly iva = computed(() =>
    this.subtotalGastos() > 0 ? Math.round(this.subtotalGastos() * 0.19) : 0
  );

  readonly giroLiquido = computed(() =>
    this.montoAnticipado() - this.interes() - this.subtotalGastos() - this.iva()
  );

  readonly margenBruto = computed(() =>
    this.interes() + this.subtotalGastos() + this.iva()
  );

  readonly vencida = computed(() => this.plazoDiasS() <= 0);

  // ─── Estado Match & Beat ──────────────────────────────────────────────────
  mensajeMatchAndBeat = '';
  mostrarMensajeMatchAndBeat = false;

  private readonly configSvc = inject(CalculadoraConfigService);

  constructor() {
    // Effect: emite la liquidación al padre cada vez que cualquier computed cambia
    effect(() => {
      if (this.montoFacturaS() === 0) {
        this.liquidacionChange.emit(null);
        return;
      }
      this.liquidacionChange.emit({
        porcentajeAnticipo: this.pctAnticipo(),
        tasaInteres: this.tasa(),
        comisionEstructuracion: this.comision(),
        gastosOperacionales: this.gastosOp(),
        gastoContrato: this.gContrato(),
        gastoApertura: this.gApertura(),
        montoAnticipado: this.montoAnticipado(),
        excedenteRetenido: this.excedenteRetenido(),
        interes: this.interes(),
        subtotalGastos: this.subtotalGastos(),
        iva: this.iva(),
        giroLiquido: this.giroLiquido(),
        margenBruto: this.margenBruto(),
        plazoDias: this.plazoDiasS(),
        vencida: this.vencida()
      });
    });
  }

  ngOnInit(): void {
    this.configSvc.cargar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['montoFactura']) {
      this.montoFacturaS.set(this.montoFactura);
    }
    if (changes['plazoDias']) {
      this.plazoDiasS.set(this.plazoDias);
    }
    // Reset al seleccionar una factura diferente (EB-03)
    if (changes['facturaId'] &&
        changes['facturaId'].previousValue !== null &&
        changes['facturaId'].currentValue !== changes['facturaId'].previousValue) {
      this.resetForm();
    }
  }

  // ─── Handlers de template ─────────────────────────────────────────────────

  onPctChange(raw: string | number): void {
    let val = Number(raw);
    if (!val || val < 10) val = 10;
    if (val > 100) val = 100;
    this.pctAnticipo.set(val);
  }

  onTasaChange(raw: string | number): void {
    let val = Number(raw);
    const max = this.configSvc.config.tasaMaxima;
    if (!val || val < 0) val = 0;
    if (val > max) val = max;
    this.tasa.set(Math.round(val * 100) / 100);
  }

  onGastoChange(campo: 'comision' | 'gastosOp' | 'gContrato' | 'gApertura', raw: string | number): void {
    const val = Math.max(0, Number(raw) || 0);
    if (campo === 'comision') this.comision.set(val);
    else if (campo === 'gastosOp') this.gastosOp.set(val);
    else if (campo === 'gContrato') this.gContrato.set(val);
    else this.gApertura.set(val);
  }

  matchAndBeat(): void {
    const cfg = this.configSvc.config;
    if (!this.hayOfertasCompetidoras || this.mejorTasaMercado === null) {
      return;
    }
    const tasaTarget = Math.round((this.mejorTasaMercado - cfg.diferencialMB) * 100) / 100;
    if (this.tasa() <= tasaTarget) {
      this.mensajeMatchAndBeat = 'Tu tasa ya es la más competitiva del mercado.';
      this.mostrarMensajeMatchAndBeat = true;
      this.clearMensaje();
      return;
    }
    const nueva = Math.max(tasaTarget, cfg.tasaMinimaPermitida);
    this.tasa.set(nueva);
    this.mensajeMatchAndBeat = `Tasa actualizada a ${nueva}%`;
    this.mostrarMensajeMatchAndBeat = true;
    this.clearMensaje();
  }

  obtenerTooltipMatchAndBeat(): string {
    if (!this.hayOfertasCompetidoras) return 'No hay ofertas activas para esta factura.';
    const cfg = this.configSvc.config;
    if (this.mejorTasaMercado !== null && this.tasa() <= this.mejorTasaMercado - cfg.diferencialMB) {
      return 'Tu tasa ya es la más competitiva.';
    }
    return 'Iguala y supera la mejor tasa del mercado automáticamente';
  }

  get tasaMaxima(): number {
    return this.configSvc.config.tasaMaxima;
  }

  private resetForm(): void {
    this.pctAnticipo.set(100);
    this.tasa.set(0);
    this.comision.set(0);
    this.gastosOp.set(0);
    this.gContrato.set(0);
    this.gApertura.set(0);
    this.mostrarMensajeMatchAndBeat = false;
  }

  private clearMensaje(): void {
    setTimeout(() => {
      this.mostrarMensajeMatchAndBeat = false;
    }, 3000);
  }
}

