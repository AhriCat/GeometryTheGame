export type GeometryType = 'euclidean' | 'spherical' | 'hyperbolic';

export interface Point {
  x: number;
  y: number;
  id: string;
  selected?: boolean;
}

export interface Line {
  point1: Point;
  point2: Point;
  id: string;
}

export interface Circle {
  center: Point;
  radius: number;
  id: string;
}

export type Tool = 'add_point' | 'draw_line' | 'draw_circle' | 'move' | 'clear';

export interface GeometryEngine {
  drawLine(ctx: CanvasRenderingContext2D, line: Line): void;
  drawCircle(ctx: CanvasRenderingContext2D, circle: Circle): void;
  getParallelLines(line: Line, point: Point): Line[];
  calculateDistance(p1: Point, p2: Point): number;
  movePoint(point: Point, dx: number, dy: number): Point;
}