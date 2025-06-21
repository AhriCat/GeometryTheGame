import { GeometryEngine, Point, Line, Circle } from '../types';

export class EuclideanEngine implements GeometryEngine {
  drawLine(ctx: CanvasRenderingContext2D, line: Line): void {
    const { point1, point2 } = line;
    
    // Extend line to canvas boundaries
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    
    // Calculate line equation: y = mx + b
    const slope = dy / dx;
    const intercept = point1.y - slope * point1.x;
    
    ctx.beginPath();
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // More horizontal than vertical
      ctx.moveTo(0, intercept);
      ctx.lineTo(ctx.canvas.width, slope * ctx.canvas.width + intercept);
    } else {
      // More vertical than horizontal
      const x1 = (0 - intercept) / slope;
      const x2 = (ctx.canvas.height - intercept) / slope;
      ctx.moveTo(x1, 0);
      ctx.lineTo(x2, ctx.canvas.height);
    }
    
    ctx.stroke();
  }

  drawCircle(ctx: CanvasRenderingContext2D, circle: Circle): void {
    ctx.beginPath();
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI);
    ctx.stroke();
  }

  getParallelLines(line: Line, point: Point): Line[] {
    const dx = line.point2.x - line.point1.x;
    const dy = line.point2.y - line.point1.y;
    
    // Create a parallel line through the given point
    const parallelPoint = {
      x: point.x + dx,
      y: point.y + dy,
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
      x: point.x + dx,
      y: point.y + dy
    };
  }
}