import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../servicios/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss']
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toastesActivos: Toast[] = [];
  private subscription: Subscription | null = null;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.toasts$.subscribe(toast => {
      this.toastesActivos.push(toast);
      if (toast.duracion && toast.duracion > 0) {
        setTimeout(() => {
          this.toastesActivos = this.toastesActivos.filter(t => t.id !== toast.id);
        }, toast.duracion);
      }
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  obtenerIcono(tipo: string): string {
    switch (tipo) {
      case 'exito':
        return '✓';
      case 'error':
        return '✕';
      case 'advertencia':
        return '⚠';
      case 'info':
        return 'ⓘ';
      default:
        return '';
    }
  }
}