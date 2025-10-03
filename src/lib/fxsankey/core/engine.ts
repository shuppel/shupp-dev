import * as THREE from 'three';
import type {
  FxSankeyData,
  FxNode,
  FxLink,
  CalculatedNode,
  CalculatedLink,
  SankeyLayout,
  LayoutConfig,
} from '../types';

export class FxSankeyEngine {
  private nodes: Map<string, CalculatedNode> = new Map();
  private links: CalculatedLink[] = [];
  private layoutConfig: Required<LayoutConfig>;

  constructor(data: FxSankeyData, config?: LayoutConfig) {
    this.layoutConfig = {
      type: config?.type ?? 'hierarchical',
      padding: config?.padding ?? 0.1,
      nodeSpacing: config?.nodeSpacing ?? 0.3,
      levelSpacing: config?.levelSpacing ?? 2.5,
      iterations: config?.iterations ?? 32,
      alignment: config?.alignment ?? 'justify',
    };

    this.processData(data);
  }

  private processData(data: FxSankeyData): void {
    this.initializeNodes(data.nodes);
    this.initializeLinks(data.links);
    this.calculateNodeValues();
    this.detectLevels();
  }

  private initializeNodes(nodes: FxNode[]): void {
    nodes.forEach(node => {
      const calculatedNode: CalculatedNode = {
        ...node,
        x: 0,
        y: 0,
        z: 0,
        width: 0.15,  // Will be recalculated based on value
        height: 0.5,
        depth: 0.1,   // Will be recalculated based on value
        inputValue: 0,
        outputValue: 0,
        level: 0,
      };
      this.nodes.set(node.id, calculatedNode);
    });
  }

  private initializeLinks(links: FxLink[]): void {
    this.links = links.map(link => {
      const sourceNode = this.nodes.get(link.source);
      const targetNode = this.nodes.get(link.target);

      if (!sourceNode || !targetNode) {
        throw new Error(`Invalid link: ${link.source} -> ${link.target}`);
      }

      return {
        ...link,
        sourceNode,
        targetNode,
        path: [],
      };
    });
  }

  private calculateNodeValues(): void {
    this.links.forEach(link => {
      link.sourceNode.outputValue += link.value;
      link.targetNode.inputValue += link.value;
    });

    this.nodes.forEach(node => {
      node.value = Math.max(node.inputValue, node.outputValue, node.value ?? 0);
    });
    
    // Calculate node widths and depths based on values
    const maxValue = Math.max(...Array.from(this.nodes.values()).map(n => n.value ?? 0));
    const minWidth = 0.3;
    const maxWidth = 1.2;
    
    this.nodes.forEach(node => {
      const normalizedValue = (node.value ?? 0) / (maxValue || 1);
      node.width = minWidth + normalizedValue * (maxWidth - minWidth);
      // Calculate depth to be proportional to the value (matching edge thickness)
      node.depth = Math.max(0.3, Math.min(1.5, normalizedValue * 1.2 + 0.3));
    });
  }

  private detectLevels(): void {
    const visited = new Set<string>();
    const levels = new Map<string, number>();

    const findSources = (): string[] => {
      const sources: string[] = [];
      this.nodes.forEach((_, id) => {
        const hasIncoming = this.links.some(link => link.target === id);
        if (!hasIncoming) {
          sources.push(id);
        }
      });
      return sources.length > 0 ? sources : [this.nodes.keys().next().value ?? ''];
    };

    const assignLevel = (nodeId: string, level: number): void => {
      if (visited.has(nodeId)) {
        const currentLevel = levels.get(nodeId) ?? 0;
        levels.set(nodeId, Math.max(currentLevel, level));
        return;
      }

      visited.add(nodeId);
      levels.set(nodeId, level);

      const outgoingLinks = this.links.filter(link => link.source === nodeId);
      outgoingLinks.forEach(link => {
        assignLevel(link.target, level + 1);
      });
    };

    const sources = findSources();
    sources.forEach(sourceId => assignLevel(sourceId, 0));

    levels.forEach((level, nodeId) => {
      const foundNode = this.nodes.get(nodeId);
      if (foundNode) {
        foundNode.level = level;
      }
    });
  }

  public calculateLayout(): SankeyLayout {
    switch (this.layoutConfig.type) {
      case 'hierarchical':
        return this.calculateHierarchicalLayout();
      case 'circular':
        return this.calculateCircularLayout();
      case 'force':
        return this.calculateForceLayout();
      default:
        return this.calculateHierarchicalLayout();
    }
  }

