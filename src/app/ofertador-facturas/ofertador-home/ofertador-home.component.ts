import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FacturaMarketplace, FacturasMarketplaceService } from '../facturas-marketplace/facturas-marketplace.service';
import { CambiosFacturaService, CambioFactura } from '../servicios/cambios-factura.service';
import { ToastService } from '../servicios/toast.service';
import { ResumenOferta, ModalConfirmacionOfertaComponent } from '../modal-confirmacion-oferta/modal-confirmacion-oferta.component';
import { SolicitudEnvioOferta, PreLiquidacionComponent } from '../pre-liquidacion/pre-liquidacion.component';
import { FacturasMarketplaceComponent } from '../facturas-marketplace/facturas-marketplace.component';
import { CalculadoraLiquidacionComponent } from '../calculadora-liquidacion/calculadora-liquidacion.component';
import { ToastContainerComponent } from '../toast-container/toast-container.component';
import { VisorDocumentalComponent } from '../visor-documental/visor-documental.component';
import { ValidadorDeltaOcrComponent } from '../validador-delta-ocr/validador-delta-ocr.component';
import { KpisFacturaHeaderComponent } from '../kpis-factura-header/kpis-factura-header.component';
import { OcrNotesListComponent, OcrNota } from 'shared-utils';

@Component({
  selector: 'app-ofertador-home',
  templateUrl: './ofertador-home.component.html',
  styleUrl: './ofertador-home.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FacturasMarketplaceComponent,
    CalculadoraLiquidacionComponent,
    PreLiquidacionComponent,
    ModalConfirmacionOfertaComponent,
    ToastContainerComponent,
    VisorDocumentalComponent,
    ValidadorDeltaOcrComponent,
    KpisFacturaHeaderComponent,
    OcrNotesListComponent
  ]
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
  facturaSeleccionada: FacturaMarketplace | null = null;
  urlDocumento: string | null = null;
  loadingDoc = false;
  errorDoc = false;
  comparacionesOcr: any[] = [];
  notasOcr: OcrNota[] = [];
  historialPago: any = null;
  cupoDeudor: any = null;
  cupoAsignado = true;

  // Calculadora → header (CA-04 HU-28)
  montoAnticipar = 0;
  cupoExcedido = false;

  // Match & Beat
  mejorTasaMercado: number | null = null;
  hayOfertasCompetidoras = false;

  // WebSocket Cambios
  mostrarOverlayCambios = false;
  cambioActual: CambioFactura | null = null;

  // Factura retirada overlay (CA-05, HU-27)
  facturaDisponible = true;
  drawerOpen = false;

  // Modal Confirmación
  mostrarModalConfirmacion = false;
  resumenOfertaModal: ResumenOferta | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly facturasService: FacturasMarketplaceService,
    private readonly cambiosService: CambiosFacturaService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit() {
    // ── Marketplace WS (HU-27) ──────────────────────────────────────────────
    this.facturasService.joinChannel();
    this.facturasService.loadInitial();

    this.facturasService.facturaRetirada$.pipe(takeUntil(this.destroy$)).subscribe((facturaId: string) => {
      if (this.facturaSeleccionada?.facturaId === facturaId) {
        this.facturaDisponible = false;
      }
    });

    this.facturasService.miOfertaAceptada$.pipe(takeUntil(this.destroy$)).subscribe((_facturaId: string) => {
      this.toastService.mostrar(
        `¡Tu oferta sobre la factura fue aceptada!`,
        'exito',
        6000
      );
    });

    // ── Cambios de factura (legado) ─────────────────────────────────────────
    this.cambiosService.cambiosPorFactura$
      .pipe(takeUntil(this.destroy$))
      .subscribe((cambio: CambioFactura | null) => {
        if (cambio) {
          this.procesarCambioFactura(cambio);
        }
      });
  }

  ngOnDestroy() {
    this.facturasService.leaveChannel();
    this.destroy$.next();
    this.destroy$.complete();
  }

  seleccionarFactura(factura: FacturaMarketplace) {
    this.facturaSeleccionada = factura;
    this.facturaDisponible = true;
    this.drawerOpen = false;
    this.montoAnticipar = 0;
    this.cupoExcedido = false;
    this.cambiosService.seleccionarFactura(factura.folio);
    this.cargarDocumento(factura);
    this.simularComparacionOcr(factura);
    this.simularMejorTasaMercado(factura);
  }

  private procesarCambioFactura(cambio: CambioFactura) {
    this.cambioActual = cambio;
    this.mostrarOverlayCambios = true;

    if (cambio.tipo === 'retirada') {
      // Bloqueo permanente
      setTimeout(() => {
        this.toastService.mostrar(
          'Esta factura ha sido retirada del marketplace por el cliente.',
          'advertencia',
          5000
        );
      }, 1500);
    } else {
      // Recalcular y desbloquear
      setTimeout(() => {
        this.aplicarCambioFactura(cambio);
        this.mostrarOverlayCambios = false;
        this.cambioActual = null;
        
        this.toastService.mostrar(
          'Los datos de la factura fueron actualizados. Verifica la nueva liquidación antes de ofertar.',
          'info',
          4000
        );
      }, 2000);
    }
  }

  private aplicarCambioFactura(cambio: CambioFactura) {
    if (!this.facturaSeleccionada) return;

    // Actualizar los datos de la factura según el tipo de cambio
    switch (cambio.tipo) {
      case 'monto':
        this.facturaSeleccionada.monto = cambio.valorNuevo;
        break;
      case 'vencimiento':
        // Actualizar fecha de vencimiento (si existiera en la factura)
        break;
      case 'plazo':
        // Actualizar plazo (si existiera en la factura)
        break;
    }

    // Recalcular la pre-liquidación automáticamente (se hace via inputs en el template)
  }

  simularPerfilRiesgo(factura: FacturaMarketplace) {
    // Simulación de historial y cupo
    if (factura.folio === '45903') {
      // Sin historial ni cupo asignado
      this.historialPago = null;
      this.cupoDeudor = null;
      this.cupoAsignado = false;
    } else {
      this.historialPago = {
        promedio: 41,
        desviacion: 3,
        barras: [30, 38, 44, 41, 50, 39, 45]
      };
      this.cupoDeudor = {
        total: 20000000,
        utilizado: 18000000,
        disponible: 2000000
      };
      this.cupoAsignado = true;
    }
  }

  cargarDocumento(factura: FacturaMarketplace) {
    this.loadingDoc = true;
    this.errorDoc = false;
    setTimeout(() => {
      if (Math.random() < 0.1) {
        this.errorDoc = true;
        this.loadingDoc = false;
        this.urlDocumento = null;
      } else {
        this.urlDocumento = 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=document&w=800&q=80';
        this.loadingDoc = false;
      }
    }, 1200);
  }

  simularComparacionOcr(factura: FacturaMarketplace) {
    // Simulación de casos: coincidencia, discrepancia, alerta, no legible
    this.comparacionesOcr = [
      { campo: 'RUT Emisor', declarado: '76.123.456-7', ocr: '76.123.456-7', coincide: true },
      { campo: 'RUT Deudor', declarado: factura.rutDeudor, ocr: factura.rutDeudor, coincide: true },
      { campo: 'Monto Total', declarado: '$12.500.000', ocr: '$12.500.000', coincide: true },
      { campo: 'Fecha Emisión', declarado: '2026-05-19', ocr: '2026-05-19', coincide: true },
      {
        campo: 'Fecha Vencimiento',
        declarado: '2026-06-19',
        ocr: '2026-06-10',
        coincide: false,
        alerta: 'Alerta: El plazo real es menor al declarado. Revisar antes de ofertar.',
        prioridad: 'alta'
      },
      { campo: 'Referencia', declarado: 'N/A', ocr: 'No legible', coincide: false, noLegible: true }
    ];

    // Derivar notasOcr para OcrNotesList (CA-06 HU-28)
    this.notasOcr = this.comparacionesOcr
      .filter((c: any) => !c.coincide)
      .map((c: any): OcrNota => ({
        campo: c.campo,
        descripcion: c.alerta ?? (c.noLegible ? 'Valor no legible en el PDF.' : `PDF: ${c.ocr} / Formulario: ${c.declarado}`),
        prioridad: c.prioridad
      }));
  }

  simularMejorTasaMercado(factura: FacturaMarketplace) {
    // Simulación de mejor tasa del mercado por factura
    const tasasPorFactura: { [key: string]: { tasa: number; hayOfertas: boolean } } = {
      '45900': { tasa: 2.2, hayOfertas: true },
      '45901': { tasa: 2.15, hayOfertas: true },
      '45902': { tasa: 2.5, hayOfertas: true },
      '45903': { tasa: 0, hayOfertas: false }, // Sin ofertas
      '45904': { tasa: 1.95, hayOfertas: true }
    };

    const simulacion = tasasPorFactura[factura.folio];
    if (simulacion) {
      this.mejorTasaMercado = simulacion.tasa;
      this.hayOfertasCompetidoras = simulacion.hayOfertas;
    } else {
      // Default: tasa aleatoria entre 1.90 y 2.50
      this.hayOfertasCompetidoras = true;
      this.mejorTasaMercado = Math.random() * (2.5 - 1.9) + 1.9;
      this.mejorTasaMercado = Math.round(this.mejorTasaMercado * 100) / 100;
    }
  }

  onEnviarOferta(solicitud: SolicitudEnvioOferta) {
    if (!this.facturaSeleccionada) return;

    this.resumenOfertaModal = {
      folioFactura: this.facturaSeleccionada.folio,
      razonSocial: this.facturaSeleccionada.razonSocial,
      montoTransferencia: solicitud.montoTransferencia,
      excedenteRetenido: solicitud.excedenteRetenido,
      gananciaEstimada: solicitud.ganancia,
      plazo: solicitud.plazo
    };

    this.mostrarModalConfirmacion = true;
  }

  onOfertaConfirmada() {
    if (this.resumenOfertaModal) {
      this.toastService.mostrar(
        `¡Oferta enviada! Tu oferta sobre la factura #${this.resumenOfertaModal.folioFactura} ha sido publicada exitosamente.`,
        'exito',
        5000
      );
    }
    
    this.mostrarModalConfirmacion = false;
    this.resumenOfertaModal = null;
    this.facturaSeleccionada = null;
  }

  onOfertaCancelada() {
    this.mostrarModalConfirmacion = false;
  }
}