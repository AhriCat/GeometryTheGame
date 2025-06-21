import { GeometryType, Point, Line, Circle, Tool, GeometryEngine, CanvasConfig, AnimationState } from './types';
import { EuclideanEngine } from './engines/EuclideanEngine';
import { SphericalEngine } from './engines/SphericalEngine';
import { HyperbolicEngine } from './engines/HyperbolicEngine';

export class GeometrySimulator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private previewCanvas: HTMLCanvasElement;
  private previewCtx: CanvasRenderingContext2D;
  
  private currentGeometry: GeometryType = 'euclidean';
  private currentTool: Tool = 'add_point';
  private engine: GeometryEngine;
  private config: CanvasConfig;
  
  private points: Point[] = [];
  private lines: Line[] = [];
  private circles: Circle[] = [];
  private selectedPoints: Point[] = [];
  
  private mousePos = { x: 0, y: 0 };
  private isDragging = false;
  private draggedPoint: Point | null = null;
  private lastRenderTime = 0;
  
  // Animation system
  private animationQueue: AnimationState[] = [];
  private isAnimating = false;

  constructor() {
    this.canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
    this.previewCtx = this.previewCanvas.getContext('2d')!;
    
    // Initialize canvas configuration
    this.config = {
      width: this.canvas.width,
      height: this.canvas.height,
      centerX: this.canvas.width / 2,
      centerY: this.canvas.height / 2,
      boundaryRadius: Math.min(this.canvas.width, this.canvas.height) * 0.4
    };
    
    this.engine = new EuclideanEngine(this.config);
    this.startAnimationLoop();
    this.render();
    this.renderPreview();
  }

  setGeometry(geometry: GeometryType): void {
    this.currentGeometry = geometry;
    
    switch (geometry) {
      case 'euclidean':
        this.engine = new EuclideanEngine(this.config);
        break;
      case 'spherical':
        this.engine = new SphericalEngine(this.config);
        break;
      case 'hyperbolic':
        this.engine = new HyperbolicEngine(this.config);
        break;
    }
    
    // Clear invalid points for the new geometry
    this.points = this.points.filter(point => this.engine.isPointInBounds(point));
    this.lines = this.lines.filter(line => 
      this.engine.isPointInBounds(line.point1) && this.engine.isPointInBounds(line.point2)
    );
    this.circles = this.circles.filter(circle => this.engine.isPointInBounds(circle.center));
    
    this.render();
    this.renderPreview();
    this.updateConstructionInfo();
  }

  setTool(tool: Tool): void {
    this.currentTool = tool;
    this.selectedPoints.forEach(p => p.selected = false);
    this.selectedPoints = [];
    this.render();
    this.updateConstructionInfo();
  }

  getCurrentGeometry(): GeometryType {
    return this.currentGeometry;
  }

  getCurrentTool(): Tool {
    return this.currentTool;
  }

  getObjectCounts(): { points: number; lines: number; circles: number } {
    return {
      points: this.points.length,
      lines: this.lines.length,
      circles: this.circles.length
    };
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

  handleMouseUp(): void {
    this.isDragging = false;
    this.draggedPoint = null;
  }

  private addPoint(x: number, y: number): void {
    const newPoint: Point = { x, y, id: `point-${Date.now()}-${Math.random()}` };
    
    // Check if point is valid for current geometry
    if (!this.engine.isPointInBounds(newPoint)) {
      this.showTemporaryMessage('Point must be within the geometry boundary');
      return;
    }
    
    // Add animation
    newPoint.isAnimating = true;
    this.points.push(newPoint);
    
    // Queue animation
    this.animationQueue.push({
      isAnimating: true,
      startTime: Date.now(),
      duration: 300,
      type: 'point'
    });
    
    this.render();
    this.updateConstructionInfo();
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
            id: `line-${Date.now()}`,
            isAnimating: true
          };
          
          this.lines.push(line);
          
          // Queue animation
          this.animationQueue.push({
            isAnimating: true,
            startTime: Date.now(),
            duration: 800,
            type: 'line'
          });
          
          // Clear selection
          this.selectedPoints.forEach(p => p.selected = false);
          this.selectedPoints = [];
        }
      }
    }
    
    this.render();
    this.updateConstructionInfo();
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
          id: `circle-${Date.now()}`,
          isAnimating: true
        };
        
        this.circles.push(circle);
        
        // Queue animation
        this.animationQueue.push({
          isAnimating: true,
          startTime: Date.now(),
          duration: 600,
          type: 'circle'
        });
        
        // Clear selection
        center.selected = false;
        this.selectedPoints = [];
      }
    }
    
    this.render();
    this.updateConstructionInfo();
  }

  private handleMoveClick(x: number, y: number): void {
    const clickedPoint = this.findPointAt(x, y);
    
    if (clickedPoint) {
      this.isDragging = true;
      this.draggedPoint = clickedPoint;
      this.canvas.style.cursor = 'grabbing';
    } else {
      this.isDragging = false;
      this.draggedPoint = null;
      this.canvas.style.cursor = 'grab';
    }
  }

  private findPointAt(x: number, y: number, threshold = 20): Point | null {
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
    this.animationQueue = [];
    this.render();
    this.updateConstructionInfo();
  }

  private startAnimationLoop(): void {
    const animate = (currentTime: number) => {
      if (currentTime - this.lastRenderTime > 16) { // ~60fps
        this.updateAnimations(currentTime);
        this.render();
        this.lastRenderTime = currentTime;
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  private updateAnimations(currentTime: number): void {
    this.animationQueue = this.animationQueue.filter(animation => {
      const elapsed = currentTime - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1);
      
      if (progress >= 1) {
        // Animation complete
        this.completeAnimation(animation);
        return false;
      }
      
      return true;
    });
    
    this.isAnimating = this.animationQueue.length > 0;
  }

  private completeAnimation(animation: AnimationState): void {
    // Remove animation flags from objects
    switch (animation.type) {
      case 'point':
        this.points.forEach(point => point.isAnimating = false);
        break;
      case 'line':
        this.lines.forEach(line => line.isAnimating = false);
        break;
      case 'circle':
        this.circles.forEach(circle => circle.isAnimating = false);
        break;
    }
  }

  private render(): void {
    // Clear canvas with gradient background
    const gradient = this.ctx.createRadialGradient(
      this.config.centerX, this.config.centerY, 0,
      this.config.centerX, this.config.centerY, this.config.boundaryRadius * 1.5
    );
    gradient.addColorStop(0, '#1a1a3e');
    gradient.addColorStop(1, '#0f0f23');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw geometry boundary for non-Euclidean geometries
    if (this.currentGeometry !== 'euclidean') {
      this.drawGeometryBoundary();
    }
    
    // Draw grid for reference
    this.drawGrid();
    
    // Draw geometric objects
    this.lines.forEach(line => {
      this.engine.drawLine(this.ctx, line, this.isAnimating);
    });
    
    this.circles.forEach(circle => {
      this.engine.drawCircle(this.ctx, circle, this.isAnimating);
    });
    
    this.points.forEach(point => {
      this.drawPoint(point);
    });
    
    // Draw tool preview
    this.drawToolPreview();
  }

  private drawGeometryBoundary(): void {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 5]);
    this.ctx.arc(this.config.centerX, this.config.centerY, this.config.boundaryRadius, 0, 2 * Math.PI);
    this.ctx.stroke();
    
    // Add boundary glow
    this.ctx.shadowColor = '#6366f1';
    this.ctx.shadowBlur = 15;
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  private drawGrid(): void {
    if (this.currentGeometry !== 'euclidean') return;
    
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    
    const gridSize = 40;
    
    // Vertical lines
    for (let x = 0; x <= this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  private drawPoint(point: Point): void {
    this.ctx.save();
    
    // Animate point appearance
    let scale = 1;
    if (point.isAnimating) {
      const time = Date.now() * 0.01;
      scale = 1 + Math.sin(time) * 0.2;
    }
    
    // Draw point shadow/glow
    this.ctx.beginPath();
    this.ctx.fillStyle = point.selected ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.3)';
    this.ctx.arc(point.x, point.y, 8 * scale, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Draw main point
    this.ctx.beginPath();
    this.ctx.fillStyle = point.selected ? '#ffd700' : '#ffffff';
    this.ctx.arc(point.x, point.y, 5 * scale, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Draw selection ring
    if (point.selected) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#ffd700';
      this.ctx.lineWidth = 2;
      this.ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  private drawToolPreview(): void {
    this.ctx.save();
    this.ctx.globalAlpha = 0.6;
    
    if (this.currentTool === 'draw_line' && this.selectedPoints.length === 1) {
      // Show preview line
      const tempLine: Line = {
        point1: this.selectedPoints[0],
        point2: { x: this.mousePos.x, y: this.mousePos.y, id: 'temp' },
        id: 'preview'
      };
      
      this.engine.drawLine(this.ctx, tempLine);
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
      
      this.engine.drawCircle(this.ctx, tempCircle);
    }
    
    this.ctx.restore();
  }

  private renderPreview(): void {
    // Clear preview canvas
    const gradient = this.previewCtx.createRadialGradient(
      this.previewCanvas.width / 2, this.previewCanvas.height / 2, 0,
      this.previewCanvas.width / 2, this.previewCanvas.height / 2, this.previewCanvas.width / 2
    );
    gradient.addColorStop(0, '#252547');
    gradient.addColorStop(1, '#1a1a3e');
    
    this.previewCtx.fillStyle = gradient;
    this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    
    // Draw geometry visualization
    const centerX = this.previewCanvas.width / 2;
    const centerY = this.previewCanvas.height / 2;
    const radius = Math.min(this.previewCanvas.width, this.previewCanvas.height) * 0.35;
    
    this.previewCtx.save();
    
    switch (this.currentGeometry) {
      case 'euclidean':
        this.drawEuclideanPreview(centerX, centerY, radius);
        break;
      case 'spherical':
        this.drawSphericalPreview(centerX, centerY, radius);
        break;
      case 'hyperbolic':
        this.drawHyperbolicPreview(centerX, centerY, radius);
        break;
    }
    
    this.previewCtx.restore();
  }

  private drawEuclideanPreview(centerX: number, centerY: number, radius: number): void {
    // Draw parallel lines
    this.previewCtx.strokeStyle = '#06d6a0';
    this.previewCtx.lineWidth = 3;
    this.previewCtx.lineCap = 'round';
    
    for (let i = 0; i < 4; i++) {
      const y = centerY - 45 + i * 30;
      this.previewCtx.beginPath();
      this.previewCtx.moveTo(centerX - radius, y);
      this.previewCtx.lineTo(centerX + radius, y);
      this.previewCtx.stroke();
    }
    
    // Highlight the parallel property
    this.previewCtx.strokeStyle = '#ffd700';
    this.previewCtx.lineWidth = 2;
    this.previewCtx.setLineDash([5, 5]);
    
    // Draw a line through a point not on the main lines
    const pointY = centerY - 15;
    this.previewCtx.beginPath();
    this.previewCtx.moveTo(centerX - radius, pointY);
    this.previewCtx.lineTo(centerX + radius, pointY);
    this.previewCtx.stroke();
  }

  private drawSphericalPreview(centerX: number, centerY: number, radius: number): void {
    // Draw sphere boundary
    this.previewCtx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    this.previewCtx.lineWidth = 2;
    this.previewCtx.beginPath();
    this.previewCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.previewCtx.stroke();
    
    // Draw great circles (no parallel lines)
    this.previewCtx.strokeStyle = '#06d6a0';
    this.previewCtx.lineWidth = 3;
    
    // Vertical great circle
    this.previewCtx.beginPath();
    this.previewCtx.ellipse(centerX, centerY, radius * 0.3, radius, 0, 0, 2 * Math.PI);
    this.previewCtx.stroke();
    
    // Horizontal great circle
    this.previewCtx.beginPath();
    this.previewCtx.ellipse(centerX, centerY, radius, radius * 0.3, 0, 0, 2 * Math.PI);
    this.previewCtx.stroke();
    
    // Diagonal great circles
    this.previewCtx.beginPath();
    this.previewCtx.ellipse(centerX, centerY, radius * 0.7, radius * 0.7, Math.PI / 4, 0, 2 * Math.PI);
    this.previewCtx.stroke();
  }

  private drawHyperbolicPreview(centerX: number, centerY: number, radius: number): void {
    // Draw Poincaré disk boundary
    this.previewCtx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    this.previewCtx.lineWidth = 3;
    this.previewCtx.beginPath();
    this.previewCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.previewCtx.stroke();
    
    // Draw hyperbolic lines (infinite parallels)
    this.previewCtx.strokeStyle = '#06d6a0';
    this.previewCtx.lineWidth = 2;
    
    // Central line
    this.previewCtx.beginPath();
    this.previewCtx.moveTo(centerX - radius * 0.8, centerY);
    this.previewCtx.lineTo(centerX + radius * 0.8, centerY);
    this.previewCtx.stroke();
    
    // Multiple parallel lines as arcs
    for (let i = 1; i <= 3; i++) {
      const arcRadius = radius * (1 + i * 0.5);
      const arcCenterY = centerY + radius * 0.8;
      
      this.previewCtx.beginPath();
      this.previewCtx.arc(centerX, arcCenterY, arcRadius, -Math.PI * 0.4, -Math.PI * 0.6, true);
      this.previewCtx.stroke();
      
      this.previewCtx.beginPath();
      this.previewCtx.arc(centerX, centerY - radius * 0.8, arcRadius, Math.PI * 0.4, Math.PI * 0.6);
      this.previewCtx.stroke();
    }
  }

  private updateConstructionInfo(): void {
    const info = document.getElementById('construction-info');
    if (!info) return;
    
    let message = '';
    
    switch (this.currentTool) {
      case 'add_point':
        message = 'Click anywhere to add a point';
        break;
      case 'draw_line':
        if (this.selectedPoints.length === 0) {
          message = 'Select two points to draw a line';
        } else if (this.selectedPoints.length === 1) {
          message = 'Select a second point to complete the line';
        }
        break;
      case 'draw_circle':
        if (this.selectedPoints.length === 0) {
          message = 'Select a center point for the circle';
        } else if (this.selectedPoints.length === 1) {
          message = 'Select a point to set the radius';
        }
        break;
      case 'move':
        message = 'Click and drag points to move them';
        break;
      case 'clear':
        message = 'Click to clear all constructions';
        break;
    }
    
    info.textContent = message;
    info.classList.toggle('show', message !== '');
  }

  private showTemporaryMessage(message: string): void {
    const info = document.getElementById('construction-info');
    if (!info) return;
    
    info.textContent = message;
    info.classList.add('show');
    
    setTimeout(() => {
      this.updateConstructionInfo();
    }, 2000);
  }
}