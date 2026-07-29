import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs/internal/Subscription';
import {
  GlobalOfertadorAsideComponent,
  FacturaGlobalPool,
} from '../global-ofertador-aside/global-ofertador-aside.component';
import { CardComponent, CardTitleDirective } from 'shared-utils';
import {
  SeisDataTableComponent,
  SeisTableCellDirective,
  SeisTableColumn,
  SeisTableRowAction,
  SeisTableActionEvent,
} from '../seis-data-table/seis-data-table.component';


@Component({
  selector: 'app-global-ofertador-facturas',
  templateUrl: './global-ofertador-facturas.component.html',
  styleUrl: './global-ofertador-facturas.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    FormsModule,
    GlobalOfertadorAsideComponent,
    CardComponent,
    CardTitleDirective,
    SeisDataTableComponent,
    SeisTableCellDirective,
  ],
})
export class GlobalOfertadorFacturasComponent implements OnInit, OnDestroy {
  // --- Signals para el Estado (Angular 16+) ---
  public facturas = signal<FacturaGlobalPool[]>([]);
  public facturaSeleccionada = signal<FacturaGlobalPool | null>(null);

  // Filtros activos
  public filtroDeudor = signal<string>('Todos');
  public soloTicketsGrandes = signal<boolean>(false);
  public busquedaTexto = signal<string>('');

  private sseSubscription!: Subscription;

  // ─── Configuración de la grilla ─────────────────────────────────────────

  readonly tableColumns: SeisTableColumn[] = [
    { key: 'emisor',     header: 'Emisor (PYME)' },
    { key: 'deudorName', header: 'Deudor (Pagador)', sortable: true },
    { key: 'folio',      header: 'Folio',            sortable: true, width: '100px' },
    { key: 'montoTotal', header: 'Monto Total',      sortable: true, align: 'right' },
    { key: 'vencimiento',header: 'Vencimiento',      sortable: true, width: '120px' },
  ];

  readonly tableRowActions: SeisTableRowAction[] = [
    { key: 'asignar',  label: 'Asignar a mi Cartera', icon: '📥' },
    { key: 'detalle',  label: 'Ver Detalles',          icon: '🔍' },
  ];

  readonly rowHighlightFn = (row: FacturaGlobalPool): boolean =>
    row.id === this.facturaSeleccionada()?.id;

  readonly rowClassFn = (row: FacturaGlobalPool): string | null =>
    row.montoTotal >= 20_000_000 ? 'ticket-alto' : null;

  // --- Computed Signals (Filtros en tiempo real sin recargar) ---
  public facturasFiltradas = computed(() => {
    return this.facturas().filter((f) => {
      const cumpleDeudor =
        this.filtroDeudor() === 'Todos' || f.deudorName === this.filtroDeudor();
      const cumpleTicket =
        !this.soloTicketsGrandes() || f.montoTotal >= 20000000;
      const cumpleTexto =
        f.emisorName
          .toLowerCase()
          .includes(this.busquedaTexto().toLowerCase()) ||
        f.deudorName
          .toLowerCase()
          .includes(this.busquedaTexto().toLowerCase()) ||
        f.folio.toString().includes(this.busquedaTexto());

      return cumpleDeudor && cumpleTicket && cumpleTexto;
    });
  });

  public totalMontoPool = computed(() => {
    return this.facturasFiltradas().reduce(
      (acc, curr) => acc + curr.montoTotal,
      0,
    );
  });

  ngOnInit(): void {
    this.cargarPoolInicial();
    this.conectarRealTimeSSE();
  }

  ngOnDestroy(): void {
    if (this.sseSubscription) this.sseSubscription.unsubscribe();
  }