  private calculateHierarchicalLayout(): SankeyLayout {
    const levels = this.groupNodesByLevel();
    const maxLevel = Math.max(...Array.from(levels.keys()));
    const bounds = { min: new THREE.Vector3(), max: new THREE.Vector3() };

    levels.forEach((nodesAtLevel, level) => {
      const x = (level / maxLevel) * 10 - 5;
      const totalHeight = this.calculateTotalHeight(nodesAtLevel);
      let currentY = -totalHeight / 2;

      nodesAtLevel.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

      nodesAtLevel.forEach(node => {
        const nodeHeight = this.calculateNodeHeight(node);
        node.x = x;
        node.y = currentY + nodeHeight / 2;
        node.z = 0;
        node.height = nodeHeight;

        currentY += nodeHeight + this.layoutConfig.nodeSpacing;

        bounds.min.x = Math.min(bounds.min.x, node.x - node.width / 2);
        bounds.min.y = Math.min(bounds.min.y, node.y - node.height / 2);
        bounds.max.x = Math.max(bounds.max.x, node.x + node.width / 2);
        bounds.max.y = Math.max(bounds.max.y, node.y + node.height / 2);
      });
    });

    this.calculateLinkPaths();
    this.relaxLayout();

    return {
      nodes: Array.from(this.nodes.values()),
      links: this.links,
      bounds,
    };
  }

  private calculateCircularLayout(): SankeyLayout {
    const nodes = Array.from(this.nodes.values());
    const bounds = { min: new THREE.Vector3(), max: new THREE.Vector3() };
    const radius = 4;
    const angleStep = (Math.PI * 2) / nodes.length;

    nodes.forEach((node, index) => {
      const angle = index * angleStep;
      node.x = Math.cos(angle) * radius;
      node.y = Math.sin(angle) * radius;
      node.z = 0;
      node.height = this.calculateNodeHeight(node);

      bounds.min.x = Math.min(bounds.min.x, node.x - node.width / 2);
      bounds.min.y = Math.min(bounds.min.y, node.y - node.height / 2);
      bounds.max.x = Math.max(bounds.max.x, node.x + node.width / 2);
      bounds.max.y = Math.max(bounds.max.y, node.y + node.height / 2);
    });

    this.calculateLinkPaths();

    return {
      nodes,
      links: this.links,
      bounds,
    };
  }

  private calculateForceLayout(): SankeyLayout {
    const nodes = Array.from(this.nodes.values());
    const bounds = { min: new THREE.Vector3(), max: new THREE.Vector3() };

    nodes.forEach(node => {
      node.x = (Math.random() - 0.5) * 8;
      node.y = (Math.random() - 0.5) * 6;
      node.z = 0;
      node.height = this.calculateNodeHeight(node);
    });

    for (let iteration = 0; iteration < this.layoutConfig.iterations; iteration++) {
      const forces = new Map<string, THREE.Vector3>();

      nodes.forEach(node => {
        forces.set(node.id, new THREE.Vector3());
      });

      nodes.forEach(nodeA => {
        nodes.forEach(nodeB => {
          if (nodeA.id === nodeB.id) return;

          const delta = new THREE.Vector3(
            nodeB.x - nodeA.x,
            nodeB.y - nodeA.y,
            0
          );
          const distance = Math.max(delta.length(), 0.1);
          const repulsion = delta.normalize().multiplyScalar(-2 / (distance * distance));

          const forceA = forces.get(nodeA.id)!;
          forceA.add(repulsion);
        });
      });

      this.links.forEach(link => {
        const delta = new THREE.Vector3(
          link.targetNode.x - link.sourceNode.x,
          link.targetNode.y - link.sourceNode.y,
          0
        );
        const distance = delta.length();
        const attraction = delta.normalize().multiplyScalar(distance * 0.1);

        const sourceForce = forces.get(link.source)!;
        const targetForce = forces.get(link.target)!;
        sourceForce.add(attraction);
        targetForce.sub(attraction);
      });

      nodes.forEach(node => {
        const force = forces.get(node.id)!;
        const damping = 0.85;
        node.x += force.x * damping;
        node.y += force.y * damping;

        node.x = Math.max(-5, Math.min(5, node.x));
        node.y = Math.max(-4, Math.min(4, node.y));

        bounds.min.x = Math.min(bounds.min.x, node.x - node.width / 2);
        bounds.min.y = Math.min(bounds.min.y, node.y - node.height / 2);
        bounds.max.x = Math.max(bounds.max.x, node.x + node.width / 2);
        bounds.max.y = Math.max(bounds.max.y, node.y + node.height / 2);
      });
    }

    this.calculateLinkPaths();

    return {
      nodes,
      links: this.links,
      bounds,
    };
  }

