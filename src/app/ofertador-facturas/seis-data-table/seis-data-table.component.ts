import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  signal,
} from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';

// ─── Interfaces públicas ─────────────────────────────────────────────────────

export interface SeisTableColumn {
  /** Clave del campo en el objeto fila. Soporta dot-notation: 'user.name' */
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  /** Formateador simple: retorna string a mostrar en la celda */
  formatter?: (value: any, row: any) => string;
}

export interface SeisTableRowAction {
  key: string;
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: (row: any) => boolean;
}

export interface SeisTableSortEvent {
  column: string;
  direction: 'asc' | 'desc';
}

export interface SeisTableActionEvent {
  actionKey: string;
  row: any;
}

// ─── Directiva para cell templates custom ────────────────────────────────────

/**
 * Marca un ng-template como celda personalizada para una columna.
 * Uso en el padre:
 *   <ng-template seisTableCell="miColumna" let-row>...</ng-template>
 */
@Directive({
  selector: 'ng-template[seisTableCell]',
  standalone: true,
})
export class SeisTableCellDirective {
  @Input('seisTableCell') column!: string;
  constructor(public template: TemplateRef<any>) {}
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface MenuPosition {
  top: number;
  left: number;
}

@Component({
  selector: 'app-seis-data-table',
  standalone: true,
  imports: [NgClass, NgTemplateOutlet],
  templateUrl: './seis-data-table.component.html',
  styleUrl: './seis-data-table.component.scss',
})
export class SeisDataTableComponent
  implements AfterContentInit, AfterViewInit, OnChanges, OnDestroy
{
  /** Definición de columnas */
  @Input() columns: SeisTableColumn[] = [];

  /** Datos a mostrar. Reactive: cada cambio refresca la tabla */
  @Input() data: any[] = [];

  /** Campo del objeto que identifica cada fila (para trackBy y menú) */
  @Input() trackByKey = 'id';

  /** Si hay acciones, se muestra el botón de 3 puntos. Array vacío = sin botón */
  @Input() rowActions: SeisTableRowAction[] = [];

  /** Habilitar clic en filas (cursor pointer + evento rowClick) */
  @Input() rowClickable = true;

  /** Función que determina si una fila recibe la clase 'tr-highlighted' */
  @Input() rowHighlightFn?: (row: any) => boolean;

  /** Función que retorna una clase CSS adicional por fila (ticket-alto, etc.) */
  @Input() rowClassFn?: (row: any) => string | null;

  /** Mensaje cuando data está vacío */
  @Input() emptyMessage = 'No se encontraron registros.';

  @Output() rowClick = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<SeisTableSortEvent>();
  @Output() actionClick = new EventEmitter<SeisTableActionEvent>();

  @ContentChildren(SeisTableCellDirective)
  cellTemplates!: QueryList<SeisTableCellDirective>;

  @ViewChild('scrollContainer')
  scrollContainer!: ElementRef<HTMLElement>;

  readonly sortColumn = signal<string | null>(null);
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly openMenuRowId = signal<any>(null);
  readonly openMenuRow = signal<any>(null);
  readonly menuPosition = signal<MenuPosition | null>(null);

  private templateMap = new Map<string, TemplateRef<any>>();
  private readonly onScrollCapture = () => this.closeMenu();

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeMenu();
  }

  ngAfterContentInit(): void {
    this.buildTemplateMap();
    this.cellTemplates.changes.subscribe(() => this.buildTemplateMap());
  }

  ngAfterViewInit(): void {
    // Escucha scroll en CUALQUIER elemento (capture) para cerrar el menú fixed
    document.addEventListener('scroll', this.onScrollCapture, {
      capture: true,
      passive: true,
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) this.closeMenu();
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.onScrollCapture, {
      capture: true,
    });
  }

  // ─── Template helpers ───────────────────────────────────────────────────

  private buildTemplateMap(): void {
    this.templateMap.clear();
    this.cellTemplates.forEach(d => this.templateMap.set(d.column, d.template));
  }

  getCellTemplate(columnKey: string): TemplateRef<any> | null {
    return this.templateMap.get(columnKey) ?? null;
  }

  getCellValue(row: any, key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], row);
  }

  getRowId(row: any): any {
    return row[this.trackByKey];
  }

  trackByFn = (_index: number, row: any): any =>
    row[this.trackByKey] ?? _index;

  // ─── Acciones de fila ───────────────────────────────────────────────────

  onRowClick(row: any): void {
    if (this.rowClickable) this.rowClick.emit(row);
  }

  // ─── Ordenamiento ───────────────────────────────────────────────────────

  toggleSort(col: SeisTableColumn): void {
    if (!col.sortable) return;
    if (this.sortColumn() === col.key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(col.key);
      this.sortDirection.set('asc');
    }
    this.sortChange.emit({
      column: col.key,
      direction: this.sortDirection(),
    });
  }

  // ─── Menú 3 puntos (portal fixed) ──────────────────────────────────────

  toggleMenu(row: any, event: MouseEvent): void {
    event.stopPropagation();
    const rowId = this.getRowId(row);

    if (this.openMenuRowId() === rowId) {
      this.closeMenu();
      return;
    }

    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();

    // Posiciona el menú debajo del botón, alineado a la derecha
    const menuWidth = 172;
    this.menuPosition.set({
      top: rect.bottom + 6,
      left: Math.max(8, rect.right - menuWidth),
    });
    this.openMenuRowId.set(rowId);
    this.openMenuRow.set(row);
  }

  closeMenu(): void {
    this.openMenuRowId.set(null);
    this.openMenuRow.set(null);
    this.menuPosition.set(null);
  }

  onActionClick(action: SeisTableRowAction, event: Event): void {
    event.stopPropagation();
    const row = this.openMenuRow();
    if (!row || action.disabled?.(row)) return;
    this.closeMenu();
    this.actionClick.emit({ actionKey: action.key, row });
  }
}
