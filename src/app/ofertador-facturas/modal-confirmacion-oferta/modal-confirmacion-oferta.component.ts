import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  templateUrl: './modal-confirmacion-oferta.component.html',
  styleUrls: ['./modal-confirmacion-oferta.component.scss']
})
export class ModalConfirmacionOfertaComponent implements OnInit {
  @Input() mostrar = false;
  @Input() resumen: ResumenOferta | null = null;
  
  @Output() confirmado = new EventEmitter<void>();
  @Output() cancelado = new EventEmitter<void>();

  cargando = false;
  error: string | null = null;

  constructor(private ofertasService: OfertasService) {}

  ngOnInit() {}

  @HostListener('keydown.escape', ['$event'])
  onEscapeKey(event: any) {
    if (!this.cargando) {
      this.cancelar();
    }
  }

  onOverlayClick() {
    if (!this.cargando) {
      this.cancelar();
    }
  }

  confirmar() {
    if (!this.resumen || this.cargando) return;

    this.cargando = true;
    this.error = null;

    const oferta: Oferta = {
      id: `oferta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        this.confirmado.emit();
      },
      error: (err) => {
        this.error = err.message || 'No se pudo publicar la oferta. Inténtalo de nuevo.';
        this.cargando = false;
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
