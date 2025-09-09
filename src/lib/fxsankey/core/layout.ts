import * as THREE from 'three';
import type { ViewConfig, SmartView, CalculatedNode, CalculatedLink } from '../types';

export class LayoutManager {
  private currentView: ViewConfig = {
    zoom: 1,
    rotation: new THREE.Euler(0, 0, 0),
    position: new THREE.Vector3(0, 0, 10),
    dimUnfocused: false,
    perspective: 'isometric',
  };

  private smartViews: Map<string, SmartView> = new Map();
  private camera: THREE.PerspectiveCamera | null = null;

  constructor() {
    this.initializeSmartViews();
  }

  private initializeSmartViews(): void {
    const views: SmartView[] = [
      {
        name: 'default',
        description: 'Default isometric view',
        config: {
          zoom: 1,
          rotation: new THREE.Euler(-0.5, 0.5, 0),
          position: new THREE.Vector3(8, 5, 8),
          perspective: 'isometric',
        },
      },
      {
        name: 'top',
        description: 'Top-down view',
        config: {
          zoom: 1.2,
          rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
          position: new THREE.Vector3(0, 15, 0),
          perspective: 'top',
        },
      },
      {
        name: 'side',
        description: 'Side view',
        config: {
          zoom: 1,
          rotation: new THREE.Euler(0, Math.PI / 2, 0),
          position: new THREE.Vector3(15, 0, 0),
          perspective: 'side',
        },
      },
      {
        name: 'flow',
        description: 'Follow the flow perspective',
        config: {
          zoom: 0.8,
          rotation: new THREE.Euler(-0.2, 0.3, 0),
          position: new THREE.Vector3(10, 3, 10),
          perspective: 'free',
        },
      },
    ];

    views.forEach(view => {
      this.smartViews.set(view.name, view);
    });
  }

  public setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;
    this.applyView(this.currentView);
  }

  public applyView(view: ViewConfig, animate = true): void {
    if (!this.camera) return;

    this.currentView = { ...view };

    if (animate) {
      this.animateToView(view);
    } else {
      if (view.position) {
        this.camera.position.copy(view.position);
      }
      if (view.rotation) {
        this.camera.rotation.copy(view.rotation);
      }
      if (view.zoom !== undefined) {
        this.camera.zoom = view.zoom;
        this.camera.updateProjectionMatrix();
      }
    }
  }

  private animateToView(view: ViewConfig): void {
    if (!this.camera) return;

    const startPosition = this.camera.position.clone();
    const startRotation = this.camera.rotation.clone();
    const startZoom = this.camera.zoom;

    const targetPosition = view.position ?? startPosition;
    const targetRotation = view.rotation ?? startRotation;
    const targetZoom = view.zoom ?? startZoom;

    const duration = 1000;
    const startTime = Date.now();

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const eased = this.easeInOutCubic(progress);

      if (this.camera) {
        this.camera.position.lerpVectors(startPosition, targetPosition, eased);
        
        this.camera.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * eased;
        this.camera.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * eased;
        this.camera.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * eased;
        
        this.camera.zoom = startZoom + (targetZoom - startZoom) * eased;
        this.camera.updateProjectionMatrix();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public switchToView(viewName: string): void {
    const view = this.smartViews.get(viewName);
    if (view) {
      this.applyView(view.config);
    }
  }

  public focusOnNode(node: CalculatedNode): void {
    const view: ViewConfig = {
      ...this.currentView,
      focusNode: node.id,
      dimUnfocused: true,
    };

    const targetPosition = new THREE.Vector3(
      node.x + 5,
      node.y + 2,
      node.z + 5
    );

    view.position = targetPosition;
    view.zoom = 1.5;

    this.applyView(view);
  }

  public focusOnPath(
    sourceNode: CalculatedNode,
    targetNode: CalculatedNode,
    links: CalculatedLink[]
  ): void {
    const pathLinks = this.findPath(sourceNode.id, targetNode.id, links);
    const pathNodeIds = new Set<string>();
    
    pathLinks.forEach(link => {
      pathNodeIds.add(link.source);
      pathNodeIds.add(link.target);
    });

    const centerX = (sourceNode.x + targetNode.x) / 2;
    const centerY = (sourceNode.y + targetNode.y) / 2;
    const centerZ = (sourceNode.z + targetNode.z) / 2;

    const distance = Math.sqrt(
      Math.pow(targetNode.x - sourceNode.x, 2) +
      Math.pow(targetNode.y - sourceNode.y, 2) +
      Math.pow(targetNode.z - sourceNode.z, 2)
    );

    const view: ViewConfig = {
      position: new THREE.Vector3(
        centerX + distance * 0.5,
        centerY + distance * 0.3,
        centerZ + distance * 0.5
      ),
      highlightPath: Array.from(pathNodeIds),
      dimUnfocused: true,
      zoom: Math.max(0.5, Math.min(2, 10 / distance)),
    };

    this.applyView(view);
  }

  private findPath(
    sourceId: string,
    targetId: string,
    links: CalculatedLink[]
  ): CalculatedLink[] {
    const path: CalculatedLink[] = [];
    const visited = new Set<string>();
    
    const findPathRecursive = (currentId: string): boolean => {
      if (currentId === targetId) return true;
      if (visited.has(currentId)) return false;
      
      visited.add(currentId);
      
      const outgoingLinks = links.filter(link => link.source === currentId);
      
      for (const link of outgoingLinks) {
        if (findPathRecursive(link.target)) {
          path.unshift(link);
          return true;
        }
      }
      
      return false;
    };
    
    findPathRecursive(sourceId);
    return path;
  }

  public getCurrentView(): ViewConfig {
    return { ...this.currentView };
  }

  public getSmartViews(): SmartView[] {
    return Array.from(this.smartViews.values());
  }

  public createCustomView(name: string, description: string): void {
    if (!this.camera) return;

    const customView: SmartView = {
      name,
      description,
      config: {
        position: this.camera.position.clone(),
        rotation: this.camera.rotation.clone(),
        zoom: this.camera.zoom,
        perspective: 'free',
      },
    };

    this.smartViews.set(name, customView);
  }

  public deleteCustomView(name: string): boolean {
    if (['default', 'top', 'side', 'flow'].includes(name)) {
      return false;
    }
    return this.smartViews.delete(name);
  }

  public resetView(): void {
    const defaultView = this.smartViews.get('default');
    if (defaultView) {
      this.applyView(defaultView.config);
    }
  }
}