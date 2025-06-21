import { GeometryEngine, Point, Line, Circle, CanvasConfig } from '../types';

export class HyperbolicEngine implements GeometryEngine {
  private config: CanvasConfig;

  constructor(config: CanvasConfig) {
    this.config = config;
  }

  getGeometryName(): string {
    return 'Hyperbolic';
  }

  getGeometryDescription(): string {
    return 'Curved geometry with infinite parallel lines through any point';
  }

  drawLine(ctx: CanvasRenderingContext2D, line: Line, animate = false): void {
    // In hyperbolic geometry (Poincaré disk model), lines are arcs orthogonal to the boundary
    const { point1, point2 } = line;
    
    ctx.save();
    ctx.strokeStyle = '#06d6a0';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#06d6a0';
    ctx.shadowBlur = 8;
    
    if (animate && line.isAnimating) {
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = Date.now() * 0.01;
    }
    
    // Check if line passes through or near the center
    const midX = (point1.x + point2.x) / 2;
    const midY = (point1.y + point2.y) / 2;
    const distFromCenter = Math.sqrt(
      (midX - this.config.centerX) ** 2 + (midY - this.config.centerY) ** 2
    );
    
    if (distFromCenter < 30) {
      // Line through center - draw as straight line
      this.drawStraightHyperbolicLine(ctx, point1, point2);
    } else {
      // Hyperbolic line - draw as arc orthogonal to boundary
      this.drawHyperbolicArc(ctx, point1, point2);
    }
    
    // Draw construction points
    this.drawConstructionPoints(ctx, [point1, point2]);
    
    ctx.restore();
  }

  drawCircle(ctx: CanvasRenderingContext2D, circle: Circle, animate = false): void {
    // In hyperbolic geometry, circles are still circles but with different properties
    const distFromCenter = Math.sqrt(
      (circle.center.x - this.config.centerX) ** 2 + 
      (circle.center.y - this.config.centerY) ** 2
    );
    
    // Adjust circle appearance based on distance from center
    const distortionFactor = 1 + (distFromCenter / this.config.boundaryRadius) * 0.3;
    
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    
    if (animate && circle.isAnimating) {
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = -Date.now() * 0.005;
    }
    
    // Draw slightly distorted circle
    ctx.translate(circle.center.x, circle.center.y);
    ctx.scale(distortionFactor, 1 / distortionFactor);
    ctx.beginPath();
    ctx.arc(0, 0, circle.radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.restore();
    
    // Draw center point and radius
    this.drawConstructionPoints(ctx, [circle.center]);
    this.drawRadiusLine(ctx, circle);
  }

  getParallelLines(line: Line, point: Point): Line[] {
    // In hyperbolic geometry, there are infinitely many parallel lines
    // Show a few examples at different angles
    const parallels: Line[] = [];
    const baseAngle = Math.atan2(line.point2.y - line.point1.y, line.point2.x - line.point1.x);
    
    for (let i = 0; i < 3; i++) {
      const angleOffset = (i - 1) * 0.4; // Different angles for parallel lines
      const distance = 60 + i * 20;
      
      const angle1 = baseAngle + angleOffset;
      const angle2 = baseAngle + angleOffset + Math.PI;
      
      const parallelPoint1 = {
        x: point.x + Math.cos(angle1) * distance,
        y: point.y + Math.sin(angle1) * distance,
        id: `parallel-point-${i}-1`
      };
      
      const parallelPoint2 = {
        x: point.x + Math.cos(angle2) * distance,
        y: point.y + Math.sin(angle2) * distance,
        id: `parallel-point-${i}-2`
      };
      
      // Ensure points stay within the disk
      const p1Corrected = this.movePoint(parallelPoint1, 0, 0);
      const p2Corrected = this.movePoint(parallelPoint2, 0, 0);
      
      parallels.push({
        point1: p1Corrected,
        point2: p2Corrected,
        id: `parallel-line-${i}`
      });
    }
    
    return parallels;
  }

  calculateDistance(p1: Point, p2: Point): number {
    // Hyperbolic distance in Poincaré disk model
    const x1 = (p1.x - this.config.centerX) / this.config.boundaryRadius;
    const y1 = (p1.y - this.config.centerY) / this.config.boundaryRadius;
    const x2 = (p2.x - this.config.centerX) / this.config.boundaryRadius;
    const y2 = (p2.y - this.config.centerY) / this.config.boundaryRadius;
    
    const r1Sq = x1 * x1 + y1 * y1;
    const r2Sq = x2 * x2 + y2 * y2;
    
    // Prevent division by zero and handle boundary cases
    if (r1Sq >= 1 || r2Sq >= 1) {
      return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) * this.config.boundaryRadius;
    }
    
    const numerator = (x1 - x2) ** 2 + (y1 - y2) ** 2;
    const denominator = (1 - r1Sq) * (1 - r2Sq);
    
    if (denominator <= 0) return Infinity;
    
    const ratio = numerator / denominator;
    return Math.acosh(1 + 2 * ratio) * this.config.boundaryRadius;
  }

