import { GeometryEngine, Point, Line, Circle, CanvasConfig } from '../types';

export class SphericalEngine implements GeometryEngine {
  private config: CanvasConfig;

  constructor(config: CanvasConfig) {
    this.config = config;
  }

  getGeometryName(): string {
    return 'Spherical';
  }

  getGeometryDescription(): string {
    return 'Curved geometry like Earth\'s surface - no parallel lines exist';
  }

  drawLine(ctx: CanvasRenderingContext2D, line: Line, animate = false): void {
    // On a sphere, "straight lines" are great circles (geodesics)
    const { point1, point2 } = line;
    
    // Convert points to spherical coordinates relative to canvas center
    const p1Sphere = this.cartesianToSpherical(point1);
    const p2Sphere = this.cartesianToSpherical(point2);
    
    ctx.save();
    ctx.strokeStyle = '#06d6a0';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#06d6a0';
    ctx.shadowBlur = 8;
    
    if (animate && line.isAnimating) {
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = Date.now() * 0.008;
    }
    
    // Draw great circle arc
    this.drawGreatCircleArc(ctx, p1Sphere, p2Sphere);
    
    // Draw construction points
    this.drawConstructionPoints(ctx, [point1, point2]);
    
    ctx.restore();
  }

  drawCircle(ctx: CanvasRenderingContext2D, circle: Circle, animate = false): void {
    // On a sphere, small circles appear as ellipses due to projection
    const distFromCenter = this.calculateDistance(circle.center, { 
      x: this.config.centerX, 
      y: this.config.centerY, 
      id: 'center' 
    });
    
    const projectionFactor = Math.cos(distFromCenter / this.config.boundaryRadius);
    const ellipseRatioY = Math.max(0.3, projectionFactor);
    
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    
    if (animate && circle.isAnimating) {
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = -Date.now() * 0.005;
    }
    
    // Draw elliptical circle
    ctx.translate(circle.center.x, circle.center.y);
    ctx.scale(1, ellipseRatioY);
    ctx.beginPath();
    ctx.arc(0, 0, circle.radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.restore();
    
    // Draw center point and radius
    this.drawConstructionPoints(ctx, [circle.center]);
    this.drawRadiusLine(ctx, circle, ellipseRatioY);
  }

  getParallelLines(line: Line, point: Point): Line[] {
    // On a sphere, there are no parallel lines - all great circles intersect
    return [];
  }

  calculateDistance(p1: Point, p2: Point): number {
    // Spherical distance using great circle formula
    const lat1 = this.pointToLatitude(p1);
    const lon1 = this.pointToLongitude(p1);
    const lat2 = this.pointToLatitude(p2);
    const lon2 = this.pointToLongitude(p2);
    
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    
    const a = Math.sin(dLat / 2) ** 2 + 
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return this.config.boundaryRadius * c;
  }

  movePoint(point: Point, dx: number, dy: number): Point {
    const newX = point.x + dx;
    const newY = point.y + dy;
    
    // Keep point within spherical boundary
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

  private cartesianToSpherical(point: Point): { theta: number; phi: number } {
    const x = (point.x - this.config.centerX) / this.config.boundaryRadius;
    const y = (point.y - this.config.centerY) / this.config.boundaryRadius;
    
    const r = Math.sqrt(x * x + y * y);
    const theta = Math.atan2(y, x);
    const phi = Math.asin(Math.min(1, r));
    
    return { theta, phi };
  }

  private drawGreatCircleArc(ctx: CanvasRenderingContext2D, p1: { theta: number; phi: number }, p2: { theta: number; phi: number }): void {
    // Approximate great circle with quadratic curve
    const midTheta = (p1.theta + p2.theta) / 2;
    const midPhi = (p1.phi + p2.phi) / 2;
    
    // Calculate control point for curved line
    const curvature = Math.abs(p1.theta - p2.theta) * 0.3;
    const controlTheta = midTheta + curvature;
    const controlPhi = midPhi + curvature * 0.5;
    
    // Convert back to cartesian
    const start = this.sphericalToCartesian(p1);
    const control = this.sphericalToCartesian({ theta: controlTheta, phi: controlPhi });
    const end = this.sphericalToCartesian(p2);
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
    ctx.stroke();
  }

  private sphericalToCartesian(spherical: { theta: number; phi: number }): Point {
    const r = Math.sin(spherical.phi) * this.config.boundaryRadius;
    const x = this.config.centerX + r * Math.cos(spherical.theta);
    const y = this.config.centerY + r * Math.sin(spherical.theta);
    
    return { x, y, id: 'converted' };
  }

  private pointToLatitude(point: Point): number {
    return (point.y - this.config.centerY) / this.config.boundaryRadius;
  }

  private pointToLongitude(point: Point): number {
    return (point.x - this.config.centerX) / this.config.boundaryRadius;
  }

  private drawConstructionPoints(ctx: CanvasRenderingContext2D, points: Point[]): void {
    points.forEach(point => {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  private drawRadiusLine(ctx: CanvasRenderingContext2D, circle: Circle, ellipseRatio: number): void {
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