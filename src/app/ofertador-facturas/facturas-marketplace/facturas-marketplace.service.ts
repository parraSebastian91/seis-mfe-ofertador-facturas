import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';
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
  page: number;
  totalPages: number;
  minDiasAltaLiquidez: number;
}

type MarketplaceWsEvent =
  | { event: 'factura.publicada'; factura: FacturaMarketplace }
  | { event: 'factura.retirada'; facturaId: string }
  | { event: 'oferta.nueva' | 'oferta.modificada'; facturaId: string; cantidadOfertas: number; tasaMinima: number | null }
  | { event: 'mi.oferta.aceptada'; facturaId: string };

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FacturasMarketplaceService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly socketService = inject(NotificationSocketService);

  private readonly facturasState = new BehaviorSubject<FacturaMarketplace[]>([]);
  private readonly isLoadingState = new BehaviorSubject<boolean>(false);
  private readonly isLoadingMoreState = new BehaviorSubject<boolean>(false);
  private readonly hasMoreState = new BehaviorSubject<boolean>(true);
  private readonly facturaRetirAdaSubject = new Subject<string>();
  private readonly miOfertaAceptadaSubject = new Subject<string>();

  readonly facturas$ = this.facturasState.asObservable();
  readonly isLoading$ = this.isLoadingState.asObservable();
  readonly isLoadingMore$ = this.isLoadingMoreState.asObservable();
  readonly hasMore$ = this.hasMoreState.asObservable();
  readonly facturaRetirada$ = this.facturaRetirAdaSubject.asObservable();
  readonly miOfertaAceptada$ = this.miOfertaAceptadaSubject.asObservable();

  minDiasAltaLiquidez = 30;
  private currentPage = 0;
  private channelActive = false;

  // Arrow fn to preserve `this` reference for add/remove listener
  private readonly onWsMessage = (raw: unknown): void => {
    const msg = raw as MarketplaceWsEvent;

    if (msg.event === 'factura.publicada') {
      this.facturasState.next([
        { ...msg.factura, nueva: true },
        ...this.facturasState.value.map(f => ({ ...f, nueva: false }))
      ]);
    } else if (msg.event === 'factura.retirada') {
      this.facturasState.next(
        this.facturasState.value.filter(f => f.facturaId !== msg.facturaId)
      );
      this.facturaRetirAdaSubject.next(msg.facturaId);
    } else if (msg.event === 'oferta.nueva' || msg.event === 'oferta.modificada') {
      this.facturasState.next(
        this.facturasState.value.map(f =>
          f.facturaId === msg.facturaId
            ? { ...f, cantidadOfertas: msg.cantidadOfertas, tasaMinima: msg.tasaMinima }
            : f
        )
      );
    } else if (msg.event === 'mi.oferta.aceptada') {
      this.miOfertaAceptadaSubject.next(msg.facturaId);
    }
  };

  joinChannel(): void {
    if (this.channelActive) { return; }
    this.channelActive = true;
    this.socketService.sendMessage('join:marketplace', {});
    this.socketService.onMessage('marketplace', this.onWsMessage);
  }

  leaveChannel(): void {
    if (!this.channelActive) { return; }
    this.channelActive = false;
    this.socketService.offMessage('marketplace', this.onWsMessage);
    this.socketService.sendMessage('leave:marketplace', {});
  }

  loadInitial(): void {
    this.currentPage = 0;
    this.hasMoreState.next(true);
    this.facturasState.next([]);
    this.isLoadingState.next(true);
    this.http.get<MarketplacePage>('/api/bff/marketplace/facturas?page=1').subscribe({
      next: res => {
        this.minDiasAltaLiquidez = res.minDiasAltaLiquidez ?? 30;
        this.currentPage = res.page;
        this.hasMoreState.next(res.page < res.totalPages);
        this.facturasState.next(res.data ?? []);
        this.isLoadingState.next(false);
      },
      error: () => {
        this.isLoadingState.next(false);
      }
    });
  }

  loadMore(): void {
    if (this.isLoadingMoreState.value || !this.hasMoreState.value) { return; }
    this.isLoadingMoreState.next(true);
    const nextPage = this.currentPage + 1;
    this.http.get<MarketplacePage>(`/api/bff/marketplace/facturas?page=${nextPage}`).subscribe({
      next: res => {
        this.currentPage = res.page;
        this.hasMoreState.next(res.page < res.totalPages);
        this.facturasState.next([...this.facturasState.value, ...(res.data ?? [])]);
        this.isLoadingMoreState.next(false);
      },
      error: () => {
        this.isLoadingMoreState.next(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.leaveChannel();
  }
}
