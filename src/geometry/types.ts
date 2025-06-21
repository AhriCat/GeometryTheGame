export type GeometryType = 'euclidean' | 'spherical' | 'hyperbolic';

export interface Point {
  x: number;
  y: number;
  id: string;
  selected?: boolean;
  isAnimating?: boolean;
}

export interface Line {
  point1: Point;
  point2: Point;
  id: string;
  isAnimating?: boolean;
}

export interface Circle {
  center: Point;
  radius: number;
  id: string;
  isAnimating?: boolean;
}

export type Tool = 'add_point' | 'draw_line' | 'draw_circle' | 'move' | 'clear';

export interface GeometryEngine {
  drawLine(ctx: CanvasRenderingContext2D, line: Line, animate?: boolean): void;
  drawCircle(ctx: CanvasRenderingContext2D, circle: Circle, animate?: boolean): void;
  getParallelLines(line: Line, point: Point): Line[];
  calculateDistance(p1: Point, p2: Point): number;
  movePoint(point: Point, dx: number, dy: number): Point;
  isPointInBounds(point: Point): boolean;
  getGeometryName(): string;
  getGeometryDescription(): string;
}

export interface CanvasConfig {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  boundaryRadius: number;
}

export interface AnimationState {
  isAnimating: boolean;
  startTime: number;
  duration: number;
  type: 'point' | 'line' | 'circle';
}