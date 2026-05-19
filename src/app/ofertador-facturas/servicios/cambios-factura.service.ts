import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

export interface CambioFactura {
  folioFactura: string;
  tipo: 'monto' | 'vencimiento' | 'plazo' | 'retirada' | 'otro';
  valorAnterior: any;
  valorNuevo: any;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class CambiosFacturaService {
  private cambiosSubject = new Subject<CambioFactura>();
  cambios$: Observable<CambioFactura> = this.cambiosSubject.asObservable();

  private facturaSeleccionadaSubject = new BehaviorSubject<string | null>(null);
  facturaSeleccionada$: Observable<string | null> = this.facturaSeleccionadaSubject.asObservable();

  private cambiosPorFacturaSubject = new BehaviorSubject<CambioFactura | null>(null);
  cambiosPorFactura$: Observable<CambioFactura | null> = this.cambiosPorFacturaSubject.asObservable();

  private facturasRetiradas = new Set<string>();

  constructor() {
    // Suscribirse a los cambios de factura seleccionada y filtrar solo los cambios para esa factura
    this.facturaSeleccionada$
      .pipe(
        filter(folio => folio !== null),
        switchMap(folioSeleccionado =>
          this.cambios$.pipe(
            filter(cambio => cambio.folioFactura === folioSeleccionado)
          )
        )
      )
      .subscribe(cambio => {
        this.cambiosPorFacturaSubject.next(cambio);
      });

    // Simulación: generar cambios aleatorios cada 12-25 segundos
    this.simularCambiosAleatorios();
  }

  seleccionarFactura(folio: string) {
    this.facturaSeleccionadaSubject.next(folio);
    this.cambiosPorFacturaSubject.next(null);
  }

  private simularCambiosAleatorios() {
    const folios = ['45900', '45901', '45902', '45903', '45904'];
    const tipos: CambioFactura['tipo'][] = ['monto', 'vencimiento', 'plazo', 'retirada'];

    const generarCambio = () => {
      const folioAleatorio = folios[Math.floor(Math.random() * folios.length)];
      const tipoAleatorio = tipos[Math.floor(Math.random() * tipos.length)];
      
      let cambio: CambioFactura;

      if (tipoAleatorio === 'retirada') {
        this.facturasRetiradas.add(folioAleatorio);
        cambio = {
          folioFactura: folioAleatorio,
          tipo: 'retirada',
          valorAnterior: 'disponible',
          valorNuevo: 'retirada',
          timestamp: new Date()
        };
      } else if (tipoAleatorio === 'monto') {
        const montoAnterior = 12500000;
        const montoNuevo = montoAnterior + (Math.random() > 0.5 ? -500000 : 500000);
        cambio = {
          folioFactura: folioAleatorio,
          tipo: 'monto',
          valorAnterior: montoAnterior,
          valorNuevo: Math.max(1000000, montoNuevo),
          timestamp: new Date()
        };
      } else if (tipoAleatorio === 'vencimiento') {
        const fechaAnt = new Date('2026-06-19');
        const fechaNueva = new Date(fechaAnt.getTime() + (Math.random() > 0.5 ? -86400000 : 86400000));
        cambio = {
          folioFactura: folioAleatorio,
          tipo: 'vencimiento',
          valorAnterior: fechaAnt.toISOString().split('T')[0],
          valorNuevo: fechaNueva.toISOString().split('T')[0],
          timestamp: new Date()
        };
      } else {
        const diasAnt = 30;
        const diasNuevo = diasAnt + (Math.random() > 0.5 ? -5 : 5);
        cambio = {
          folioFactura: folioAleatorio,
          tipo: 'plazo',
          valorAnterior: diasAnt,
          valorNuevo: Math.max(10, diasNuevo),
          timestamp: new Date()
        };
      }

      this.cambiosSubject.next(cambio);
      this.programarProximoCambio();
    };

    this.programarProximoCambio();

    const programarProximoCambio = () => {
      const delay = 12000 + Math.random() * 13000; // 12-25 segundos
      timer(delay).subscribe(() => generarCambio());
    };

    this.programarProximoCambio = programarProximoCambio;
  }

  private programarProximoCambio() {
    // Se sobrescribe en simularCambiosAleatorios
  }

  estaRetirada(folio: string): boolean {
    return this.facturasRetiradas.has(folio);
  }

  obtenerCambioActual(): CambioFactura | null {
    return this.cambiosPorFacturaSubject.value;
  }
}
