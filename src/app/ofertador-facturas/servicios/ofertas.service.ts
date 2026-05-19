import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Oferta {
  id: string;
  folioFactura: string;
  montoTransferencia: number;
  excedenteRetenido: number;
  gananciaEstimada: number;
  plazoEstimado: number;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class OfertasService {
  private ofertasEnviadas = new Map<string, Oferta>();

  enviarOferta(oferta: Oferta): Observable<{ success: boolean; offerId: string }> {
    // Simular validación del servidor
    if (!oferta.folioFactura || oferta.montoTransferencia <= 0) {
      return throwError(() => new Error('Datos de oferta inválidos'));
    }

    // Simular fallo aleatorio (10% de probabilidad)
    if (Math.random() < 0.1) {
      return throwError(() => new Error('Error temporal del servidor. Intenta nuevamente.'));
    }

    // Simular latencia de servidor (1.5-2.5 segundos)
    const latencia = 1500 + Math.random() * 1000;

    return of({ success: true, offerId: oferta.id }).pipe(
      delay(latencia)
    );
  }

  guardarOfertaEnviada(oferta: Oferta) {
    this.ofertasEnviadas.set(oferta.id, oferta);
  }

  obtenerOfertasEnviadas(): Oferta[] {
    return Array.from(this.ofertasEnviadas.values());
  }
}
