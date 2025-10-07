import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './RoadmapTimeline.css';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: string;
  features: string[];
  completedItems: string[];
}

interface TimelinePhase {
  id: string;
  title: string;
  fullTitle?: string;
  timeframe: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming';
  progress?: number;
  order: number;
  goals?: string[];
  items?: RoadmapItem[];
}

interface RoadmapTimelineProps {
  phases: TimelinePhase[];
  currentProgress?: number;
}

export default function RoadmapTimeline({ phases, currentProgress = 0 }: RoadmapTimelineProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number>(0);
  const [selectedNode, setSelectedNode] = useState<TimelinePhase | RoadmapItem | null>(null);
  const [selectedType, setSelectedType] = useState<'phase' | 'item' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 600;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.Fog(0x0a0a0f, 20, 80);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 8, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 40;
    controls.minDistance = 8;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minPolarAngle = Math.PI / 6;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404050, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add rim light for better depth
    const rimLight = new THREE.DirectionalLight(0x7994aa, 0.3);
    rimLight.position.set(-5, 10, -10);
    scene.add(rimLight);

    // Create base platform
    const platformGeometry = new THREE.CylinderGeometry(25, 28, 1, 64);
    const platformMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      emissive: 0x0a0a0f,
      emissiveIntensity: 0.2,
      shininess: 100
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -2;
    platform.receiveShadow = true;
    scene.add(platform);

    // Create grid on platform
    const gridHelper = new THREE.GridHelper(50, 50, 0x2a2a3e, 0x1a1a2e);
    gridHelper.position.y = -1.4;
    scene.add(gridHelper);

    // Create main timeline path
    const pathPoints: THREE.Vector3[] = [];
    const totalPhases = phases.length;
    const pathRadius = 15;
    
    // Create spiral path for phases
    phases.forEach((_, index) => {
      const angle = (index / totalPhases) * Math.PI * 2;
      const heightOffset = index * 1.5;
      const radiusOffset = Math.sin(index * 0.5) * 2;
      
      const x = Math.cos(angle) * (pathRadius + radiusOffset);
      const y = heightOffset;
      const z = Math.sin(angle) * (pathRadius + radiusOffset);
      
      pathPoints.push(new THREE.Vector3(x, y, z));
    });

    // Create smooth curve through points
    const curve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.5);
    const curvePoints = curve.getPoints(200);
    
    // Main timeline path
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const pathMaterial = new THREE.LineBasicMaterial({
      color: 0x4a5568,
      linewidth: 3,
      opacity: 0.4,
      transparent: true
    });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(pathLine);

    // Progress path (glowing)
    const progressPoints = curvePoints.slice(0, Math.floor(curvePoints.length * (currentProgress / 100)));
    if (progressPoints.length > 1) {
      const progressGeometry = new THREE.BufferGeometry().setFromPoints(progressPoints);
      const progressMaterial = new THREE.LineBasicMaterial({
        color: 0x5ea3a3,
        linewidth: 4,
        opacity: 0.9,
        transparent: true
      });
      const progressLine = new THREE.Line(progressGeometry, progressMaterial);
      scene.add(progressLine);

      // Add glowing effect to progress line
      const glowGeometry = new THREE.BufferGeometry().setFromPoints(progressPoints);
      const glowMaterial = new THREE.LineBasicMaterial({
        color: 0x7fc9c9,
        linewidth: 8,
        opacity: 0.3,
        transparent: true
      });
      const glowLine = new THREE.Line(glowGeometry, glowMaterial);
      scene.add(glowLine);
    }

    // Create phase nodes and items
    const nodeGroup = new THREE.Group();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const clickableObjects: THREE.Mesh[] = [];
    const labelSprites: THREE.Sprite[] = [];


    
    phases.forEach((phase, phaseIndex) => {
      const phasePosition = pathPoints[phaseIndex];
      
      // Main phase node (larger sphere)
      const nodeGeometry = new THREE.SphereGeometry(0.8, 32, 16);
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: phase.status === 'completed' ? 0x5ea3a3 : 
               phase.status === 'current' ? 0x7994aa : 
               0x4a5568,
        emissive: phase.status === 'current' ? 0x7994aa : 0x000000,
        emissiveIntensity: phase.status === 'current' ? 0.5 : 0,
        shininess: 100
      });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.copy(phasePosition);
      node.castShadow = true;
      node.receiveShadow = true;
      node.userData = { data: phase, type: 'phase', id: phase.id };
      
      if (phase.status === 'current') {
        node.userData.isPulsing = true;
      }
      
      nodeGroup.add(node);
      clickableObjects.push(node);

      // Orbital ring for phases
      const ringGeometry = new THREE.TorusGeometry(1.2, 0.08, 8, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: phase.status === 'current' ? 0x5ea3a3 : 0x4a5568,
        opacity: 0.6,
        transparent: true
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(phasePosition);
      ring.userData.rotationSpeed = 0.01 + phaseIndex * 0.002;
      nodeGroup.add(ring);

      // Create label sprite for phase
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      
      if (context) {
        context.fillStyle = 'rgba(255, 255, 255, 0.9)';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(phase.title, 128, 32);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.9
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(phasePosition);
      sprite.position.y += 2;
      sprite.scale.set(4, 1, 1);
      labelSprites.push(sprite);
      nodeGroup.add(sprite);

      // Create smaller nodes for roadmap items
      if (phase.items && phase.items.length > 0) {
        phase.items.forEach((item, itemIndex) => {
          const itemAngle = (itemIndex / phase.items!.length) * Math.PI * 2;
          const itemRadius = 3;
          
          const itemX = phasePosition.x + Math.cos(itemAngle) * itemRadius;
          const itemY = phasePosition.y + Math.sin(itemIndex * 0.5) * 0.5;
          const itemZ = phasePosition.z + Math.sin(itemAngle) * itemRadius;
          
          // Item node (smaller sphere)
          const itemGeometry = new THREE.SphereGeometry(0.4, 16, 8);
          const itemMaterial = new THREE.MeshPhongMaterial({
            color: item.status === 'now' ? 0xacb5dd : 
                   item.status === 'next' ? 0xa8c896 : 
                   0x6a6a7e,
            emissive: item.status === 'now' ? 0x5ea3a3 : 0x000000,
            emissiveIntensity: item.status === 'now' ? 0.2 : 0
          });
          const itemNode = new THREE.Mesh(itemGeometry, itemMaterial);
          itemNode.position.set(itemX, itemY, itemZ);
          itemNode.castShadow = true;
          itemNode.userData = { data: item, type: 'item', id: item.id, phaseId: phase.id };
          nodeGroup.add(itemNode);
          clickableObjects.push(itemNode);

          // Connection line from phase to item
          const connectionPoints = [
            phasePosition,
            new THREE.Vector3(itemX, itemY, itemZ)
          ];
          const connectionGeometry = new THREE.BufferGeometry().setFromPoints(connectionPoints);
          const connectionMaterial = new THREE.LineBasicMaterial({
            color: 0x4a5568,
            opacity: 0.2,
            transparent: true
          });
          const connectionLine = new THREE.Line(connectionGeometry, connectionMaterial);
          nodeGroup.add(connectionLine);
        });
      }

      // Vertical light pillar for current phase
      if (phase.status === 'current') {
        const pillarGeometry = new THREE.CylinderGeometry(0.1, 0.1, 20);
        const pillarMaterial = new THREE.MeshBasicMaterial({
          color: 0x5ea3a3,
          opacity: 0.2,
          transparent: true
        });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.copy(phasePosition);
        pillar.position.y += 10;
        nodeGroup.add(pillar);
      }
    });

    scene.add(nodeGroup);

    // Advanced particle system
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = 15 + Math.random() * 25;
      const angle = Math.random() * Math.PI * 2;
      const height = Math.random() * 20 - 5;
      
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = height;
      positions[i3 + 2] = Math.sin(angle) * radius;
      
      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.1, 0.5, 0.5 + Math.random() * 0.2);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      sizes[i] = Math.random() * 0.1 + 0.05;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Mouse interaction handlers
    const handleMouseMove = (event: MouseEvent) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableObjects);

      // Reset all materials
      clickableObjects.forEach(obj => {
        const material = (obj as THREE.Mesh).material as THREE.MeshPhongMaterial;
        const userData = obj.userData;
        
        if (userData.type === 'phase' && userData.data.status !== 'current') {
          material.emissiveIntensity = 0;
        } else if (userData.type === 'item' && userData.data.status !== 'now') {
          material.emissiveIntensity = 0;
        }
      });

      if (intersects.length > 0) {
        const hoveredObject = intersects[0].object as THREE.Mesh;
        const material = hoveredObject.material as THREE.MeshPhongMaterial;
        material.emissiveIntensity = 0.5;
        document.body.style.cursor = 'pointer';
        setHoveredNode(hoveredObject.userData.id);
        
        // Stop auto-rotation when hovering
        controls.autoRotate = false;
      } else {
        document.body.style.cursor = 'default';
        setHoveredNode(null);
        // Resume auto-rotation
        controls.autoRotate = true;
      }
    };

    const handleClick = (event: MouseEvent) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableObjects);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const userData = clickedObject.userData;
        setSelectedNode(userData.data);
        setSelectedType(userData.type);
        
        // Animate camera to focus on selected node
        const targetPosition = clickedObject.position.clone();
        const cameraOffset = new THREE.Vector3(5, 5, 5);
        const newCameraPosition = targetPosition.clone().add(cameraOffset);
        
        // Smooth camera animation
        const startPosition = camera.position.clone();
        const startTarget = controls.target.clone();
        let animationProgress = 0;
        
        const animateCamera = () => {
          animationProgress += 0.02;
          if (animationProgress <= 1) {
            camera.position.lerpVectors(startPosition, newCameraPosition, animationProgress);
            controls.target.lerpVectors(startTarget, targetPosition, animationProgress);
            controls.update();
            requestAnimationFrame(animateCamera);
          }
        };
        
        animateCamera();
      }
    };

    // Keyboard navigation
    const handleKeyPress = (event: KeyboardEvent) => {
      const currentIndex = phases.findIndex(p => p.id === selectedNode?.id);
      
      switch(event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          if (currentIndex < phases.length - 1) {
            setSelectedNode(phases[currentIndex + 1]);
            setSelectedType('phase');
          }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          if (currentIndex > 0) {
            setSelectedNode(phases[currentIndex - 1]);
            setSelectedType('phase');
          }
          break;
        case 'Escape':
          setSelectedNode(null);
          setSelectedType(null);
          break;
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyPress);

    // Animation loop
    const clock = new THREE.Clock();
    
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = clock.getDelta();

      // Rotate orbital rings
      nodeGroup.children.forEach(child => {
        if (child.userData.rotationSpeed) {
          child.rotation.x = elapsedTime * child.userData.rotationSpeed;
          child.rotation.y = elapsedTime * child.userData.rotationSpeed * 0.7;
        }
        
        // Pulse current phase nodes
        if (child.userData.isPulsing) {
          const scale = 1 + Math.sin(elapsedTime * 3) * 0.15;
          child.scale.set(scale, scale, scale);
        }
      });

      // Animate particles
      const particlePositions = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3 + 1] += Math.sin(elapsedTime + i) * 0.002;
        
        // Slowly rotate particles around center
        const x = particlePositions[i3];
        const z = particlePositions[i3 + 2];
        const angle = deltaTime * 0.1;
        particlePositions[i3] = x * Math.cos(angle) - z * Math.sin(angle);
        particlePositions[i3 + 2] = x * Math.sin(angle) + z * Math.cos(angle);
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y = elapsedTime * 0.05;

      // Make labels always face camera
      labelSprites.forEach(sprite => {
        sprite.lookAt(camera.position);
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();
    setIsLoading(false);

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight || 600;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyPress);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      controls.dispose();
    };
  }, [phases, currentProgress, selectedNode]);

  // Helper function to check if node is a phase
  const isPhase = (node: any): node is TimelinePhase => {
    return node && 'timeframe' in node;
  };

  return (
    <div className="roadmap-timeline-wrapper">
      {isLoading && (
        <div className="timeline-loading">
          <div className="loading-spinner"></div>
          <p>Initializing 3D Timeline...</p>
        </div>
      )}
      
      <div ref={mountRef} className="roadmap-timeline-canvas" />
      
      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="hover-tooltip">
          <span className="tooltip-text">Click to explore</span>
        </div>
      )}
      
      {/* Selected node details panel */}
      {selectedNode && (
        <div className="node-details-panel">
          <button 
            className="close-panel"
            onClick={() => {
              setSelectedNode(null);
              setSelectedType(null);
            }}
            aria-label="Close"
          >
            ×
          </button>
          
          {selectedType === 'phase' && isPhase(selectedNode) && (
            <>
              <div className="panel-header">
                <h3>{selectedNode.fullTitle || selectedNode.title}</h3>
                <span className={`status-badge ${selectedNode.status}`}>
                  {selectedNode.status}
                </span>
              </div>
              
              <div className="panel-content">
                <div className="timeframe">{selectedNode.timeframe}</div>
                
                {selectedNode.description && (
                  <p className="description">{selectedNode.description}</p>
                )}
                
                {selectedNode.goals && selectedNode.goals.length > 0 && (
                  <div className="goals-section">
                    <h4>Goals</h4>
                    <ul>
                      {selectedNode.goals.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedNode.progress !== undefined && selectedNode.progress > 0 && (
                  <div className="progress-section">
                    <h4>Progress</h4>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${selectedNode.progress}%` }}
                      />
                    </div>
                    <span className="progress-text">{selectedNode.progress}%</span>
                  </div>
                )}
                
                {selectedNode.items && selectedNode.items.length > 0 && (
                  <div className="items-section">
                    <h4>Related Items ({selectedNode.items.length})</h4>
                    <div className="items-grid">
                      {selectedNode.items.map(item => (
                        <div 
                          key={item.id} 
                          className="item-card"
                          onClick={() => {
                            setSelectedNode(item);
                            setSelectedType('item');
                          }}
                        >
                          <span className="item-title">{item.title}</span>
                          <span className={`item-status ${item.status}`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          {selectedType === 'item' && !isPhase(selectedNode) && (
            <>
              <div className="panel-header">
                <h3>{selectedNode.title}</h3>
                <span className={`status-badge ${selectedNode.status}`}>
                  {selectedNode.status}
                </span>
              </div>
              
              <div className="panel-content">
                {selectedNode.description && (
                  <p className="description">{selectedNode.description}</p>
                )}
                
                {selectedNode.features && selectedNode.features.length > 0 && (
                  <div className="features-section">
                    <h4>Features</h4>
                    <ul>
                      {selectedNode.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedNode.completedItems && selectedNode.completedItems.length > 0 && (
                  <div className="completed-section">
                    <h4>Completed</h4>
                    <ul className="completed-list">
                      {selectedNode.completedItems.map((item, index) => (
                        <li key={index} className="completed-item">
                          <span className="checkmark">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Controls hint */}
      <div className="controls-hint">
        <div className="hint-item">
          <span className="hint-icon">🖱️</span>
          <span>Click & Drag to rotate</span>
        </div>
        <div className="hint-item">
          <span className="hint-icon">📌</span>
          <span>Click nodes to explore</span>
        </div>
        <div className="hint-item">
          <span className="hint-icon">⌨️</span>
          <span>Use arrow keys to navigate</span>
        </div>
      </div>
    </div>
  );
}