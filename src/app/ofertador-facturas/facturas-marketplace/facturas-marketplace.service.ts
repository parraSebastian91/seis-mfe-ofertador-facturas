import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { NotificationSocketService } from 'shared-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FacturaMarketplace {
  facturaId: string;
  folio: string;
  razonSocial: string;
  rutDeudor: string;
  monto: number;
  fechaVencimiento: string;
  diasRestantes: number;
  cantidadOfertas: number;
  tasaMinima: number | null;
  esPreferido: boolean;
  tieneOfertaPropia: boolean;
  publicadoEn: string;
  nueva?: boolean;
}

interface MarketplacePage {
  data: FacturaMarketplace[];
  nextCursor: string | null;
  minDiasAltaLiquidez: number;
}

export interface FacturaNuevaExterna {
  facturaId: string;
  razonSocial: string;
  monto: number;
}

type MarketplaceWsEvent =
  | { event: 'factura.publicada'; factura: FacturaMarketplace }
  | { event: 'factura.retirada'; facturaId: string }
  | {
      event: 'oferta.nueva' | 'oferta.modificada';
      facturaId: string;
      cantidadOfertas: number;
      tasaMinima: number | null;
    }
  | { event: 'mi.oferta.aceptada'; facturaId: string }
  | {
      event: 'factura.nueva.externa';
      facturaId: string;
      razonSocial: string;
      monto: number;
    };

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FacturasMarketplaceService implements OnDestroy, OnInit {
  private readonly facturasState = new BehaviorSubject<FacturaMarketplace[]>(
    [],
  );
  private readonly isLoadingState = new BehaviorSubject<boolean>(false);
  private readonly isLoadingMoreState = new BehaviorSubject<boolean>(false);
  private readonly hasMoreState = new BehaviorSubject<boolean>(true);
  private readonly facturaRetirAdaSubject = new Subject<string>();
  private readonly miOfertaAceptadaSubject = new Subject<string>();
  private readonly nuevasExternasState = new BehaviorSubject<
    FacturaNuevaExterna[]
  >([]);

  readonly facturas$ = this.facturasState.asObservable();
  readonly isLoading$ = this.isLoadingState.asObservable();
  readonly isLoadingMore$ = this.isLoadingMoreState.asObservable();
  readonly hasMore$ = this.hasMoreState.asObservable();
  readonly facturaRetirada$ = this.facturaRetirAdaSubject.asObservable();
  readonly miOfertaAceptada$ = this.miOfertaAceptadaSubject.asObservable();
  /** Facturas de clientes que nunca han operado con esta financiera (solo metadata) */
  readonly nuevasExternas$ = this.nuevasExternasState.asObservable();

  minDiasAltaLiquidez = 30;
  private _lastCursor: string | null = null;
  get lastCursor(): string | null {
    return this._lastCursor;
  }
  private channelActive = false;
  private financieraId: string | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly socketService: NotificationSocketService,
  ) {}

  ngOnInit(): void {

  }

  // Arrow fn to preserve `this` reference for add/remove listener
  readonly onWsMessage = (raw: unknown): void => {
    const msg = raw as MarketplaceWsEvent;

    if (msg.event === 'factura.publicada') {
      this.facturasState.next([
        { ...msg.factura, nueva: true },
        ...this.facturasState.value.map((f) => ({ ...f, nueva: false })),
      ]);
    } else if (msg.event === 'factura.retirada') {
      this.facturasState.next(
        this.facturasState.value.filter((f) => f.facturaId !== msg.facturaId),
      );
      this.facturaRetirAdaSubject.next(msg.facturaId);
    } else if (
      msg.event === 'oferta.nueva' ||
      msg.event === 'oferta.modificada'
    ) {
      this.facturasState.next(
        this.facturasState.value.map((f) =>
          f.facturaId === msg.facturaId
            ? {
                ...f,
                cantidadOfertas: msg.cantidadOfertas,
                tasaMinima: msg.tasaMinima,
              }
            : f,
        ),
      );
    } else if (msg.event === 'mi.oferta.aceptada') {
      this.miOfertaAceptadaSubject.next(msg.facturaId);
    }
  };

  // Eventos ligeros de clientes nuevos: solo se agrega al badge, no se carga la factura completa
  private readonly onNewClientEvent = (raw: unknown): void => {
    const msg = raw as MarketplaceWsEvent;
    if (msg.event !== 'factura.nueva.externa') {
      return;
    }
    this.nuevasExternasState.next([
      {
        facturaId: msg.facturaId,
        razonSocial: msg.razonSocial,
        monto: msg.monto,
      },
      ...this.nuevasExternasState.value,
    ]);
  };

  joinChannel(financieraId: string): void {
    if (this.channelActive) {
      return;
    }
    this.channelActive = true;
    this.financieraId = financieraId;
    // Canal principal: el BFF filtra por histórico de relaciones de esta financiera
    this.socketService.sendMessage('join:marketplace:preferidos', {
      financieraId,
    });
    this.socketService.onMessage('marketplace:preferidos', this.onWsMessage);
    // Canal secundario: solo metadata liviana de clientes nuevos → alimenta el badge
    this.socketService.sendMessage('join:marketplace:nuevos', { financieraId });
    this.socketService.onMessage('marketplace:nuevos', this.onNewClientEvent);
  }

  leaveChannel(): void {
    if (!this.channelActive) {
      return;
    }
    this.channelActive = false;
    this.socketService.offMessage('marketplace:preferidos', this.onWsMessage);
    this.socketService.sendMessage('leave:marketplace:preferidos', {
      financieraId: this.financieraId,
    });
    this.socketService.offMessage('marketplace:nuevos', this.onNewClientEvent);
    this.socketService.sendMessage('leave:marketplace:nuevos', {
      financieraId: this.financieraId,
    });
    this.financieraId = null;
  }

  /** Carga inicial: solo facturas de clientes preferidos (histórico de operaciones). Respuesta pequeña y rápida. */
  loadPreferidos(): void {
    this._lastCursor = null;
    this.hasMoreState.next(true);
    this.facturasState.next([]);
    this.nuevasExternasState.next([]);
    this.isLoadingState.next(true);
    this.http
      .get<MarketplacePage>(
        '/api/bff/factura/marketplace?scope=preferidos&limit=20',
      )
      .subscribe({
        next: (res) => {
          this.minDiasAltaLiquidez = res.minDiasAltaLiquidez ?? 30;
          this._lastCursor = res.nextCursor;
          this.hasMoreState.next(!!res.nextCursor);
          this.facturasState.next(res.data ?? []);
          this.isLoadingState.next(false);
        },
        error: () => {
          this.isLoadingState.next(false);
        },
      });
  }

  /** Paginación por cursor (O(log n)) — evita OFFSET costoso en tablas grandes. */
  loadMore(): void {
    if (this.isLoadingMoreState.value || !this.hasMoreState.value) {
      return;
    }
    this.isLoadingMoreState.next(true);
    const params = this._lastCursor
      ? `scope=preferidos&cursor=${this._lastCursor}&limit=20`
      : 'scope=preferidos&limit=20';
    this.http
      .get<MarketplacePage>(`/api/bff/factura/marketplace?${params}`)
      .subscribe({
        next: (res) => {
          this._lastCursor = res.nextCursor;
          this.hasMoreState.next(!!res.nextCursor);
          this.facturasState.next([
            ...this.facturasState.value,
            ...(res.data ?? []),
          ]);
          this.isLoadingMoreState.next(false);
        },
        error: () => {
          this.isLoadingMoreState.next(false);
        },
      });
  }

  /**
   * Carga bajo demanda del mercado general (clientes no preferidos).
   * Solo se llama cuando el usuario hace clic en "Ver más oportunidades".
   * Usa paginación por cursor para no saturar la BD.
   */
  loadMercadoGeneral(cursor: string | null = null): void {
    const params = cursor
      ? `scope=todos&cursor=${cursor}&limit=20`
      : 'scope=todos&limit=20';
    this.isLoadingMoreState.next(true);
    this.http
      .get<MarketplacePage>(`/api/bff/marketplace/facturas?${params}`)
      .subscribe({
        next: (res) => {
          this._lastCursor = res.nextCursor;
          this.hasMoreState.next(!!res.nextCursor);
          this.facturasState.next([
            ...this.facturasState.value,
            ...(res.data ?? []),
          ]);
          this.isLoadingMoreState.next(false);
          // Limpia del badge las facturas que ya se cargaron
          this.nuevasExternasState.next(
            this.nuevasExternasState.value.filter(
              (n) => !(res.data ?? []).some((f) => f.facturaId === n.facturaId),
            ),
          );
        },
        error: () => {
          this.isLoadingMoreState.next(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.leaveChannel();
  }
}
