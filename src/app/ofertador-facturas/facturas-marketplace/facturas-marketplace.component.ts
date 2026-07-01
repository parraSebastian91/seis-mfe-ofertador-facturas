import {
  Component, OnInit, OnDestroy, AfterViewInit,
  Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef,
  ElementRef, ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FacturasMarketplaceService, FacturaMarketplace } from './facturas-marketplace.service';
import { CardComponent } from 'shared-utils';

export type { FacturaMarketplace };

@Component({
  selector: 'app-facturas-marketplace',
  templateUrl: './facturas-marketplace.component.html',
  styleUrls: ['./facturas-marketplace.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CardComponent]
})
export class FacturasMarketplaceComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() facturaSeleccionadaId: string | null = null;
  @Output() readonly seleccionarFactura = new EventEmitter<FacturaMarketplace>();

  @ViewChild('listaScroll') private readonly listaScroll?: ElementRef<HTMLElement>;
  @ViewChild('scrollSentinel') private readonly scrollSentinel?: ElementRef<HTMLElement>;

  // private readonly service = inject(FacturasMarketplaceService);
  // private readonly cdRef = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private intersectionObserver?: IntersectionObserver;

  isLoading = false;
  isLoadingMore = false;
  allFacturas: FacturaMarketplace[] = [];
  facturasFiltradas: FacturaMarketplace[] = [];

  textoBusqueda = '';
  filtroPreferidos = false;
  filtroMasRecientes = true;
  filtroAltaLiquidez = false;

  readonly skeletonItems = [1, 2, 3, 4];

  constructor(
    private readonly service: FacturasMarketplaceService,
    private readonly cdRef: ChangeDetectorRef
  ) { }

  get emptyStatePreferidos(): boolean {
    return (
      this.filtroPreferidos &&
      !this.filtroAltaLiquidez &&
      this.textoBusqueda.trim() === ''
    );
  }

  ngOnInit(): void {
    this.service.isLoading$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.isLoading = v;
      this.cdRef.markForCheck();
    });

    this.service.isLoadingMore$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.isLoadingMore = v;
      this.cdRef.markForCheck();
    });

    this.service.facturas$.pipe(takeUntil(this.destroy$)).subscribe(facturas => {
      this.allFacturas = facturas;
      this.aplicarFiltros();
      this.cdRef.markForCheck();
    });


  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
    this.cdRef.markForCheck();
  }

  toggleFiltro(filtro: 'preferidos' | 'masRecientes' | 'altaLiquidez'): void {
    if (filtro === 'preferidos') {
      this.filtroPreferidos = !this.filtroPreferidos;
    } else if (filtro === 'masRecientes') {
      this.filtroMasRecientes = !this.filtroMasRecientes;
    } else {
      this.filtroAltaLiquidez = !this.filtroAltaLiquidez;
    }
    this.aplicarFiltros();
    this.cdRef.markForCheck();
  }

  limpiarFiltros(): void {
    this.textoBusqueda = '';
    this.filtroPreferidos = false;
    this.filtroMasRecientes = true;
    this.filtroAltaLiquidez = false;
    this.aplicarFiltros();
    this.cdRef.markForCheck();
  }

  onSeleccionar(factura: FacturaMarketplace): void {
    this.seleccionarFactura.emit(factura);
  }

  trackByFacturaId(_index: number, factura: FacturaMarketplace): string {
    return factura.facturaId;
  }

  private aplicarFiltros(): void {
    const texto = this.textoBusqueda.trim().toLowerCase();
    let resultado = this.allFacturas.filter(f => {
      if (texto.length > 0) {
        const matchDeudor = f.razonSocial.toLowerCase().includes(texto);
        const matchFolio = f.folio.toLowerCase().includes(texto);
        if (!matchDeudor && !matchFolio) { return false; }
      }
      if (this.filtroPreferidos && !f.esPreferido) { return false; }
      if (this.filtroAltaLiquidez && f.diasRestantes < this.service.minDiasAltaLiquidez) { return false; }
      return true;
    });

    if (this.filtroMasRecientes) {
      resultado = resultado.slice().sort(
        (a, b) => new Date(b.publicadoEn).getTime() - new Date(a.publicadoEn).getTime()
      );
    }

    this.facturasFiltradas = resultado;
  }

  private setupIntersectionObserver(): void {
    const sentinel = this.scrollSentinel?.nativeElement;
    const container = this.listaScroll?.nativeElement;
    if (sentinel === undefined || container === undefined) { return; }
    this.intersectionObserver = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          this.service.loadMore();
        }
      },
      { root: container, threshold: 0.1 }
    );
    this.intersectionObserver.observe(sentinel);
  }
}