  movePoint(point: Point, dx: number, dy: number): Point {
    const newX = point.x + dx;
    const newY = point.y + dy;
    
    // Keep point within Poincaré disk
    const distFromCenter = Math.sqrt(
      (newX - this.config.centerX) ** 2 + (newY - this.config.centerY) ** 2
    );
    
    if (distFromCenter >= this.config.boundaryRadius * 0.95) {
      const angle = Math.atan2(newY - this.config.centerY, newX - this.config.centerX);
      return {
        ...point,
        x: this.config.centerX + Math.cos(angle) * this.config.boundaryRadius * 0.9,
        y: this.config.centerY + Math.sin(angle) * this.config.boundaryRadius * 0.9
      };
    }
    
    return { ...point, x: newX, y: newY };
  }

  isPointInBounds(point: Point): boolean {
    const distFromCenter = Math.sqrt(
      (point.x - this.config.centerX) ** 2 + (point.y - this.config.centerY) ** 2
    );
    return distFromCenter <= this.config.boundaryRadius;
  }

  private drawStraightHyperbolicLine(ctx: CanvasRenderingContext2D, point1: Point, point2: Point): void {
    // Calculate direction and extend to boundary
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return;
    
    const dirX = dx / length;
    const dirY = dy / length;
    
    // Find intersection with disk boundary
    const t = this.config.boundaryRadius * 0.98;
    const startX = this.config.centerX - dirX * t;
    const startY = this.config.centerY - dirY * t;
    const endX = this.config.centerX + dirX * t;
    const endY = this.config.centerY + dirY * t;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  private drawHyperbolicArc(ctx: CanvasRenderingContext2D, point1: Point, point2: Point): void {
    // Calculate the center of the arc that's orthogonal to the boundary circle
    const midX = (point1.x + point2.x) / 2;
    const midY = (point1.y + point2.y) / 2;
    
    // Vector from disk center to midpoint
    const toMidX = midX - this.config.centerX;
    const toMidY = midY - this.config.centerY;
    const toMidLength = Math.sqrt(toMidX * toMidX + toMidY * toMidY);
    
    if (toMidLength === 0) {
      this.drawStraightHyperbolicLine(ctx, point1, point2);
      return;
    }
    
    // Calculate arc center (outside the disk)
    const arcCenterDistance = this.config.boundaryRadius * 1.5;
    const arcCenterX = this.config.centerX + (toMidX / toMidLength) * arcCenterDistance;
    const arcCenterY = this.config.centerY + (toMidY / toMidLength) * arcCenterDistance;
    
    // Calculate arc parameters
    const radius = Math.sqrt((point1.x - arcCenterX) ** 2 + (point1.y - arcCenterY) ** 2);
    const startAngle = Math.atan2(point1.y - arcCenterY, point1.x - arcCenterX);
    const endAngle = Math.atan2(point2.y - arcCenterY, point2.x - arcCenterX);
    
    // Determine arc direction
    let angleDiff = endAngle - startAngle;
    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    ctx.beginPath();
    ctx.arc(arcCenterX, arcCenterY, radius, startAngle, endAngle, angleDiff < 0);
    ctx.stroke();
  }

  private drawConstructionPoints(ctx: CanvasRenderingContext2D, points: Point[]): void {
    points.forEach(point => {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  private drawRadiusLine(ctx: CanvasRenderingContext2D, circle: Circle): void {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.moveTo(circle.center.x, circle.center.y);
    ctx.lineTo(circle.center.x + circle.radius, circle.center.y);
    ctx.stroke();
    ctx.restore();
  }
}