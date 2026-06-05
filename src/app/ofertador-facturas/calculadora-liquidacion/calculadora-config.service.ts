import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

export interface CalculadoraConfig {
  tasaMaxima: number;
  diferencialMB: number;
  tasaMinimaPermitida: number;
}

const DEFAULTS: CalculadoraConfig = {
  tasaMaxima: 3.5,
  diferencialMB: 0.05,
  tasaMinimaPermitida: 0.5
};

@Injectable({ providedIn: 'root' })
export class CalculadoraConfigService {

  private readonly configState = new BehaviorSubject<CalculadoraConfig>(DEFAULTS);
  private loaded = false;

  readonly config$ = this.configState.asObservable();

  get config(): CalculadoraConfig {
    return this.configState.value;
  }

  constructor(private readonly http: HttpClient) {}

  /** Cargar config del backend una sola vez (llamar desde AppModule o bootstrap) */
  cargar(): void {
    if (this.loaded) return;
    this.loaded = true;

    this.http.get<CalculadoraConfig>('/api/bff/config/calculadora')
      .pipe(
        tap(cfg => this.configState.next({ ...DEFAULTS, ...cfg })),
        catchError(() => {
          // Mantener defaults si el endpoint no está disponible
          return of(null);
        })
      ).subscribe();
  }
}
