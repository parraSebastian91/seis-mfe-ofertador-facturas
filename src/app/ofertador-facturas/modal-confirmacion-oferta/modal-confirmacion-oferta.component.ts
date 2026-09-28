import { ChangeDetectorRef, Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from 'shared-utils';
import { OfertasService, Oferta } from '../servicios/ofertas.service';

export interface ResumenOferta {
  folioFactura: string;
  razonSocial: string;
  montoTransferencia: number;
  excedenteRetenido: number;
  gananciaEstimada: number;
  plazo: number;
}

@Component({
  selector: 'app-modal-confirmacion-oferta',
  standalone: true,
  imports: [CommonModule, ConfirmDialogComponent],
  templateUrl: './modal-confirmacion-oferta.component.html',
  styleUrls: ['./modal-confirmacion-oferta.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalConfirmacionOfertaComponent {
  @Input() mostrar = false;
  @Input() resumen: ResumenOferta | null = null;

  @Output() readonly confirmado = new EventEmitter<void>();
  @Output() readonly cancelado = new EventEmitter<void>();

  cargando = false;
  error: string | null = null;

  // OnPush: la respuesta del servicio llega fuera de un evento del template,
  // así que sin markForCheck el spinner y el mensaje de error no se pintaban.
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(private readonly ofertasService: OfertasService) {}

  // Escape y click en el backdrop los maneja app-confirm-dialog, que además
  // los bloquea mientras `cargando` está activo.

  confirmar() {
    if (!this.resumen || this.cargando) return;

    this.cargando = true;
    this.error = null;

    const oferta: Oferta = {
      id: `oferta-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      folioFactura: this.resumen.folioFactura,
      montoTransferencia: this.resumen.montoTransferencia,
      excedenteRetenido: this.resumen.excedenteRetenido,
      gananciaEstimada: this.resumen.gananciaEstimada,
      plazoEstimado: this.resumen.plazo,
      timestamp: new Date()
    };

    this.ofertasService.enviarOferta(oferta).subscribe({
      next: (response) => {
        this.ofertasService.guardarOfertaEnviada(oferta);
        this.cargando = false;
        this.cdr.markForCheck();
        this.confirmado.emit();
      },
      error: (err) => {
        this.error = err.message || 'No se pudo publicar la oferta. Inténtalo de nuevo.';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  cancelar() {
    if (!this.cargando) {
      this.error = null;
      this.cancelado.emit();
    }
  }
}
