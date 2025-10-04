import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FxSankeyEngine } from '../../lib/fxsankey/core/engine';
import { ParticleSystem, FlowAnimation, LiquidEffect } from '../../lib/fxsankey/core/physics';
import { LayoutManager } from '../../lib/fxsankey/core/layout';
import type {
  FxSankeyConfig,
  CalculatedNode,
  CalculatedLink,
} from '../../lib/fxsankey/types';
import './FxSankey.css';

interface FxSankeyProps {
  config: FxSankeyConfig;
  width?: number | string;
  height?: number | string;
  className?: string;
  onNodeClick?: (node: CalculatedNode) => void;
  onNodeHover?: (node: CalculatedNode | null) => void;
  onLinkClick?: (link: CalculatedLink) => void;
  onLinkHover?: (link: CalculatedLink | null) => void;
}

const FxSankey: React.FC<FxSankeyProps> = ({
  config,
  width = '100%',
  height = '600px',
  className = '',
  onNodeClick,
  onNodeHover,
  onLinkClick,
  onLinkHover,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const engineRef = useRef<FxSankeyEngine | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const flowAnimationRef = useRef<FlowAnimation | null>(null);
  const liquidEffectRef = useRef<LiquidEffect | null>(null);
  const layoutManagerRef = useRef<LayoutManager | null>(null);
  const frameRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  
  const [hoveredNode, setHoveredNode] = useState<CalculatedNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<CalculatedLink | null>(null);
  const [, setSelectedNode] = useState<CalculatedNode | null>(null);
  const [currentView, setCurrentView] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showLegend, setShowLegend] = useState(false);

  const nodeMeshes = useRef<Map<string, THREE.Mesh>>(new Map());
  const linkMeshes = useRef<Map<string, THREE.Mesh>>(new Map());

  const createNode = useCallback((node: CalculatedNode, scene: THREE.Scene): THREE.Mesh => {
    // Use the width and depth calculated by the engine
    const calculatedWidth = node.width;
    const nodeDepth = node.depth;
    
    const geometry = new THREE.BoxGeometry(
      calculatedWidth,
      node.height,
      nodeDepth
    );

    let material: THREE.Material;
    let nodeColor: THREE.Color;  // Declare color at higher scope
    
    if (config.theme?.nodeStyle === 'liquid' && liquidEffectRef.current) {
      material = liquidEffectRef.current.createLiquidNodeMaterial(node.id);
      nodeColor = new THREE.Color('#ACC196');  // Default for liquid
    } else {
      // Use provided color or generate a unique color based on node position
      if (node.color !== undefined && node.color !== null) {
        nodeColor = typeof node.color === 'string' ? new THREE.Color(node.color) : node.color;
      } else {
        // Generate distinct colors using HSL color space for better distribution
        const allNodes = engineRef.current?.getNodes() ?? [];
        const nodeIndex = allNodes.findIndex(n => n.id === node.id);
        const hue = (nodeIndex * 137.5) % 360; // Golden angle for good distribution
        const saturation = 0.6 + (nodeIndex % 3) * 0.15; // Vary saturation
        const lightness = 0.45 + (nodeIndex % 2) * 0.1; // Vary lightness
        nodeColor = new THREE.Color().setHSL(hue / 360, saturation, lightness);
      }

      material = new THREE.MeshPhysicalMaterial({
        color: nodeColor,
        metalness: 0.1,
        roughness: 0.4,
        transmission: 0.2,  // Less transmission to show color better
        thickness: 0.3,
        transparent: true,
        opacity: node.opacity ?? 0.95,  // More opaque
        clearcoat: 0.5,  // Less clearcoat effect
        clearcoatRoughness: 0.1,
        emissive: nodeColor,  // Add emissive for better color visibility
        emissiveIntensity: 0.1,
      });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(node.x, node.y, node.z);
    mesh.userData = { type: 'node', data: node, nodeColor };  // Store color for later use
    
    if (node.glow?.enabled) {
      const glowGeometry = new THREE.BoxGeometry(
        calculatedWidth * 1.2,
        node.height * 1.2,
        nodeDepth * 1.2
      );
      
      // Use the node's color for glow, or the calculated color
      const glowColor = node.glow.color ?? mesh.userData.nodeColor;
      
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
      });
      
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      mesh.add(glowMesh);
    }

    scene.add(mesh);
    nodeMeshes.current.set(node.id, mesh);
    
    // Add text label using canvas texture with higher resolution
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1024;  // Doubled resolution
    canvas.height = 256;  // Doubled resolution
    
    if (context) {
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Add semi-transparent background for better legibility
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.beginPath();
      const x = 20, y = 20, w = canvas.width - 40, h = canvas.height - 40, r = 20;
      context.moveTo(x + r, y);
      context.lineTo(x + w - r, y);
      context.quadraticCurveTo(x + w, y, x + w, y + r);
      context.lineTo(x + w, y + h - r);
      context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      context.lineTo(x + r, y + h);
      context.quadraticCurveTo(x, y + h, x, y + h - r);
      context.lineTo(x, y + r);
      context.quadraticCurveTo(x, y, x + r, y);
      context.closePath();
      context.fill();
      
      // Add subtle border for definition
      context.strokeStyle = 'rgba(172, 193, 150, 0.3)';
      context.lineWidth = 2;
      context.stroke();
      
      // Configure text style with better contrast
      context.fillStyle = '#FFFFFF';
      context.font = 'bold 72px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      // Strong outline for maximum readability
      context.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      context.lineWidth = 6;
      
      // Draw text with proper labels
      const label = node.label || node.id;
      const textY = canvas.height / 2 - 20;
      context.strokeText(label, canvas.width / 2, textY);
      context.fillText(label, canvas.width / 2, textY);
      
      // Add value with units if available
      if (node.value) {
        context.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
        context.fillStyle = '#FFD700';  // Gold color for better visibility
        const units = config.data?.metadata?.units || '';
        const valueText = `${node.value}${units ? ' ' + units : ''}`;
        const valueY = canvas.height / 2 + 50;
        context.strokeText(valueText, canvas.width / 2, valueY);
        context.fillText(valueText, canvas.width / 2, valueY);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      opacity: 0.95
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    // Fixed size for all labels regardless of node size
    sprite.scale.set(2.5, 0.6, 1);
    // Position label above node
    sprite.position.set(0, node.height / 2 + 0.8, 0.5);
    
    // Store sprite reference for camera-aware updates
    sprite.userData = { type: 'label', nodeId: node.id };
    
    // Add to scene instead of mesh so it's independent
    scene.add(sprite);
    
    // Store reference to update position with node
    mesh.userData.labelSprite = sprite;
    
    return mesh;
  }, [config.theme?.nodeStyle]);

  const createLink = useCallback((link: CalculatedLink, scene: THREE.Scene): THREE.Mesh | null => {
    if (!link.curve) return null;

    const tubeGeometry = new THREE.TubeGeometry(
      link.curve,
      64,
      link.value * 0.02 + 0.01,
      8,
      false
    );

    let material: THREE.Material;
    
    // Get source node color for the link
    const sourceNode = nodeMeshes.current.get(link.source);
    let linkColor = new THREE.Color('#ACC196');
    
    if (sourceNode?.material && 'color' in sourceNode.material) {
      linkColor = (sourceNode.material as THREE.MeshPhysicalMaterial).color.clone();
    } else if (link.gradient?.colors && link.gradient.colors.length > 0) {
      linkColor = new THREE.Color(link.gradient.colors[0]);
    }
    
    // Only use flow animation for highlighted links, not all links
    const useAnimation = false; // Disable animation by default
    
    if (useAnimation && flowAnimationRef.current) {
      material = flowAnimationRef.current.createFlowMaterial(link);
    } else {
      // Static material for non-highlighted segments
      material = new THREE.MeshPhysicalMaterial({
        color: linkColor,
        metalness: 0.1,
        roughness: 0.4,
        transparent: true,
        opacity: link.opacity ?? 0.7,
        transmission: 0.3,
        thickness: 0.1,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
      });
    }

    const mesh = new THREE.Mesh(tubeGeometry, material);
    mesh.userData = { type: 'link', data: link };
    
    scene.add(mesh);
    linkMeshes.current.set(`${link.source}_${link.target}`, mesh);

    if (link.particles?.enabled && particleSystemRef.current) {
      // Pass the source node color to the particle system
      const sourceNodeMesh = nodeMeshes.current.get(link.source);
      const particleColor = sourceNodeMesh?.userData.nodeColor || linkColor;
      
      // Override the particle color config with the node color
      const particleLink = {
        ...link,
        particles: {
          ...link.particles,
          color: particleColor
        }
      };
      
      particleSystemRef.current.createParticles(particleLink, scene);
    }

    return mesh;
  }, []);

  const initializeScene = useCallback(() => {
    if (!mountRef.current || !config.data) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.theme?.background ?? '#14080E');
    scene.fog = new THREE.Fog(config.theme?.background ?? '#14080E', 10, 50);

    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.set(8, 5, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: config.performance?.antialias ?? true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(config.performance?.pixelRatio ?? window.devicePixelRatio);
    renderer.shadowMap.enabled = config.performance?.shadowQuality !== 'none';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight('#ACC196', 0.5, 20);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight('#E9EB9E', 0.3, 20);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enabled = config.interaction?.rotate ?? true;
    // Prevent controls from interfering with hover
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    controlsRef.current = controls;

    engineRef.current = new FxSankeyEngine(config.data, config.layout);
    particleSystemRef.current = new ParticleSystem();
    flowAnimationRef.current = new FlowAnimation();
    liquidEffectRef.current = new LiquidEffect();
    layoutManagerRef.current = new LayoutManager();
    layoutManagerRef.current.setCamera(camera);

    const layout = engineRef.current.calculateLayout();
    
    layout.nodes.forEach(node => {
      createNode(node, scene);
    });

    layout.links.forEach(link => {
      createLink(link, scene);
    });

    setIsLoading(false);

    if (config.defaultView && layoutManagerRef.current) {
      layoutManagerRef.current.switchToView(config.defaultView);
      setCurrentView(config.defaultView);
    }

  }, [config, createNode, createLink]);

  const handleResize = useCallback(() => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    
    // Prevent event from bubbling and causing conflicts
    event.stopPropagation();

    const rect = mountRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update tooltip position to follow mouse (using viewport coordinates)
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(x, y);
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    let foundNode: CalculatedNode | null = null;
    let foundLink: CalculatedLink | null = null;

    for (const intersect of intersects) {
      const object = intersect.object;
      if (object.userData.type === 'node') {
        foundNode = object.userData.data;
        break;
      } else if (object.userData.type === 'link') {
        foundLink = object.userData.data;
        break;
      }
    }

    if (foundNode !== hoveredNode) {
      setHoveredNode(foundNode);
      onNodeHover?.(foundNode);
      
      // Highlight connected flows when hovering over a node
      if (foundNode && engineRef.current) {
        const layout = engineRef.current.calculateLayout();
        
        // Find all connected links
        const connectedLinks = layout.links.filter(
          link => link.source === foundNode.id || link.target === foundNode.id
        );
        
        // Update all link materials
        layout.links.forEach(link => {
          const linkKey = `${link.source}_${link.target}`;
          const linkMesh = linkMeshes.current.get(linkKey);
          
          if (linkMesh?.material) {
            const isConnected = connectedLinks.some(
              cl => cl.source === link.source && cl.target === link.target
            );
            
            // Highlight connected links with animation, keep others static
            if (isConnected) {
              const mat = linkMesh.material as THREE.MeshPhysicalMaterial;
              mat.opacity = 1.0;
              mat.emissive = mat.color.clone();
              mat.emissiveIntensity = 0.4;
              
              // Optional: Add flow animation only to highlighted segments
              if (flowAnimationRef.current) {
                // Store original material
                linkMesh.userData.originalMaterial = linkMesh.material;
                // Apply animated material
                linkMesh.material = flowAnimationRef.current.createFlowMaterial(link);
              }
            } else {
              // Keep static and dimmed
              (linkMesh.material as THREE.MeshPhysicalMaterial).opacity = 0.15;
              (linkMesh.material as THREE.MeshPhysicalMaterial).emissive = new THREE.Color('#000000');
              (linkMesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0;
            }
          }
        });
        
        // Also highlight connected nodes
        layout.nodes.forEach(n => {
          const nodeMesh = nodeMeshes.current.get(n.id);
          if (nodeMesh?.material) {
            const isConnected = n.id === foundNode.id || 
              connectedLinks.some(link => link.source === n.id || link.target === n.id);
            
            (nodeMesh.material as THREE.MeshPhysicalMaterial).opacity = isConnected ? 1 : 0.3;
          }
        });
      } else if (!foundNode && engineRef.current) {
        // Reset all materials when not hovering
        const layout = engineRef.current.calculateLayout();
        
        layout.links.forEach(link => {
          const linkKey = `${link.source}_${link.target}`;
          const linkMesh = linkMeshes.current.get(linkKey);
          
          if (linkMesh?.material) {
            // Restore original static material if it was replaced
            if (linkMesh.userData.originalMaterial) {
              linkMesh.material = linkMesh.userData.originalMaterial;
              linkMesh.userData.originalMaterial = null;
            }
            (linkMesh.material as THREE.MeshPhysicalMaterial).opacity = link.opacity ?? 0.7;
            (linkMesh.material as THREE.MeshPhysicalMaterial).emissive = new THREE.Color('#000000');
            (linkMesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0;
          }
        });
        
        layout.nodes.forEach(n => {
          const nodeMesh = nodeMeshes.current.get(n.id);
          if (nodeMesh?.material) {
            (nodeMesh.material as THREE.MeshPhysicalMaterial).opacity = n.opacity ?? 0.9;
          }
        });
      }
    }

    if (foundLink !== hoveredLink) {
      setHoveredLink(foundLink);
      onLinkHover?.(foundLink);
    }

    mountRef.current.style.cursor = foundNode || foundLink ? 'pointer' : 'default';
  }, [hoveredNode, hoveredLink, onNodeHover, onLinkHover]);

  const handleClick = useCallback((event: MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(x, y);
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    for (const intersect of intersects) {
      const object = intersect.object;
      if (object.userData.type === 'node') {
        const node = object.userData.data as CalculatedNode;
        setSelectedNode(node);
        onNodeClick?.(node);
        
        if (layoutManagerRef.current) {
          layoutManagerRef.current.focusOnNode(node);
        }
        break;
      } else if (object.userData.type === 'link') {
        const link = object.userData.data as CalculatedLink;
        onLinkClick?.(link);
        break;
      }
    }
  }, [onNodeClick, onLinkClick]);

  // Use refs for hover state to avoid recreating animation loop
  const hoveredNodeRef = useRef<CalculatedNode | null>(null);
  const hoveredLinkRef = useRef<CalculatedLink | null>(null);
  
  // Update refs when state changes
  useEffect(() => {
    hoveredNodeRef.current = hoveredNode;
  }, [hoveredNode]);
  
  useEffect(() => {
    hoveredLinkRef.current = hoveredLink;
  }, [hoveredLink]);

  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    frameRef.current = requestAnimationFrame(animate);

    const deltaTime = clockRef.current.getDelta();

    if (controlsRef.current) {
      controlsRef.current.update();
    }

    if (particleSystemRef.current) {
      particleSystemRef.current.update(deltaTime);
    }

    if (flowAnimationRef.current) {
      flowAnimationRef.current.update(deltaTime);
    }

    if (liquidEffectRef.current) {
      liquidEffectRef.current.update(deltaTime);
    }

    // Use refs instead of state to avoid dependency issues
    if (hoveredNodeRef.current && liquidEffectRef.current) {
      liquidEffectRef.current.setNodeGlow(hoveredNodeRef.current.id, 2);
    }

    if (hoveredLinkRef.current && flowAnimationRef.current) {
      flowAnimationRef.current.setLinkOpacity(
        `${hoveredLinkRef.current.source}_${hoveredLinkRef.current.target}`,
        1
      );
    }
    
    // Update label positions to follow nodes and face camera
    if (cameraRef.current) {
      nodeMeshes.current.forEach((nodeMesh) => {
        if (nodeMesh.userData.labelSprite) {
          const sprite = nodeMesh.userData.labelSprite;
          
          // Get camera direction
          const cameraDirection = new THREE.Vector3();
          cameraRef.current!.getWorldDirection(cameraDirection);
          
          // Calculate offset based on camera angle for "Mona Lisa effect"
          const offset = new THREE.Vector3(
            -cameraDirection.x * 0.3,
            nodeMesh.userData.data.height / 2 + 0.8,
            -cameraDirection.z * 0.3 + 1.5
          );
          
          // Update sprite position relative to node
          sprite.position.copy(nodeMesh.position).add(offset);
          
          // Sprites automatically face camera, but we can adjust scale based on distance
          const distance = sprite.position.distanceTo(cameraRef.current!.position);
          const scale = Math.min(3.5, Math.max(1.5, distance * 0.15));
          sprite.scale.set(scale * 1.5, scale * 0.4, 1);
        }
      });
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []); // Empty dependency array - animation loop doesn't restart

  useEffect(() => {
    initializeScene();
    animate();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      if (particleSystemRef.current) {
        particleSystemRef.current.dispose();
      }

      if (flowAnimationRef.current) {
        flowAnimationRef.current.dispose();
      }

      if (liquidEffectRef.current) {
        liquidEffectRef.current.dispose();
      }

      // Clean up label sprites
      nodeMeshes.current.forEach((nodeMesh) => {
        if (nodeMesh.userData.labelSprite) {
          sceneRef.current?.remove(nodeMesh.userData.labelSprite);
          nodeMesh.userData.labelSprite.material.dispose();
          if (nodeMesh.userData.labelSprite.material.map) {
            nodeMesh.userData.labelSprite.material.map.dispose();
          }
        }
      });
      
      nodeMeshes.current.clear();
      linkMeshes.current.clear();
    };
  }, [initializeScene, animate]);
  


  useEffect(() => {
    window.addEventListener('resize', handleResize);
    if (mountRef.current) {
      mountRef.current.addEventListener('mousemove', handleMouseMove);
      mountRef.current.addEventListener('click', handleClick);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', handleMouseMove);
        mountRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [handleResize, handleMouseMove, handleClick]);

  const handleViewChange = (viewName: string) => {
    if (layoutManagerRef.current) {
      layoutManagerRef.current.switchToView(viewName);
      setCurrentView(viewName);
    }
  };

  return (
    <div className={`fxsankey-container ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="fxsankey-loading">
          <div className="fxsankey-spinner"></div>
          <p>Loading visualization...</p>
        </div>
      )}
      
      <div ref={mountRef} className="fxsankey-canvas" />
      
      <div className="fxsankey-controls">
        {config.views && config.views.length > 0 && (
          <div className="fxsankey-view-selector">
            {layoutManagerRef.current?.getSmartViews().map((view) => (
              <button
                key={view.name}
                className={`fxsankey-view-button ${currentView === view.name ? 'active' : ''}`}
                onClick={() => handleViewChange(view.name)}
                title={view.description}
              >
                {view.name}
              </button>
            ))}
          </div>
        )}
        
        <button 
          className={`fxsankey-legend-toggle ${showLegend ? 'active' : ''}`}
          onClick={() => setShowLegend(!showLegend)}
          title={showLegend ? 'Hide Legend' : 'Show Legend'}
        >
          {showLegend ? '📊 Hide' : '📊 Legend'}
        </button>
      </div>
      
      {hoveredNode && (
        <div 
          className="fxsankey-tooltip fxsankey-tooltip-bubble"
          style={{
            left: `${Math.min(Math.max(15, tooltipPosition.x + 15), window.innerWidth - 320)}px`,
            top: `${Math.min(Math.max(15, tooltipPosition.y - 80), window.innerHeight - 200)}px`,
          }}
        >
          <div className="fxsankey-tooltip-content">
            <h4 className="fxsankey-tooltip-title">
              {hoveredNode.label || hoveredNode.id}
            </h4>
            {hoveredNode.value && (
              <div className="fxsankey-tooltip-value">
                <span className="fxsankey-tooltip-label">Value:</span>
                <span className="fxsankey-tooltip-number">
                  {hoveredNode.value} {config.data?.metadata?.units}
                </span>
              </div>
            )}
            <p className="fxsankey-tooltip-hint">Click to focus</p>
          </div>
        </div>
      )}
      
      {hoveredLink && (
        <div 
          className="fxsankey-tooltip fxsankey-tooltip-bubble"
          style={{
            left: `${Math.min(Math.max(15, tooltipPosition.x + 15), window.innerWidth - 320)}px`,
            top: `${Math.min(Math.max(15, tooltipPosition.y - 80), window.innerHeight - 200)}px`,
          }}
        >
          <div className="fxsankey-tooltip-content">
            <h4 className="fxsankey-tooltip-title">Flow Connection</h4>
            <div className="fxsankey-tooltip-flow">
              <span>{hoveredLink.source}</span>
              <span className="fxsankey-tooltip-arrow">→</span>
              <span>{hoveredLink.target}</span>
            </div>
            <div className="fxsankey-tooltip-value">
              <span className="fxsankey-tooltip-label">Amount:</span>
              <span className="fxsankey-tooltip-number">
                {hoveredLink.value} {config.data?.metadata?.units}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Legend and Info Panel */}
      {config.data && showLegend && (
        <div className="fxsankey-legend">
          <button 
            className="fxsankey-legend-close"
            onClick={() => setShowLegend(false)}
            title="Close Legend"
          >
            ×
          </button>
          {config.data.metadata?.title && (
            <h3 className="fxsankey-title">{config.data.metadata.title}</h3>
          )}
          {config.data.metadata?.description && (
            <p className="fxsankey-description">{config.data.metadata.description}</p>
          )}
          {config.data.nodes && config.data.nodes.length > 0 && (
            <div className="fxsankey-node-legend">
              <h4>Elements:</h4>
              <div className="fxsankey-legend-items">
                {config.data.nodes.map((node) => (
                  <div key={node.id} className="fxsankey-legend-item">
                    <span 
                      className="fxsankey-legend-color" 
                      style={{ 
                        backgroundColor: typeof node.color === 'string' ? node.color : '#799496'
                      }}
                    />
                    <span className="fxsankey-legend-label">{node.label || node.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {config.data.metadata?.units && (
            <p className="fxsankey-units">Units: {config.data.metadata.units}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FxSankey;