  private cargarPoolInicial(): void {
    // Aquí harías el fetch HTTP inicial al BFF (NestJS -> Redis ZRANGE)
    // Dejamos un mock con la estructura exacta para pruebas visuales
    this.facturas.set([
      {
        id: 'fac_1',
        folio: 1024,
        rutEmisor: '76.123.456-K',
        emisorName: 'Pyme Tech SpA',
        rutDeudor: '76.000.111-2',
        deudorName: 'Walmart Chile',
        montoNeto: 37815126,
        montoTotal: 45000000,
        vencimiento: '2026-08-15',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: true,
          plataformasDetectadas: ['Cumplo'],
          ejecutivasMirandoActualmente: 3,
        },
      },
      {
        id: 'fac_2',
        folio: 8432,
        rutEmisor: '77.987.654-3',
        emisorName: 'TransCl S.A.',
        rutDeudor: '76.222.333-4',
        deudorName: 'Agrosuper',
        montoNeto: 10504201,
        montoTotal: 12500000,
        vencimiento: '2026-09-01',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: false,
          plataformasDetectadas: [],
          ejecutivasMirandoActualmente: 0,
        },
      },
      {
        id: 'fac_1',
        folio: 1024,
        rutEmisor: '76.123.456-K',
        emisorName: 'Pyme Tech SpA',
        rutDeudor: '76.000.111-2',
        deudorName: 'Walmart Chile',
        montoNeto: 37815126,
        montoTotal: 45000000,
        vencimiento: '2026-08-15',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: true,
          plataformasDetectadas: ['Cumplo'],
          ejecutivasMirandoActualmente: 3,
        },
      },
      {
        id: 'fac_2',
        folio: 8432,
        rutEmisor: '77.987.654-3',
        emisorName: 'TransCl S.A.',
        rutDeudor: '76.222.333-4',
        deudorName: 'Agrosuper',
        montoNeto: 10504201,
        montoTotal: 12500000,
        vencimiento: '2026-09-01',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: false,
          plataformasDetectadas: [],
          ejecutivasMirandoActualmente: 0,
        },
      },
      {
        id: 'fac_1',
        folio: 1024,
        rutEmisor: '76.123.456-K',
        emisorName: 'Pyme Tech SpA',
        rutDeudor: '76.000.111-2',
        deudorName: 'Walmart Chile',
        montoNeto: 37815126,
        montoTotal: 45000000,
        vencimiento: '2026-08-15',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: true,
          plataformasDetectadas: ['Cumplo'],
          ejecutivasMirandoActualmente: 3,
        },
      },
      {
        id: 'fac_2',
        folio: 8432,
        rutEmisor: '77.987.654-3',
        emisorName: 'TransCl S.A.',
        rutDeudor: '76.222.333-4',
        deudorName: 'Agrosuper',
        montoNeto: 10504201,
        montoTotal: 12500000,
        vencimiento: '2026-09-01',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: false,
          plataformasDetectadas: [],
          ejecutivasMirandoActualmente: 0,
        },
      },
      {
        id: 'fac_1',
        folio: 1024,
        rutEmisor: '76.123.456-K',
        emisorName: 'Pyme Tech SpA',
        rutDeudor: '76.000.111-2',
        deudorName: 'Walmart Chile',
        montoNeto: 37815126,
        montoTotal: 45000000,
        vencimiento: '2026-08-15',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: true,
          plataformasDetectadas: ['Cumplo'],
          ejecutivasMirandoActualmente: 3,
        },
      },
      {
        id: 'fac_2',
        folio: 8432,
        rutEmisor: '77.987.654-3',
        emisorName: 'TransCl S.A.',
        rutDeudor: '76.222.333-4',
        deudorName: 'Agrosuper',
        montoNeto: 10504201,
        montoTotal: 12500000,
        vencimiento: '2026-09-01',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: false,
          plataformasDetectadas: [],
          ejecutivasMirandoActualmente: 0,
        },
      },
      {
        id: 'fac_1',
        folio: 1024,
        rutEmisor: '76.123.456-K',
        emisorName: 'Pyme Tech SpA',
        rutDeudor: '76.000.111-2',
        deudorName: 'Walmart Chile',
        montoNeto: 37815126,
        montoTotal: 45000000,
        vencimiento: '2026-08-15',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: true,
          plataformasDetectadas: ['Cumplo'],
          ejecutivasMirandoActualmente: 3,
        },
      },
      {
        id: 'fac_2',
        folio: 8432,
        rutEmisor: '77.987.654-3',
        emisorName: 'TransCl S.A.',
        rutDeudor: '76.222.333-4',
        deudorName: 'Agrosuper',
        montoNeto: 10504201,
        montoTotal: 12500000,
        vencimiento: '2026-09-01',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: false,
          plataformasDetectadas: [],
          ejecutivasMirandoActualmente: 0,
        },
      },
      {
        id: 'fac_1',
        folio: 1024,
        rutEmisor: '76.123.456-K',
        emisorName: 'Pyme Tech SpA',
        rutDeudor: '76.000.111-2',
        deudorName: 'Walmart Chile',
        montoNeto: 37815126,
        montoTotal: 45000000,
        vencimiento: '2026-08-15',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: true,
          plataformasDetectadas: ['Cumplo'],
          ejecutivasMirandoActualmente: 3,
        },
      },
      {
        id: 'fac_2',
        folio: 8432,
        rutEmisor: '77.987.654-3',
        emisorName: 'TransCl S.A.',
        rutDeudor: '76.222.333-4',
        deudorName: 'Agrosuper',
        montoNeto: 10504201,
        montoTotal: 12500000,
        vencimiento: '2026-09-01',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: false,
          plataformasDetectadas: [],
          ejecutivasMirandoActualmente: 0,
        },
      },
      {
        id: 'fac_1',
        folio: 1024,
        rutEmisor: '76.123.456-K',
        emisorName: 'Pyme Tech SpA',
        rutDeudor: '76.000.111-2',
        deudorName: 'Walmart Chile',
        montoNeto: 37815126,
        montoTotal: 45000000,
        vencimiento: '2026-08-15',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: true,
          plataformasDetectadas: ['Cumplo'],
          ejecutivasMirandoActualmente: 3,
        },
      },
      {
        id: 'fac_2',
        folio: 8432,
        rutEmisor: '77.987.654-3',
        emisorName: 'TransCl S.A.',
        rutDeudor: '76.222.333-4',
        deudorName: 'Agrosuper',
        montoNeto: 10504201,
        montoTotal: 12500000,
        vencimiento: '2026-09-01',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: false,
          plataformasDetectadas: [],
          ejecutivasMirandoActualmente: 0,
        },
      },
      {
        id: 'fac_1',
        folio: 1024,
        rutEmisor: '76.123.456-K',
        emisorName: 'Pyme Tech SpA',
        rutDeudor: '76.000.111-2',
        deudorName: 'Walmart Chile',
        montoNeto: 37815126,
        montoTotal: 45000000,
        vencimiento: '2026-08-15',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: true,
          plataformasDetectadas: ['Cumplo'],
          ejecutivasMirandoActualmente: 3,
        },
      },
      {
        id: 'fac_2',
        folio: 8432,
        rutEmisor: '77.987.654-3',
        emisorName: 'TransCl S.A.',
        rutDeudor: '76.222.333-4',
        deudorName: 'Agrosuper',
        montoNeto: 10504201,
        montoTotal: 12500000,
        vencimiento: '2026-09-01',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: false,
          plataformasDetectadas: [],
          ejecutivasMirandoActualmente: 0,
        },
      },
      {
        id: 'fac_1',
        folio: 1024,
        rutEmisor: '76.123.456-K',
        emisorName: 'Pyme Tech SpA',
        rutDeudor: '76.000.111-2',
        deudorName: 'Walmart Chile',
        montoNeto: 37815126,
        montoTotal: 45000000,
        vencimiento: '2026-08-15',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: true,
          plataformasDetectadas: ['Cumplo'],
          ejecutivasMirandoActualmente: 3,
        },
      },
      {
        id: 'fac_2',
        folio: 8432,
        rutEmisor: '77.987.654-3',
        emisorName: 'TransCl S.A.',
        rutDeudor: '76.222.333-4',
        deudorName: 'Agrosuper',
        montoNeto: 10504201,
        montoTotal: 12500000,
        vencimiento: '2026-09-01',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: false,
          plataformasDetectadas: [],
          ejecutivasMirandoActualmente: 0,
        },
      },
      {
        id: 'fac_1',
        folio: 1024,
        rutEmisor: '76.123.456-K',
        emisorName: 'Pyme Tech SpA',
        rutDeudor: '76.000.111-2',
        deudorName: 'Walmart Chile',
        montoNeto: 37815126,
        montoTotal: 45000000,
        vencimiento: '2026-08-15',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: true,
          plataformasDetectadas: ['Cumplo'],
          ejecutivasMirandoActualmente: 3,
        },
      },
      {
        id: 'fac_2',
        folio: 8432,
        rutEmisor: '77.987.654-3',
        emisorName: 'TransCl S.A.',
        rutDeudor: '76.222.333-4',
        deudorName: 'Agrosuper',
        montoNeto: 10504201,
        montoTotal: 12500000,
        vencimiento: '2026-09-01',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: false,
          plataformasDetectadas: [],
          ejecutivasMirandoActualmente: 0,
        },
      },
      {
        id: 'fac_1',
        folio: 1024,
        rutEmisor: '76.123.456-K',
        emisorName: 'Pyme Tech SpA',
        rutDeudor: '76.000.111-2',
        deudorName: 'Walmart Chile',
        montoNeto: 37815126,
        montoTotal: 45000000,
        vencimiento: '2026-08-15',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: true,
          plataformasDetectadas: ['Cumplo'],
          ejecutivasMirandoActualmente: 3,
        },
      },
      {
        id: 'fac_2',
        folio: 8432,
        rutEmisor: '77.987.654-3',
        emisorName: 'TransCl S.A.',
        rutDeudor: '76.222.333-4',
        deudorName: 'Agrosuper',
        montoNeto: 10504201,
        montoTotal: 12500000,
        vencimiento: '2026-09-01',
        fechaPublicacion: new Date().toISOString(),
        competencia: {
          estaEnOtrasPlataformas: false,
          plataformasDetectadas: [],
          ejecutivasMirandoActualmente: 0,
        },
      },
    ]);
  }

  private conectarRealTimeSSE(): void {
    // Aquí te conectas al endpoint SSE de tu NestJS
    // Cuando llegue una nueva factura del OCR de Rust:
    // this.facturas.update(lista => [nuevaFactura, ...lista]);
  }

  // --- Acciones de Interacción ---

  public seleccionarFactura(factura: FacturaGlobalPool): void {
    // Al hacer clic en la fila de la grilla, abrimos el Aside Lateral
    this.facturaSeleccionada.set(factura);
  }

  public cerrarAside(): void {
    this.facturaSeleccionada.set(null);
  }

  public capturarFactura(factura: FacturaGlobalPool): void {
    // 1. Aquí disparas el HTTP PATCH a NestJS para mover los índices en Redis (SREM/ZADD)
    console.log(
      `Asignando la factura ${factura.folio} a la ejecutiva actual...`,
    );

    // 2. UI Optimista: Desvanecemos y removemos de la Mesa Global de inmediato
    this.cerrarAside();

    // Le damos un pequeño delay para que el Aside empiece a cerrarse antes de quitar la fila
    setTimeout(() => {
      this.facturas.update((lista) => lista.filter((f) => f.id !== factura.id));
    }, 150);
  }

  // --- Helpers ---
  public calcularDiasVencimiento(fechaVencimiento: string): number {
    const diff = new Date(fechaVencimiento).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  public onTableAction(event: SeisTableActionEvent): void {
    const factura = event.row as FacturaGlobalPool;
    if (event.actionKey === 'asignar') {
      this.capturarFactura(factura);
    } else if (event.actionKey === 'detalle') {
      this.seleccionarFactura(factura);
    }
  }
}
