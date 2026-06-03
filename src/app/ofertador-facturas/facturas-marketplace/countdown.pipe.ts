import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ 
  name: 'countdown',
  standalone: true
})
export class CountdownPipe implements PipeTransform {
  transform(segundos: number): string {
    if (typeof segundos !== 'number' || isNaN(segundos)) return '';
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    return [h, m, s]
      .map(v => v < 10 ? '0' + v : v)
      .join(':');
  }
}
