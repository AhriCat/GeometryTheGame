import { GeometryEngine, Point, Line, Circle, CanvasConfig } from '../types';

export class EuclideanEngine implements GeometryEngine {
  private config: CanvasConfig;

  constructor(config: CanvasConfig) {
    this.config = config;
  }

  getGeometryName(): string {
    return 'Euclidean';
  }

  getGeometryDescription(): string {
    return 'Flat geometry where parallel lines never meet';
  }

  drawLine(ctx: CanvasRenderingContext2D, line: Line, animate = false): void {
    const { point1, point2 } = line;
    
    // Calculate line direction
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return;
    
    // Normalize direction
    const dirX = dx / length;
    const dirY = dy / length;
    
    // Extend line to canvas boundaries
    const margin = 50;
    const extendLength = Math.max(this.config.width, this.config.height) + margin;
    
    const startX = point1.x - dirX * extendLength;
    const startY = point1.y - dirY * extendLength;
    const endX = point1.x + dirX * extendLength;
    const endY = point1.y + dirY * extendLength;
    
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#06d6a0';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // Add subtle glow effect
    ctx.shadowColor = '#06d6a0';
    ctx.shadowBlur = 8;
    
    if (animate && line.isAnimating) {
      // Animated line drawing
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = Date.now() * 0.01;
    }
    
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw construction points with subtle highlight
    this.drawConstructionPoints(ctx, [point1, point2]);
    
    ctx.restore();
  }

  drawCircle(ctx: CanvasRenderingContext2D, circle: Circle, animate = false): void {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // Add glow effect
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    
    if (animate && circle.isAnimating) {
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = -Date.now() * 0.005;
    }
    
    ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw center point
    this.drawConstructionPoints(ctx, [circle.center]);
    
    // Draw radius line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.moveTo(circle.center.x, circle.center.y);
    ctx.lineTo(circle.center.x + circle.radius, circle.center.y);
    ctx.stroke();
    
    ctx.restore();
  }

  getParallelLines(line: Line, point: Point): Line[] {
    const dx = line.point2.x - line.point1.x;
    const dy = line.point2.y - line.point1.y;
    
    // Create a parallel line through the given point
    const parallelPoint = {
      x: point.x + dx * 0.5,
      y: point.y + dy * 0.5,
      id: 'parallel-point'
    };
    
    return [{
      point1: point,
      point2: parallelPoint,
      id: 'parallel-line'
    }];
  }

  calculateDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  movePoint(point: Point, dx: number, dy: number): Point {
    return {
      ...point,
      x: Math.max(10, Math.min(this.config.width - 10, point.x + dx)),
      y: Math.max(10, Math.min(this.config.height - 10, point.y + dy))
    };
  }

  isPointInBounds(point: Point): boolean {
    return point.x >= 0 && point.x <= this.config.width && 
           point.y >= 0 && point.y <= this.config.height;
  }

  private drawConstructionPoints(ctx: CanvasRenderingContext2D, points: Point[]): void {
    points.forEach(point => {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
}