import './style.css';
import { GeometrySimulator } from './geometry/GeometrySimulator';
import { GeometryType, Tool } from './geometry/types';

class App {
  private simulator: GeometrySimulator;

  constructor() {
    this.simulator = new GeometrySimulator();
    this.init();
  }

  private init(): void {
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.updateUI();
    this.startUIUpdateLoop();
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
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const tool = target.dataset.tool as Tool;
        this.selectTool(tool);
      });
    });

    // Canvas interactions
    const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    mainCanvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    mainCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    mainCanvas.addEventListener('mouseup', () => this.simulator.handleMouseUp());
    mainCanvas.addEventListener('mouseleave', () => this.simulator.handleMouseUp());

    // Prevent context menu on canvas
    mainCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'p':
          this.selectTool('add_point');
          break;
        case 'l':
          this.selectTool('draw_line');
          break;
        case 'c':
          this.selectTool('draw_circle');
          break;
        case 'm':
          this.selectTool('move');
          break;
        case 'x':
        case 'delete':
          this.selectTool('clear');
          break;
        case '1':
          this.selectGeometry('spherical');
          break;
        case '2':
          this.selectGeometry('euclidean');
          break;
        case '3':
          this.selectGeometry('hyperbolic');
          break;
        case 'escape':
          // Cancel current operation
          this.simulator.setTool(this.simulator.getCurrentTool());
          break;
      }
    });
  }

  private selectGeometry(geometry: GeometryType): void {
    // Update button states with smooth transition
    document.querySelectorAll('.geometry-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const selectedBtn = document.querySelector(`[data-geometry="${geometry}"]`);
    selectedBtn?.classList.add('active');
    
    // Update simulator
    this.simulator.setGeometry(geometry);
    this.updateUI();
    
    // Update preview description
    this.updatePreviewDescription(geometry);
  }

  private selectTool(tool: Tool): void {
    // Update button states
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const selectedBtn = document.querySelector(`[data-tool="${tool}"]`);
    selectedBtn?.classList.add('active');
    
    // Update simulator
    this.simulator.setTool(tool);
    this.updateUI();
    
    // Update canvas cursor
    this.updateCanvasCursor(tool);
  }

  private handleCanvasClick(e: MouseEvent): void {
    const canvas = e.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.simulator.handleClick(x, y);
    this.updateUI();
  }

  private handleMouseMove(e: MouseEvent): void {
    const canvas = e.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.simulator.handleMouseMove(x, y);
  }

  private handleResize(): void {
    // Debounce resize events
    clearTimeout((this as any).resizeTimeout);
    (this as any).resizeTimeout = setTimeout(() => {
      // Could implement canvas resizing here if needed
      this.updateUI();
    }, 250);
  }

  private updateUI(): void {
    this.updateGeometryInfo();
    this.updateToolInfo();
    this.updateObjectCount();
  }

  private updateGeometryInfo(): void {
    const geometryInfo = document.getElementById('geometry-info');
    if (geometryInfo) {
      geometryInfo.textContent = this.simulator.getCurrentGeometry().charAt(0).toUpperCase() + 
                                this.simulator.getCurrentGeometry().slice(1);
    }
  }

  private updateToolInfo(): void {
    const toolInfo = document.getElementById('tool-info');
    if (toolInfo) {
      const toolNames = {
        add_point: 'Point',
        draw_line: 'Line',
        draw_circle: 'Circle',
        move: 'Move',
        clear: 'Clear'
      };
      toolInfo.textContent = toolNames[this.simulator.getCurrentTool()];
    }
  }

  private updateObjectCount(): void {
    const objectCount = document.getElementById('object-count');
    if (objectCount) {
      const counts = this.simulator.getObjectCounts();
      objectCount.textContent = `${counts.points} points, ${counts.lines} lines, ${counts.circles} circles`;
    }
  }

  private updatePreviewDescription(geometry: GeometryType): void {
    const previewDescription = document.getElementById('preview-description');
    if (previewDescription) {
      const descriptions = {
        euclidean: 'Flat geometry - exactly one parallel line through any external point',
        spherical: 'Curved geometry - no parallel lines exist, all lines eventually meet',
        hyperbolic: 'Saddle-shaped geometry - infinite parallel lines through any external point'
      };
      previewDescription.textContent = descriptions[geometry];
    }
  }

  private updateCanvasCursor(tool: Tool): void {
    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (canvas) {
      const cursors = {
        add_point: 'crosshair',
        draw_line: 'crosshair',
        draw_circle: 'crosshair',
        move: 'grab',
        clear: 'pointer'
      };
      canvas.style.cursor = cursors[tool];
    }
  }

  private startUIUpdateLoop(): void {
    // Update UI periodically for dynamic content
    setInterval(() => {
      this.updateObjectCount();
    }, 100);
  }
}

// Initialize the app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}