import { GeometryType, Point, Line, Circle, Tool, GeometryEngine } from './types';
import { EuclideanEngine } from './engines/EuclideanEngine';
import { SphericalEngine } from './engines/SphericalEngine';
import { HyperbolicEngine } from './engines/HyperbolicEngine';

export class GeometrySimulator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private previewCanvas: HTMLCanvasElement;
  private previewCtx: CanvasRenderingContext2D;
  
  private currentGeometry: GeometryType = 'hyperbolic';
  private currentTool: Tool = 'add_point';
  private engine: GeometryEngine;
  
  private points: Point[] = [];
  private lines: Line[] = [];
  private circles: Circle[] = [];
  private selectedPoints: Point[] = [];
  
  private mousePos = { x: 0, y: 0 };
  private isDragging = false;
  private draggedPoint: Point | null = null;

  constructor() {
    this.canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
    this.previewCtx = this.previewCanvas.getContext('2d')!;
    
    this.engine = new HyperbolicEngine();
    this.render();
    this.renderPreview();
  }

  setGeometry(geometry: GeometryType): void {
    this.currentGeometry = geometry;
    
    switch (geometry) {
      case 'euclidean':
        this.engine = new EuclideanEngine();
        break;
      case 'spherical':
        this.engine = new SphericalEngine();
        break;
      case 'hyperbolic':
        this.engine = new HyperbolicEngine();
        break;
    }
    
    this.render();
    this.renderPreview();
  }

  setTool(tool: Tool): void {
    this.currentTool = tool;
    this.selectedPoints = [];
    this.render();
  }

  handleClick(x: number, y: number): void {
    switch (this.currentTool) {
      case 'add_point':
        this.addPoint(x, y);
        break;
      case 'draw_line':
        this.handleLineDrawing(x, y);
        break;
      case 'draw_circle':
        this.handleCircleDrawing(x, y);
        break;
      case 'move':
        this.handleMoveClick(x, y);
        break;
      case 'clear':
        this.clearAll();
        break;
    }
  }

  handleMouseMove(x: number, y: number): void {
    this.mousePos = { x, y };
    
    if (this.isDragging && this.draggedPoint) {
      const dx = x - this.draggedPoint.x;
      const dy = y - this.draggedPoint.y;
      
      const newPoint = this.engine.movePoint(this.draggedPoint, dx, dy);
      this.draggedPoint.x = newPoint.x;
      this.draggedPoint.y = newPoint.y;
      
      this.render();
    }
  }

  private addPoint(x: number, y: number): void {
    const point: Point = {
      x,
      y,
      id: `point-${Date.now()}-${Math.random()}`
    };
    
    this.points.push(point);
    this.render();
  }

  private handleLineDrawing(x: number, y: number): void {
    const clickedPoint = this.findPointAt(x, y);
    
    if (clickedPoint) {
      if (this.selectedPoints.includes(clickedPoint)) {
        // Deselect point
        this.selectedPoints = this.selectedPoints.filter(p => p !== clickedPoint);
        clickedPoint.selected = false;
      } else {
        // Select point
        this.selectedPoints.push(clickedPoint);
        clickedPoint.selected = true;
        
        if (this.selectedPoints.length === 2) {
          // Create line
          const line: Line = {
            point1: this.selectedPoints[0],
            point2: this.selectedPoints[1],
            id: `line-${Date.now()}`
          };
          
          this.lines.push(line);
          
          // Clear selection
          this.selectedPoints.forEach(p => p.selected = false);
          this.selectedPoints = [];
        }
      }
    }
    
    this.render();
  }

  private handleCircleDrawing(x: number, y: number): void {
    const clickedPoint = this.findPointAt(x, y);
    
    if (clickedPoint) {
      if (this.selectedPoints.length === 0) {
        // Select center point
        this.selectedPoints.push(clickedPoint);
        clickedPoint.selected = true;
      } else if (this.selectedPoints.length === 1) {
        // Calculate radius and create circle
        const center = this.selectedPoints[0];
        const radius = this.engine.calculateDistance(center, clickedPoint);
        
        const circle: Circle = {
          center,
          radius,
          id: `circle-${Date.now()}`
        };
        
        this.circles.push(circle);
        
        // Clear selection
        center.selected = false;
        this.selectedPoints = [];
      }
    }
    
    this.render();
  }

  private handleMoveClick(x: number, y: number): void {
    const clickedPoint = this.findPointAt(x, y);
    
    if (clickedPoint) {
      this.isDragging = true;
      this.draggedPoint = clickedPoint;
    } else {
      this.isDragging = false;
      this.draggedPoint = null;
    }
  }

  private findPointAt(x: number, y: number, threshold = 15): Point | null {
    return this.points.find(point => {
      const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
      return distance <= threshold;
    }) || null;
  }

  private clearAll(): void {
    this.points = [];
    this.lines = [];
    this.circles = [];
    this.selectedPoints = [];
    this.render();
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw geometry boundary for non-Euclidean geometries
    if (this.currentGeometry === 'spherical' || this.currentGeometry === 'hyperbolic') {
      this.drawGeometryBoundary();
    }
    
    // Draw lines
    this.lines.forEach(line => {
      this.engine.drawLine(this.ctx, line);
    });
    
    // Draw circles
    this.circles.forEach(circle => {
      this.engine.drawCircle(this.ctx, circle);
    });
    
    // Draw points
    this.points.forEach(point => {
      this.drawPoint(point);
    });
    
    // Draw preview for current tool
    this.drawToolPreview();
  }

  private drawGeometryBoundary(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = 250;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#444';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawPoint(point: Point): void {
    this.ctx.beginPath();
    this.ctx.fillStyle = point.selected ? '#ffff00' : '#ffffff';
    this.ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
    this.ctx.fill();
    
    if (point.selected) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#ffff00';
      this.ctx.lineWidth = 2;
      this.ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
      this.ctx.stroke();
    }
  }

  private drawToolPreview(): void {
    if (this.currentTool === 'draw_line' && this.selectedPoints.length === 1) {
      // Show preview line
      const tempLine: Line = {
        point1: this.selectedPoints[0],
        point2: { x: this.mousePos.x, y: this.mousePos.y, id: 'temp' },
        id: 'preview'
      };
      
      this.ctx.save();
      this.ctx.globalAlpha = 0.5;
      this.engine.drawLine(this.ctx, tempLine);
      this.ctx.restore();
    }
    
    if (this.currentTool === 'draw_circle' && this.selectedPoints.length === 1) {
      // Show preview circle
      const center = this.selectedPoints[0];
      const radius = this.engine.calculateDistance(center, this.mousePos);
      
      const tempCircle: Circle = {
        center,
        radius,
        id: 'preview'
      };
      
      this.ctx.save();
      this.ctx.globalAlpha = 0.5;
      this.engine.drawCircle(this.ctx, tempCircle);
      this.ctx.restore();
    }
  }

  private renderPreview(): void {
    // Clear preview canvas
    this.previewCtx.fillStyle = '#2a2a2a';
    this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    
    // Draw a simple representation of the current geometry
    const centerX = this.previewCanvas.width / 2;
    const centerY = this.previewCanvas.height / 2;
    
    switch (this.currentGeometry) {
      case 'euclidean':
        // Draw parallel lines
        this.previewCtx.strokeStyle = '#00ff88';
        this.previewCtx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const y = centerY - 30 + i * 30;
          this.previewCtx.beginPath();
          this.previewCtx.moveTo(20, y);
          this.previewCtx.lineTo(this.previewCanvas.width - 20, y);
          this.previewCtx.stroke();
        }
        break;
        
      case 'spherical':
        // Draw sphere with great circles
        this.previewCtx.strokeStyle = '#444';
        this.previewCtx.lineWidth = 1;
        this.previewCtx.beginPath();
        this.previewCtx.arc(centerX, centerY, 80, 0, 2 * Math.PI);
        this.previewCtx.stroke();
        
        this.previewCtx.strokeStyle = '#00ff88';
        this.previewCtx.lineWidth = 2;
        // Vertical great circle
        this.previewCtx.beginPath();
        this.previewCtx.ellipse(centerX, centerY, 80, 80, 0, 0, 2 * Math.PI);
        this.previewCtx.stroke();
        // Horizontal great circle
        this.previewCtx.beginPath();
        this.previewCtx.ellipse(centerX, centerY, 80, 20, 0, 0, 2 * Math.PI);
        this.previewCtx.stroke();
        break;
        
      case 'hyperbolic':
        // Draw Poincaré disk with hyperbolic lines
        this.previewCtx.strokeStyle = '#444';
        this.previewCtx.lineWidth = 2;
        this.previewCtx.beginPath();
        this.previewCtx.arc(centerX, centerY, 80, 0, 2 * Math.PI);
        this.previewCtx.stroke();
        
        this.previewCtx.strokeStyle = '#00ff88';
        this.previewCtx.lineWidth = 2;
        // Draw several hyperbolic lines (arcs)
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 4;
          const startX = centerX + 60 * Math.cos(angle);
          const startY = centerY + 60 * Math.sin(angle);
          const endX = centerX - 60 * Math.cos(angle);
          const endY = centerY - 60 * Math.sin(angle);
          
          this.previewCtx.beginPath();
          this.previewCtx.arc(centerX + 100 * Math.cos(angle + Math.PI/2), 
                             centerY + 100 * Math.sin(angle + Math.PI/2), 
                             100, angle - Math.PI/3, angle + Math.PI/3);
          this.previewCtx.stroke();
        }
        break;
    }
  }
}