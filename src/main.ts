import './style.css';
import { GeometrySimulator } from './geometry/GeometrySimulator';
import { GeometryType } from './geometry/types';

class App {
  private simulator: GeometrySimulator;
  private currentGeometry: GeometryType = 'hyperbolic';

  constructor() {
    this.simulator = new GeometrySimulator();
    this.init();
  }

  private init(): void {
    this.setupEventListeners();
    this.updateGeometryDisplay();
  }

  private setupEventListeners(): void {
    // Geometry selection
    const geometryButtons = document.querySelectorAll('.geometry-btn');
    geometryButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const geometry = target.dataset.geometry as GeometryType;
        this.selectGeometry(geometry);
      });
    });

    // Tool selection
    const toolButtons = document.querySelectorAll('.controls button');
    toolButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        this.selectTool(target.id);
      });
    });

    // Canvas interactions
    const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    mainCanvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    mainCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
  }

  private selectGeometry(geometry: GeometryType): void {
    this.currentGeometry = geometry;
    
    // Update button states
    document.querySelectorAll('.geometry-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-geometry="${geometry}"]`)?.classList.add('active');
    
    this.simulator.setGeometry(geometry);
    this.updateGeometryDisplay();
  }

  private selectTool(toolId: string): void {
    // Update button states
    document.querySelectorAll('.controls button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(toolId)?.classList.add('active');
    
    const tool = toolId.replace('-btn', '').replace('-', '_');
    this.simulator.setTool(tool as any);
  }

  private handleCanvasClick(e: MouseEvent): void {
    const canvas = e.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.simulator.handleClick(x, y);
  }

  private handleMouseMove(e: MouseEvent): void {
    const canvas = e.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.simulator.handleMouseMove(x, y);
    
    // Update mouse info
    const mouseInfo = document.getElementById('mouse-info');
    if (mouseInfo) {
      mouseInfo.textContent = `Mouse: (${Math.round(x)}, ${Math.round(y)})`;
    }
  }

  private updateGeometryDisplay(): void {
    const geometryInfo = document.getElementById('geometry-info');
    if (geometryInfo) {
      const names = {
        euclidean: 'Euclidean Geometry',
        spherical: 'Spherical Geometry', 
        hyperbolic: 'Hyperbolic Geometry'
      };
      geometryInfo.textContent = `Current: ${names[this.currentGeometry]}`;
    }
  }
}

// Initialize the app
new App();