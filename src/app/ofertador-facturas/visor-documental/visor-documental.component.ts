import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-visor-documental',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visor-documental.component.html',
  styleUrls: ['./visor-documental.component.scss']
})
export class VisorDocumentalComponent implements OnChanges {
  @Input() url: string | null = null;
  @Input() loading = false;
  @Input() error = false;

  zoom = 1;
  rotation = 0;
  panX = 0;
  panY = 0;
  dragging = false;
  lastX = 0;
  lastY = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['url']) {
      this.resetView();
    }
  }

  resetView() {
    this.zoom = 1;
    this.rotation = 0;
    this.panX = 0;
    this.panY = 0;
  }

  zoomIn() { if (this.zoom < 5) this.zoom += 0.2; }
  zoomOut() { if (this.zoom > 0.5) this.zoom -= 0.2; }
  rotate() { this.rotation = (this.rotation + 90) % 360; }

  onMouseDown(event: MouseEvent) {
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    event.preventDefault();
  }
  onMouseMove(event: MouseEvent) {
    if (this.dragging) {
      this.panX += event.clientX - this.lastX;
      this.panY += event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    }
  }
  onMouseUp() { this.dragging = false; }
  onMouseLeave() { this.dragging = false; }

  onWheel(event: WheelEvent) {
    const delta = event.deltaY < 0 ? 0.2 : -0.2;
    if ((delta > 0 && this.zoom < 5) || (delta < 0 && this.zoom > 0.5)) {
      this.zoom += delta;
    }
    event.preventDefault();
  }
}
