import {
  Component, Input, Output, EventEmitter, OnChanges, OnInit, OnDestroy,
  SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  FacturaDetalleHeaderService,
  FacturaDetalleData,
  HistorialEjecutivo,
  CupoDeudorDetalle
} from './factura-detalle-header.service';
import { FacturaMarketplace } from '../facturas-marketplace/facturas-marketplace.service';

@Component({
  selector: 'app-kpis-factura-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './kpis-factura-header.component.html',
  styleUrl: './kpis-factura-header.component.scss'
})
export class KpisFacturaHeaderComponent implements OnChanges, OnInit, OnDestroy {

  @Input() factura: FacturaMarketplace | null = null;
  /** Monto anticipado en tiempo real desde la calculadora (CA-04) */
  @Input() montoAnticipar = 0;
  /** Emite true cuando el monto anticipado supera el cupo disponible */
  @Output() readonly cupoExcedido = new EventEmitter<boolean>();

  protected detalle: FacturaDetalleData | null = null;
  protected historial: HistorialEjecutivo | null = null;
  protected cupo: CupoDeudorDetalle | null = null;
  protected isLoadingDetalle = false;
  protected isLoadingHistorial = false;
  protected isLoadingCupo = false;
  protected errorHistorial = false;

  private lastClienteId = '';
  private readonly destroy$ = new Subject<void>();
  private readonly svc = inject(FacturaDetalleHeaderService);
  private readonly cdRef = inject(ChangeDetectorRef);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['factura'] && this.factura) {
      // Usamos facturaId como clienteId provisional hasta tener endpoint real
      const clienteId = this.factura.facturaId;
      this.lastClienteId = clienteId;
      this.svc.cargar(this.factura.facturaId, clienteId, this.factura.rutDeudor);
    }
    if (changes['factura'] && !this.factura) {
      this.svc.reset();
    }
    if (changes['montoAnticipar']) {
      this.evaluarCupoExcedido();
    }
  }

  ngOnInit(): void {
    this.svc.detalle$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.detalle = data;
      this.cdRef.markForCheck();
    });
    this.svc.historial$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.historial = data;
      this.cdRef.markForCheck();
    });
    this.svc.cupo$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.cupo = data;
      this.evaluarCupoExcedido();
      this.cdRef.markForCheck();
    });
    this.svc.isLoadingDetalle$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.isLoadingDetalle = v;
      this.cdRef.markForCheck();
    });
    this.svc.isLoadingHistorial$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.isLoadingHistorial = v;
      this.cdRef.markForCheck();
    });
    this.svc.isLoadingCupo$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.isLoadingCupo = v;
      this.cdRef.markForCheck();
    });
    this.svc.errorHistorial$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.errorHistorial = v;
      this.cdRef.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected get diasAlVencimiento(): number {
    if (!this.factura) return 0;
    const hoy = new Date();
    const venc = new Date(this.factura.fechaVencimiento);
    const diff = venc.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  protected get porcentajeCupoUsado(): number {
    if (!this.cupo || this.cupo.cupoTotal === 0) return 100;
    return Math.min(100, Math.round((this.cupo.cupoUtilizado / this.cupo.cupoTotal) * 100));
  }

  protected get colorBarraCupo(): 'verde' | 'amarillo' | 'naranja' | 'rojo' {
    const p = this.porcentajeCupoUsado;
    if (p <= 50) return 'verde';
    if (p <= 74) return 'amarillo';
    if (p <= 89) return 'naranja';
    return 'rojo';
  }

  protected get alertaCupoExcedido(): boolean {
    if (!this.cupo || this.montoAnticipar === 0) return false;
    return this.montoAnticipar > this.cupo.cupoDisponible;
  }

  protected retryHistorial(): void {
    this.svc.retryHistorial(this.lastClienteId);
  }

  private evaluarCupoExcedido(): void {
    this.cupoExcedido.emit(this.alertaCupoExcedido);
  }
}
