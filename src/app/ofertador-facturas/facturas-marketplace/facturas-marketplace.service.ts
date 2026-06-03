import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FacturaMarketplace } from './facturas-marketplace.component';

@Injectable({ providedIn: 'root' })
export class FacturasMarketplaceService {
  private facturasSubject = new BehaviorSubject<FacturaMarketplace[]>([]);
  facturas$: Observable<FacturaMarketplace[]> = this.facturasSubject.asObservable();

  constructor() {
    // Simulación: llegada de facturas nuevas cada 8 segundos
    let folio = 45910;
    setTimeout(() => this.pushFactura(this.generarFactura(folio++)), 2000);
    setInterval(() => this.pushFactura(this.generarFactura(folio++)), 8000);

    // Simulación: decrementa el tiempo restante cada segundo
    interval(1000).subscribe(() => {
      const actualizadas = this.facturasSubject.value.map(f => ({
        ...f,
        tiempoRestante: f.tiempoRestante > 0 ? f.tiempoRestante - 1 : 0,
        nueva: false
      }));
      this.facturasSubject.next(actualizadas);
    });
  }

  private pushFactura(factura: FacturaMarketplace) {
    this.facturasSubject.next([
      { ...factura, nueva: true },
      ...this.facturasSubject.value.map(f => ({ ...f, nueva: false }))
    ]);
  }

  private generarFactura(folio: number): FacturaMarketplace {
    const razones = [
      'Inversiones Chile S.A.',
      'Servicios Financieros Ltda.',
      'Comercial Andes SpA',
      'Distribuidora Sur S.A.'
    ];
    const idx = Math.floor(Math.random() * razones.length);
    return {
      folio: folio.toString(),
      razonSocial: razones[idx],
      rutDeudor: `76.1${folio % 1000}-K`,
      monto: 5000000 + Math.floor(Math.random() * 15000000),
      tiempoRestante: 18000 + Math.floor(Math.random() * 18000),
      ofertas: Math.random() > 0.5 ? Math.floor(Math.random() * 5) : 0,
      tasaMinima: Math.random() > 0.5 ? +(1 + Math.random() * 2).toFixed(2) : null,
      nueva: true
    };
  }
}