  private groupNodesByLevel(): Map<number, CalculatedNode[]> {
    const levels = new Map<number, CalculatedNode[]>();

    this.nodes.forEach(node => {
      const level = node.level ?? 0;
      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level)!.push(node);
    });

    return levels;
  }

  private calculateTotalHeight(nodes: CalculatedNode[]): number {
    const totalNodeHeight = nodes.reduce((sum, node) => {
      return sum + this.calculateNodeHeight(node);
    }, 0);
    const totalSpacing = (nodes.length - 1) * this.layoutConfig.nodeSpacing;
    return totalNodeHeight + totalSpacing;
  }

  private calculateNodeHeight(node: CalculatedNode): number {
    const minHeight = 0.3;
    const maxHeight = 1.8;
    const maxValue = Math.max(...Array.from(this.nodes.values()).map(n => n.value ?? 0));
    const normalizedValue = Math.pow((node.value ?? 0) / maxValue, 0.7); // Use power for better distribution
    return minHeight + normalizedValue * (maxHeight - minHeight);
  }

  private calculateLinkPaths(): void {
    this.links.forEach(link => {
      const source = link.sourceNode;
      const target = link.targetNode;

      const startPoint = new THREE.Vector3(
        source.x + source.width / 2,
        source.y,
        source.z
      );

      const endPoint = new THREE.Vector3(
        target.x - target.width / 2,
        target.y,
        target.z
      );

      const distance = endPoint.x - startPoint.x;
      const curvature = link.curvature ?? 0.5;

      const controlPoint1 = new THREE.Vector3(
        startPoint.x + distance * curvature,
        startPoint.y,
        startPoint.z
      );

      const controlPoint2 = new THREE.Vector3(
        endPoint.x - distance * curvature,
        endPoint.y,
        endPoint.z
      );

      link.curve = new THREE.CubicBezierCurve3(
        startPoint,
        controlPoint1,
        controlPoint2,
        endPoint
      );

      link.path = link.curve.getPoints(50);
    });
  }

  private relaxLayout(): void {
    for (let i = 0; i < this.layoutConfig.iterations; i++) {
      this.relaxNodes();
    }
  }

  private relaxNodes(): void {
    const alpha = 0.5;
    const levels = this.groupNodesByLevel();

    levels.forEach(nodesAtLevel => {
      nodesAtLevel.forEach(node => {
        let weightedY = 0;
        let totalWeight = 0;

        const incomingLinks = this.links.filter(l => l.target === node.id);
        const outgoingLinks = this.links.filter(l => l.source === node.id);

        [...incomingLinks, ...outgoingLinks].forEach(link => {
          const otherNode = link.source === node.id ? link.targetNode : link.sourceNode;
          weightedY += otherNode.y * link.value;
          totalWeight += link.value;
        });

        if (totalWeight > 0) {
          const targetY = weightedY / totalWeight;
          node.y = node.y * (1 - alpha) + targetY * alpha;
        }
      });

      nodesAtLevel.sort((a, b) => a.y - b.y);
      let currentY = -this.calculateTotalHeight(nodesAtLevel) / 2;
      nodesAtLevel.forEach(node => {
        const nodeHeight = this.calculateNodeHeight(node);
        node.y = currentY + nodeHeight / 2;
        currentY += nodeHeight + this.layoutConfig.nodeSpacing;
      });
    });
  }

  public getNodes(): CalculatedNode[] {
    return Array.from(this.nodes.values());
  }

  public getLinks(): CalculatedLink[] {
    return this.links;
  }

  public getNode(id: string): CalculatedNode | undefined {
    return this.nodes.get(id);
  }

  public updateNodePosition(id: string, position: THREE.Vector3): void {
    const node = this.nodes.get(id);
    if (node) {
      node.x = position.x;
      node.y = position.y;
      node.z = position.z;
      this.calculateLinkPaths();
    }
  }
}