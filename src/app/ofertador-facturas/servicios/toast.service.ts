import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  mensaje: string;
  tipo: 'exito' | 'error' | 'info' | 'advertencia';
  duracion?: number; // en ms, 0 = permanente
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new Subject<Toast>();
  toasts$: Observable<Toast> = this.toastSubject.asObservable();

  private toastesActivos = new Map<string, Toast>();

  mostrar(mensaje: string, tipo: Toast['tipo'] = 'info', duracion: number = 4000) {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, mensaje, tipo, duracion };
    
    this.toastesActivos.set(id, toast);
    this.toastSubject.next(toast);

    if (duracion > 0) {
      setTimeout(() => {
        this.toastesActivos.delete(id);
      }, duracion);
    }

    return id;
  }

  cerrar(id: string) {
    this.toastesActivos.delete(id);
  }

  cerrarTodos() {
    this.toastesActivos.clear();
  }
}
