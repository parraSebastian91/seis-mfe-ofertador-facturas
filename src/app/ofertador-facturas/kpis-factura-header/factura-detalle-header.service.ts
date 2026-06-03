import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// ─── Interfaces públicas ─────────────────────────────────────────────────────

export interface FacturaDetalleData {
  facturaId: string;
  folio: string;
  razonSocialCedente: string;
  rutCedente: string;
  razonSocialDeudor: string;
  rutDeudor: string;
  monto: number;
  fechaVencimiento: string;
  pdfUrl: string | null;
}

export interface HistorialEjecutivo {
  operaciones: number;
  montoPromedio: number;
  tasaPromedio: number;
  sinHistorial: boolean;
}

export interface CupoDeudorDetalle {
  cupoTotal: number;
  cupoUtilizado: number;
  cupoDisponible: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FacturaDetalleHeaderService implements OnDestroy {

  // Bloque A
  private readonly detalleState = new BehaviorSubject<FacturaDetalleData | null>(null);
  private readonly historialState = new BehaviorSubject<HistorialEjecutivo | null>(null);
  private readonly loadingDetalleState = new BehaviorSubject<boolean>(false);
  private readonly loadingHistorialState = new BehaviorSubject<boolean>(false);
  private readonly errorHistorialState = new BehaviorSubject<boolean>(false);

  // Bloque B
  private readonly cupoState = new BehaviorSubject<CupoDeudorDetalle | null>(null);
  private readonly loadingCupoState = new BehaviorSubject<boolean>(false);

  readonly detalle$ = this.detalleState.asObservable();
  readonly historial$ = this.historialState.asObservable();
  readonly cupo$ = this.cupoState.asObservable();
  readonly isLoadingDetalle$ = this.loadingDetalleState.asObservable();
  readonly isLoadingHistorial$ = this.loadingHistorialState.asObservable();
  readonly isLoadingCupo$ = this.loadingCupoState.asObservable();
  readonly errorHistorial$ = this.errorHistorialState.asObservable();

  constructor(private readonly http: HttpClient) {}

  cargar(facturaId: string, clienteId: string, rutDeudor: string): void {
    this.reset();
    this.loadingDetalleState.next(true);
    this.loadingHistorialState.next(true);
    this.loadingCupoState.next(true);

    // Las tres llamadas en paralelo (CA técnica HU-28)
    const detalle$ = this.http.get<FacturaDetalleData>(
      `/api/core/marketplace/factura/${facturaId}`
    ).pipe(
      tap(data => {
        this.detalleState.next(data);
        this.loadingDetalleState.next(false);
      }),
      catchError(() => {
        this.loadingDetalleState.next(false);
        return of(null);
      })
    );

    const historial$ = this.http.get<HistorialEjecutivo>(
      `/api/core/ejecutivo/historial/${clienteId}`
    ).pipe(
      tap(data => {
        this.historialState.next(data);
        this.loadingHistorialState.next(false);
        this.errorHistorialState.next(false);
      }),
      catchError(() => {
        this.loadingHistorialState.next(false);
        this.errorHistorialState.next(true);
        return of(null);
      })
    );

    const cupo$ = this.http.get<CupoDeudorDetalle>(
      `/api/core/deudor/${rutDeudor}/cupo`
    ).pipe(
      tap(data => {
        this.cupoState.next(data);
        this.loadingCupoState.next(false);
      }),
      catchError(() => {
        this.loadingCupoState.next(false);
        return of(null);
      })
    );

    forkJoin([detalle$, historial$, cupo$]).subscribe();
  }

  retryHistorial(clienteId: string): void {
    this.loadingHistorialState.next(true);
    this.errorHistorialState.next(false);

    this.http.get<HistorialEjecutivo>(`/api/core/ejecutivo/historial/${clienteId}`)
      .pipe(
        tap(data => {
          this.historialState.next(data);
          this.loadingHistorialState.next(false);
          this.errorHistorialState.next(false);
        }),
        catchError(() => {
          this.loadingHistorialState.next(false);
          this.errorHistorialState.next(true);
          return of(null);
        })
      ).subscribe();
  }

  reset(): void {
    this.detalleState.next(null);
    this.historialState.next(null);
    this.cupoState.next(null);
    this.loadingDetalleState.next(false);
    this.loadingHistorialState.next(false);
    this.loadingCupoState.next(false);
    this.errorHistorialState.next(false);
  }

  ngOnDestroy(): void {
    this.reset();
  }
}
