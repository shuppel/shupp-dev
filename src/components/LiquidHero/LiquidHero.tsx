import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders';
import './LiquidHero.css';

interface LiquidHeroProps {
  isDarkMode?: boolean;
}

const LiquidHero: React.FC<LiquidHeroProps> = ({ isDarkMode: isDarkModeProp = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const connectionsRef = useRef<THREE.LineSegments | null>(null);
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(isDarkModeProp);

  useEffect(() => {
    // Listen for dark mode changes from Astro
    const handleDarkModeChange = (event: Event): void => {
      const customEvent = event as CustomEvent<{ isDarkMode: boolean }>;
      setIsDarkMode(customEvent.detail.isDarkMode);
    };
    
    const container = document.querySelector('[data-liquid-hero]');
    if (container) {
      container.addEventListener('darkModeChange', handleDarkModeChange);
    }
    
    // Check initial dark mode state
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    return () => {
      if (container) {
        container.removeEventListener('darkModeChange', handleDarkModeChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');
    if (!gl) {
      setIsWebGLSupported(false);
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup - inside the cube
    const camera = new THREE.PerspectiveCamera(
      90,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.01,
      1000
    );
    camera.position.z = 0;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Massive box that we're inside of
    const geometry = new THREE.BoxGeometry(20, 20, 20);
    
    // Create shader material for liquid effect
    const liquidMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uDarkMode: { value: isDarkMode ? 1.0 : 0.0 },
        uLightColor: { value: new THREE.Color(0xacc196) }, // Light green
        uDarkColor: { value: new THREE.Color(0x49475b) }, // Secondary purple
        uAccentColor: { value: new THREE.Color(0xff9f40) }, // Orange accent
        uSecondaryColor: { value: new THREE.Color(0x799496) }, // Tertiary teal
        uOpacity: { value: 0.6 }, // More translucent
      },
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });

    const cube = new THREE.Mesh(geometry, liquidMaterial);
    scene.add(cube);

    // Quantum node network - connected spheres
    const nodeCount = 20;
    const nodes: THREE.Mesh[] = [];
    const nodeGroup = new THREE.Group();
    
    // Create sphere nodes with higher resolution
    const sphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const nodeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: 0 },
        uColor: { value: new THREE.Color(isDarkMode ? 0xe9eb9e : 0xff9f40) },
        uOpacity: { value: 0.4 },
        uFrequency: { value: 1.0 },
        uAmplitude: { value: 1.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vViewPosition;
        varying vec2 vComplexWave;
        varying float vQuantumPhase;
        uniform float uTime;
        uniform float uPhase;
        uniform float uFrequency;
        uniform float uAmplitude;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          
          // Euler's formula: e^(iθ) = cos(θ) + i*sin(θ)
          // We'll use this to create quantum wave functions
          float theta = uTime * uFrequency + uPhase;
          
          // Real and imaginary parts of the wave function
          float real = cos(theta);
          float imag = sin(theta);
          
          // Create complex oscillations using Euler's formula
          float r = length(position.xy); // radius in complex plane
          float complexPhase = atan(position.y, position.x); // angle in complex plane
          
          // Apply quantum wave function to vertex position
          vec3 pos = position;
          
          // Quantum oscillation using e^(i(kr - ωt))
          float k = 2.0; // wave number
          float omega = uFrequency; // angular frequency
          float quantumPhase = k * r - omega * uTime + uPhase;
          
          // Apply Euler's formula for quantum displacement
          float quantumReal = cos(quantumPhase);
          float quantumImag = sin(quantumPhase);
          
          // Superposition of states
          pos.x += quantumReal * 0.05 * uAmplitude;
          pos.y += quantumImag * 0.05 * uAmplitude;
          pos.z += (quantumReal * quantumImag) * 0.03 * uAmplitude;
          
          // Pass complex wave to fragment shader
          vComplexWave = vec2(real, imag);
          vQuantumPhase = quantumPhase;
          
          vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPosition.xyz;
          
          vec4 viewPosition = viewMatrix * worldPosition;
          vViewPosition = viewPosition.xyz;
          
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vViewPosition;
        varying vec2 vComplexWave;
        varying float vQuantumPhase;
        uniform float uTime;
        uniform float uPhase;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uFrequency;
        uniform float uAmplitude;
        
        void main() {
          // Calculate proper view direction
          vec3 viewDir = normalize(-vViewPosition);
          vec3 normal = normalize(vNormal);
          
          // Extract real and imaginary parts from Euler's formula
          float real = vComplexWave.x;
          float imag = vComplexWave.y;
          
          // Calculate wave function probability |ψ|² = real² + imag²
          float probability = real * real + imag * imag;
          
          // Quantum interference pattern
          float interference = sin(vQuantumPhase * 5.0) * cos(vQuantumPhase * 3.0);
          
          // Rim lighting enhanced by complex wave
          float rim = 1.0 - max(0.0, dot(viewDir, normal));
          float rimPower = pow(rim, 2.0) * (0.5 + probability * 0.5);
          
          // Fresnel modulated by quantum phase
          float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 1.5);
          fresnel *= (1.0 + sin(vQuantumPhase) * 0.3);
          
          // Complex lighting using Euler's formula results
          vec3 lightDir1 = normalize(vec3(real, imag, 0.5));
          vec3 lightDir2 = normalize(vec3(-imag, real, -0.5));
          float diffuse1 = max(0.0, dot(normal, lightDir1));
          float diffuse2 = max(0.0, dot(normal, lightDir2));
          float lighting = diffuse1 * 0.6 + diffuse2 * 0.4 + 0.3;
          
          // Color modulation based on complex phase
          vec3 color = uColor;
          // Add phase-based color shift
          color.r *= (1.0 + real * 0.2);
          color.g *= (1.0 + imag * 0.2);
          color.b *= (1.0 + (real * imag) * 0.3);
          
          // Apply lighting and effects
          color *= lighting;
          color += vec3(rimPower * 0.6);
          color += vec3(fresnel * 0.3);
          color += vec3(interference * 0.1);
          
          // Alpha based on quantum probability
          float alpha = uOpacity * probability * (0.3 + rimPower * 0.5 + fresnel * 0.2);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    
    // Position nodes in 3D space
    for (let i = 0; i < nodeCount; i++) {
      const node = new THREE.Mesh(sphereGeometry, nodeMaterial.clone());
      
      // Distribute nodes in true 3D space using spherical coordinates with more randomness
      const theta = Math.random() * Math.PI * 2; // Random angle around Y axis (0 to 2π)
      const phi = Math.acos(Math.random() * 2 - 1); // Random angle from pole (0 to π)
      const radius = 2 + Math.random() * 4; // Random distance from center (2 to 6)
      
      // Convert spherical to cartesian with proper 3D distribution
      node.position.x = radius * Math.sin(phi) * Math.cos(theta);
      node.position.y = radius * Math.cos(phi); // Y is vertical
      node.position.z = radius * Math.sin(phi) * Math.sin(theta);
      
      node.userData = {
        phase: Math.random() * Math.PI * 2,
        connections: [],
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.03,
          (Math.random() - 0.5) * 0.03,
          (Math.random() - 0.5) * 0.03
        ),
        orbitAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize()
      };
      
      nodes.push(node);
      nodeGroup.add(node);
    }
    
    // Create connections between nodes
    const connectionGeometry = new THREE.BufferGeometry();
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: isDarkMode ? 0xe9eb9e : 0xff9f40, // Same color as spheres
      transparent: true,
      opacity: 0.3, // Much more visible
      linewidth: 2, // Note: linewidth may not work in WebGL
      blending: THREE.AdditiveBlending,
    });
    
    // Build graph connections
    const maxConnections = 3;
    nodes.forEach((node, i) => {
      const connections = [];
      
      // Connect to nearby nodes
      nodes.forEach((otherNode, j) => {
        if (i !== j && connections.length < maxConnections) {
          const distance = node.position.distanceTo(otherNode.position);
          if (distance < 4.5) { // Increased threshold for better 3D connectivity
            connections.push(j);
            node.userData.connections.push(j);
          }
        }
      });
    });
    
    // Create line segments for connections
    const linePositions: number[] = [];
    const connectionGroup = new THREE.Group();
    
    nodes.forEach((node, i) => {
      node.userData.connections.forEach((j: number) => {
        if (j > i) { // Avoid duplicate connections
          linePositions.push(
            node.position.x, node.position.y, node.position.z,
            nodes[j].position.x, nodes[j].position.y, nodes[j].position.z
          );
        }
      });
    });
    
    connectionGeometry.setAttribute('position', 
      new THREE.Float32BufferAttribute(linePositions, 3)
    );
    
    const connections = new THREE.LineSegments(connectionGeometry, connectionMaterial);
    connectionGroup.add(connections);
    nodeGroup.add(connectionGroup);
    
    scene.add(nodeGroup);
    
    // Store references for animation
    nodesRef.current = nodes;
    connectionsRef.current = connections;

    // Mouse interaction
    const mouse = new THREE.Vector2(0.5, 0.5);
    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX / window.innerWidth;
      mouse.y = 1.0 - (event.clientY / window.innerHeight);
      liquidMaterial.uniforms.uMouse.value = mouse;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();
      
      // Update time uniform
      liquidMaterial.uniforms.uTime.value = elapsedTime;
      
      // Subtle cube rotation from inside perspective
      cube.rotation.x = elapsedTime * 0.05;
      cube.rotation.y = elapsedTime * 0.03;
      cube.rotation.z = elapsedTime * 0.02;
      
      // 3D camera movement for immersive feeling
      camera.position.x = Math.sin(elapsedTime * 0.3) * 1.5;
      camera.position.y = Math.cos(elapsedTime * 0.25) * 1.2;
      camera.position.z = Math.sin(elapsedTime * 0.2) * 1.5;
      
      // Subtle camera rotation
      camera.rotation.x = Math.sin(elapsedTime * 0.15) * 0.05;
      camera.rotation.y = Math.cos(elapsedTime * 0.1) * 0.05;
      camera.rotation.z = Math.sin(elapsedTime * 0.12) * 0.03;
      
      // Animate quantum nodes
      if (nodesRef.current !== null && nodesRef.current.length > 0) {
        nodesRef.current.forEach((node, i) => {
          if (node?.material === null || node?.material === undefined) return;
          const material = node.material as THREE.ShaderMaterial;
          
          // Update phase with quantum evolution
          const omega = 2.0 * Math.PI * 0.1; // Angular frequency
          node.userData.phase += omega * 0.016; // ~60fps timestep
          material.uniforms.uPhase.value = node.userData.phase;
          material.uniforms.uTime.value = elapsedTime;
          
          // Update frequency and amplitude based on node index
          material.uniforms.uFrequency.value = 1.0 + (i % 3) * 0.5;
          material.uniforms.uAmplitude.value = 0.8 + Math.sin(elapsedTime * 0.3 + i) * 0.2;
          
          // Euler's formula for complex motion: e^(iωt) = cos(ωt) + i*sin(ωt)
          const complexPhase = omega * elapsedTime + node.userData.phase;
          const eulerReal = Math.cos(complexPhase);
          const eulerImag = Math.sin(complexPhase);
          
          // Apply complex plane motion
          const complexRadius = 0.02;
          const complexMotion = new THREE.Vector3(
            eulerReal * complexRadius,
            eulerImag * complexRadius,
            (eulerReal * eulerImag) * complexRadius * 0.5 // 3D extension
          );
          
          // Quantum superposition of multiple frequencies
          const phase2 = 2 * omega * elapsedTime + node.userData.phase * 1.5;
          const phase3 = 3 * omega * elapsedTime + node.userData.phase * 0.7;
          
          const superposition = new THREE.Vector3(
            Math.cos(phase2) * 0.01,
            Math.sin(phase2) * 0.01,
            Math.cos(phase3) * Math.sin(phase3) * 0.01
          );
          
          // Apply quantum motion
          node.position.add(node.userData.velocity.clone().multiplyScalar(0.3));
          node.position.add(complexMotion);
          node.position.add(superposition);
          
          // Quantum tunneling probability
          const tunnelingProb = Math.exp(-Math.abs(eulerReal * eulerImag));
          if (Math.random() < tunnelingProb * 0.001) {
            // Quantum tunnel to new position
            const tunnelDistance = 2.0;
            const tunnelDirection = new THREE.Vector3(
              Math.random() - 0.5,
              Math.random() - 0.5,
              Math.random() - 0.5
            ).normalize();
            node.position.add(tunnelDirection.multiplyScalar(tunnelDistance));
          }
          
          // Keep nodes within bounds
          const distance = node.position.length();
          if (distance > 8) {
            node.position.multiplyScalar(8 / distance);
          }
          
          // Update visibility based on phase
          const visibility = Math.sin(elapsedTime * 0.3 + node.userData.phase) * 0.5 + 0.5;
          material.uniforms.uOpacity.value = 0.1 + visibility * 0.4;
        });
      }
      
      // Update connections
      if (nodesRef.current !== null && nodesRef.current.length > 0 && connectionsRef.current !== null) {
        const connectionPositions: number[] = [];
        nodesRef.current.forEach((node, i) => {
          if (node?.userData?.connections !== null && node?.userData?.connections !== undefined && Array.isArray(node.userData.connections)) {
            node.userData.connections.forEach((j: number) => {
              if (j > i && nodesRef.current[j] !== null && nodesRef.current[j] !== undefined) { // Avoid duplicate connections
                connectionPositions.push(
                  node.position.x, node.position.y, node.position.z,
                  nodesRef.current[j].position.x, nodesRef.current[j].position.y, nodesRef.current[j].position.z
                );
              }
            });
          }
        });
        
        const connectionGeometry = connectionsRef.current.geometry;
        connectionGeometry.setAttribute('position', 
          new THREE.Float32BufferAttribute(connectionPositions, 3)
        );
        
        // Update connection visibility using Euler's formula
        const connectionMaterial = connectionsRef.current.material as THREE.LineBasicMaterial;
        
        // Use Euler's formula for connection pulsing
        const connectionPhase = elapsedTime * Math.PI;
        const eulerPulse = Math.cos(connectionPhase) * 0.5 + 0.5; // Maps to [0,1]
        connectionMaterial.opacity = 0.2 + eulerPulse * 0.2; // Varies between 0.2 and 0.4
        
        // Phase-based color shifting
        const phaseShift = Math.sin(connectionPhase) * 0.5 + 0.5;
        const baseColor = isDarkMode ? 0xe9eb9e : 0xff9f40;
        const r = ((baseColor >> 16) & 255) / 255;
        const g = ((baseColor >> 8) & 255) / 255;
        const b = (baseColor & 255) / 255;
        
        // Apply complex color modulation
        connectionMaterial.color.setRGB(
          r * (0.7 + phaseShift * 0.3),
          g * (0.7 + (1 - phaseShift) * 0.3),
          b * (0.7 + Math.sin(phaseShift * Math.PI) * 0.3)
        );
      }
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      liquidMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      
      if (mountRef.current !== null && renderer.domElement !== null) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      geometry.dispose();
      liquidMaterial.dispose();
      
      // Clean up nodes
      nodesRef.current.forEach(node => {
        if (node.geometry !== null && node.geometry !== undefined) node.geometry.dispose();
        if (node.material !== null && node.material !== undefined) (node.material as THREE.ShaderMaterial).dispose();
      });
      
      // Clean up connections
      if (connectionsRef.current !== null) {
        connectionsRef.current.geometry.dispose();
        (connectionsRef.current.material as THREE.Material).dispose();
      }
    };
  }, [isDarkMode]);

  // Update dark mode
  useEffect(() => {
    if (sceneRef.current !== null) {
      sceneRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
          // Check if uniforms exist before accessing them
          if (child.material.uniforms !== null && child.material.uniforms !== undefined) {
            if (child.material.uniforms.uDarkMode !== null && child.material.uniforms.uDarkMode !== undefined) {
              child.material.uniforms.uDarkMode.value = isDarkMode ? 1.0 : 0.0;
            }
            // Update node colors for dark mode
            if (child.material.uniforms.uColor !== null && child.material.uniforms.uColor !== undefined) {
              child.material.uniforms.uColor.value = new THREE.Color(isDarkMode ? 0xe9eb9e : 0xff9f40);
            }
          }
        } else if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
          child.material.color = new THREE.Color(isDarkMode ? 0xe9eb9e : 0xff9f40); // Same as spheres
        }
      });
    }
  }, [isDarkMode]);

  if (!isWebGLSupported) {
    return <div className="liquid-hero-fallback" />;
  }

  return <div ref={mountRef} className="liquid-hero-canvas" />;
};

export default LiquidHero;