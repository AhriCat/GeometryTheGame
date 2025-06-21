import { GeometryEngine, Point, Line, Circle } from '../types';

export class SphericalEngine implements GeometryEngine {
  private readonly radius = 200; // Sphere radius for projection

  drawLine(ctx: CanvasRenderingContext2D, line: Line): void {
    // On a sphere, "straight lines" are great circles
    // We'll approximate this with an arc
    const { point1, point2 } = line;
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    // Convert to spherical coordinates and back to create curved line
    const midX = (point1.x + point2.x) / 2;
    const midY = (point1.y + point2.y) / 2;
    
    // Calculate control point for quadratic curve to simulate great circle
    const distFromCenter = Math.sqrt((midX - centerX) ** 2 + (midY - centerY) ** 2);
    const curvature = Math.min(50, distFromCenter * 0.3);
    
    const perpX = -(point2.y - point1.y);
    const perpY = point2.x - point1.x;
    const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
    
    const controlX = midX + (perpX / perpLength) * curvature;
    const controlY = midY + (perpY / perpLength) * curvature;
    
    ctx.beginPath();
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.moveTo(point1.x, point1.y);
    ctx.quadraticCurveTo(controlX, controlY, point2.x, point2.y);
    ctx.stroke();
  }

  drawCircle(ctx: CanvasRenderingContext2D, circle: Circle): void {
    // On a sphere, circles are still circles but may appear distorted
    ctx.beginPath();
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    
    // Slightly elliptical to show spherical distortion
    const scaleX = 1;
    const scaleY = 0.8;
    
    ctx.save();
    ctx.translate(circle.center.x, circle.center.y);
    ctx.scale(scaleX, scaleY);
    ctx.arc(0, 0, circle.radius, 0, 2 * Math.PI);
    ctx.restore();
    ctx.stroke();
  }

  getParallelLines(line: Line, point: Point): Line[] {
    // On a sphere, there are no parallel lines - all great circles intersect
    return [];
  }

  calculateDistance(p1: Point, p2: Point): number {
    // Spherical distance (great circle distance approximation)
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const euclideanDist = Math.sqrt(dx * dx + dy * dy);
    
    // Convert to angular distance on sphere
    const angularDist = euclideanDist / this.radius;
    return this.radius * Math.sin(angularDist);
  }

  movePoint(point: Point, dx: number, dy: number): Point {
    // Movement on sphere follows curved paths
    const centerX = 400; // Canvas center
    const centerY = 300;
    
    // Convert movement to spherical coordinates
    const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);
    const currentRadius = Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2);
    
    const moveAngle = Math.atan2(dy, dx);
    const moveDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Apply movement in spherical space
    const newAngle = currentAngle + moveDistance * 0.01;
    const newRadius = Math.max(50, Math.min(this.radius, currentRadius));
    
    return {
      ...point,
      x: centerX + newRadius * Math.cos(newAngle),
      y: centerY + newRadius * Math.sin(newAngle)
    };
  }
}