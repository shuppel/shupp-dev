import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Icon } from './Icon';
import type { IconWeight } from '@phosphor-icons/react';
import * as Phosphor from '@phosphor-icons/react';

interface Icon3DProps {
  name: keyof typeof Phosphor;
  size?: number;
  color?: string;
  weight?: IconWeight;
  effect?: 'particles' | 'wave' | 'spiral' | 'drip';
}

export const Icon3D: React.FC<Icon3DProps> = ({
  name,
  size = 48,
  color = '#3b82f6',
  weight = 'duotone',
  effect = 'particles'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -size / 2, size / 2, size / 2, -size / 2, 0.1, 1000
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(size * 2, size * 2);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Create ink particle system
    const particleCount = effect === 'particles' ? 50 : 30;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Position particles around icon
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = size * 0.3;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = 0;

      // Random velocities for organic movement
      velocities[i * 3] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 2] = 0;

      sizes[i] = Math.random() * 3 + 1;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Ink-like material
    const particleMaterial = new THREE.PointsMaterial({
      size: 2,
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.01;
      animationRef.current = requestAnimationFrame(animate);

      const positions = particles.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;

        switch (effect) {
          case 'wave':
            // Wave effect
            positions[idx + 1] += Math.sin(time * 2 + i * 0.5) * 0.1;
            positions[idx] += Math.cos(time + i * 0.3) * 0.05;
            break;

          case 'spiral':
            // Spiral effect
            const angle = time + (i / particleCount) * Math.PI * 2;
            const radius = size * 0.3 * (1 + Math.sin(time * 2) * 0.2);
            positions[idx] = Math.cos(angle) * radius;
            positions[idx + 1] = Math.sin(angle) * radius;
            break;

          case 'drip':
            // Ink drip effect
            positions[idx + 1] -= 0.5;
            if (positions[idx + 1] < -size) {
              positions[idx + 1] = size * 0.5;
              positions[idx] = (Math.random() - 0.5) * size * 0.5;
            }
            // Add slight wobble
            positions[idx] += Math.sin(time * 5 + i) * 0.1;
            break;

          default: // particles
            // Organic particle movement
            positions[idx] += velocities[idx] + Math.sin(time + i) * 0.05;
            positions[idx + 1] += velocities[idx + 1] + Math.cos(time + i) * 0.05;
            
            // Boundary check
            const dist = Math.sqrt(positions[idx] ** 2 + positions[idx + 1] ** 2);
            if (dist > size * 0.6) {
              velocities[idx] *= -0.8;
              velocities[idx + 1] *= -0.8;
            }
        }
      }

      particles.attributes.position.needsUpdate = true;

      // Rotate the whole system slightly
      particleSystem.rotation.z = Math.sin(time * 0.5) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      renderer.dispose();
      particles.dispose();
      particleMaterial.dispose();
    };
  }, [name, size, color, effect]);

  return (
    <div className="icon-three-container" style={{ position: 'relative', width: size, height: size }}>
      <canvas
        ref={canvasRef}
        className="icon-three-canvas"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none'
        }}
      />
      <Icon
        name={name}
        size={size}
        color={color}
        weight={weight}
        liquid={true}
        style={{ position: 'relative', zIndex: 1 }}
      />
    </div>
  );
};