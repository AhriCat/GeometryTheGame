import { GeometryEngine, Point, Line, Circle } from '../types';

export class HyperbolicEngine implements GeometryEngine {
  private readonly diskRadius = 250; // Poincaré disk radius

  drawLine(ctx: CanvasRenderingContext2D, line: Line): void {
    // In hyperbolic geometry (Poincaré disk model), lines are arcs orthogonal to the boundary
    const { point1, point2 } = line;
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    // Check if line passes through center (then it's a straight line)
    const midX = (point1.x + point2.x) / 2;
    const midY = (point1.y + point2.y) / 2;
    const distFromCenter = Math.sqrt((midX - centerX) ** 2 + (midY - centerY) ** 2);
    
    ctx.beginPath();
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    
    if (distFromCenter < 20) {
      // Line through center - draw straight
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const extendFactor = this.diskRadius * 2 / length;
      
      const startX = centerX - (dx * extendFactor) / 2;
      const startY = centerY - (dy * extendFactor) / 2;
      const endX = centerX + (dx * extendFactor) / 2;
      const endY = centerY + (dy * extendFactor) / 2;
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    } else {
      // Hyperbolic line - draw as arc
      const perpBisectorX = midX - centerX;
      const perpBisectorY = midY - centerY;
      const perpLength = Math.sqrt(perpBisectorX ** 2 + perpBisectorY ** 2);
      
      // Calculate arc center
      const arcCenterDistance = this.diskRadius * 1.5;
      const arcCenterX = centerX + (perpBisectorX / perpLength) * arcCenterDistance;
      const arcCenterY = centerY + (perpBisectorY / perpLength) * arcCenterDistance;
      
      const radius = Math.sqrt((point1.x - arcCenterX) ** 2 + (point1.y - arcCenterY) ** 2);
      const startAngle = Math.atan2(point1.y - arcCenterY, point1.x - arcCenterX);
      const endAngle = Math.atan2(point2.y - arcCenterY, point2.x - arcCenterX);
      
      ctx.arc(arcCenterX, arcCenterY, radius, startAngle, endAngle);
    }
    
    ctx.stroke();
  }

  drawCircle(ctx: CanvasRenderingContext2D, circle: Circle): void {
    // In hyperbolic geometry, circles are still circles but with different properties
    ctx.beginPath();
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI);
    ctx.stroke();
  }

  getParallelLines(line: Line, point: Point): Line[] {
    // In hyperbolic geometry, there are infinitely many parallel lines
    // We'll show a few examples
    const parallels: Line[] = [];
    const centerX = 400;
    const centerY = 300;
    
    // Create multiple parallel lines at different angles
    for (let i = 0; i < 3; i++) {
      const angle = (i - 1) * 0.3; // Different angles
      const distance = 50 + i * 30;
      
      const parallelPoint1 = {
        x: point.x + Math.cos(angle) * distance,
        y: point.y + Math.sin(angle) * distance,
        id: `parallel-point-${i}-1`
      };
      
      const parallelPoint2 = {
        x: point.x + Math.cos(angle + Math.PI) * distance,
        y: point.y + Math.sin(angle + Math.PI) * distance,
        id: `parallel-point-${i}-2`
      };
      
      parallels.push({
        point1: parallelPoint1,
        point2: parallelPoint2,
        id: `parallel-line-${i}`
      });
    }
    
    return parallels;
  }

  calculateDistance(p1: Point, p2: Point): number {
    // Hyperbolic distance in Poincaré disk model
    const centerX = 400;
    const centerY = 300;
    
    // Convert to disk coordinates
    const x1 = (p1.x - centerX) / this.diskRadius;
    const y1 = (p1.y - centerY) / this.diskRadius;
    const x2 = (p2.x - centerX) / this.diskRadius;
    const y2 = (p2.y - centerY) / this.diskRadius;
    
    const r1Sq = x1 * x1 + y1 * y1;
    const r2Sq = x2 * x2 + y2 * y2;
    const dotProduct = x1 * x2 + y1 * y2;
    
    // Hyperbolic distance formula
    const numerator = (x1 - x2) ** 2 + (y1 - y2) ** 2;
    const denominator = (1 - r1Sq) * (1 - r2Sq);
    
    if (denominator <= 0) return Infinity;
    
    const ratio = numerator / denominator;
    return Math.acosh(1 + 2 * ratio) * this.diskRadius;
  }

  movePoint(point: Point, dx: number, dy: number): Point {
    // Movement in hyperbolic space
    const centerX = 400;
    const centerY = 300;
    
    const newX = point.x + dx;
    const newY = point.y + dy;
    
    // Keep point within Poincaré disk
    const distFromCenter = Math.sqrt((newX - centerX) ** 2 + (newY - centerY) ** 2);
    if (distFromCenter >= this.diskRadius * 0.95) {
      const angle = Math.atan2(newY - centerY, newX - centerX);
      return {
        ...point,
        x: centerX + Math.cos(angle) * this.diskRadius * 0.9,
        y: centerY + Math.sin(angle) * this.diskRadius * 0.9
      };
    }
    
    return {
      ...point,
      x: newX,
      y: newY
    };
  }
}