import * as THREE from 'three';
import type { CalculatedLink, ParticleConfig } from '../types';

interface ParticleData {
  positions: Float32Array;
  velocities: Float32Array;
  lifetimes: Float32Array;
  config: ParticleConfig;
  curve: THREE.CubicBezierCurve3;
  linkId: string;
}

export class ParticleSystem {
  private particles: THREE.Points[] = [];
  private particleGeometries: THREE.BufferGeometry[] = [];
  private particleMaterials: THREE.PointsMaterial[] = [];
  private particleData: Map<string, ParticleData> = new Map();
  private time = 0;

  public createParticles(
    link: CalculatedLink,
    scene: THREE.Scene
  ): THREE.Points | null {
    if (!link.particles?.enabled || !link.curve) return null;

    const config = link.particles;
    const particleCount = config.count ?? 20;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);

    const velocities = new Float32Array(particleCount);
    const lifetimes = new Float32Array(particleCount);

    // Use provided color or a more neutral default
    const color = config.color ? 
      (typeof config.color === 'string' ? new THREE.Color(config.color) : config.color) :
      new THREE.Color('#ffffff');

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const point = link.curve.getPoint(t);
      
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = (config.size ?? 0.05) * (0.5 + Math.random() * 0.5);
      opacities[i] = config.opacity ?? 0.8;

      velocities[i] = (config.speed ?? 0.01) * (0.8 + Math.random() * 0.4);
      lifetimes[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    const material = new THREE.PointsMaterial({
      size: config.size ?? 0.05,
      vertexColors: true,
      transparent: true,
      opacity: config.opacity ?? 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    if (config.glow) {
      material.map = this.createGlowTexture();
    }

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const linkId = `${link.source}_${link.target}`;
    this.particleData.set(linkId, {
      positions,
      velocities,
      lifetimes,
      config,
      curve: link.curve,
      linkId,
    });

    this.particles.push(particles);
    this.particleGeometries.push(geometry);
    this.particleMaterials.push(material);

    return particles;
  }

  private createGlowTexture(): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d')!;

    const gradient = context.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(172, 193, 150, 0.6)');
    gradient.addColorStop(0.6, 'rgba(172, 193, 150, 0.4)');
    gradient.addColorStop(1, 'rgba(172, 193, 150, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;

    this.particleData.forEach((data, linkId) => {
      const geometry = this.particleGeometries[Array.from(this.particleData.keys()).indexOf(linkId)];
      if (!geometry) return;

      const positions = geometry.attributes.position.array as Float32Array;
      const opacities = geometry.attributes.opacity.array as Float32Array;

      const particleCount = data.lifetimes.length;

      for (let i = 0; i < particleCount; i++) {
        data.lifetimes[i] += data.velocities[i] * deltaTime;

        if (data.lifetimes[i] > 1) {
          data.lifetimes[i] = 0;
          
          if (data.config.trail) {
            opacities[i] = (data.config.opacity ?? 0.8) * 0.3;
          }
        }

        const t = data.lifetimes[i];
        const point = data.curve.getPoint(t);

        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;

        if (data.config.trail) {
          opacities[i] = (data.config.opacity ?? 0.8) * (1 - t * 0.5);
        }

        const pulse = Math.sin(this.time * 2 + i) * 0.1 + 1;
        const sizeAttribute = geometry.attributes.size;
        if (sizeAttribute) {
          (sizeAttribute.array as Float32Array)[i] = (data.config.size ?? 0.05) * pulse;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.opacity.needsUpdate = true;
      if (geometry.attributes.size) {
        geometry.attributes.size.needsUpdate = true;
      }
    });
  }

  public dispose(): void {
    this.particles.forEach(particle => {
      if (particle.parent) {
        particle.parent.remove(particle);
      }
    });

    this.particleGeometries.forEach(geometry => {
      geometry.dispose();
    });

    this.particleMaterials.forEach(material => {
      material.dispose();
      if (material.map) {
        material.map.dispose();
      }
    });

    this.particles = [];
    this.particleGeometries = [];
    this.particleMaterials = [];
    this.particleData.clear();
  }
}

export class FlowAnimation {
  private flowMaterials: Map<string, THREE.ShaderMaterial> = new Map();
  private time = 0;

  public createFlowMaterial(link: CalculatedLink): THREE.ShaderMaterial {
    const linkId = `${link.source}_${link.target}`;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        flowSpeed: { value: link.flowSpeed ?? 1.0 },
        opacity: { value: link.opacity ?? 0.7 },
        color1: { value: new THREE.Color('#ACC196') },
        color2: { value: new THREE.Color('#E9EB9E') },
        gradientOffset: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float flowSpeed;
        uniform float opacity;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform float gradientOffset;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          float flow = fract(vUv.x - time * flowSpeed);
          
          float wave = sin(flow * 3.14159 * 2.0) * 0.5 + 0.5;
          
          vec3 color = mix(color1, color2, flow);
          
          float edgeFade = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
          
          float finalOpacity = opacity * wave * edgeFade;
          
          gl_FragColor = vec4(color, finalOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.flowMaterials.set(linkId, material);
    return material;
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;

    this.flowMaterials.forEach(material => {
      material.uniforms.time.value = this.time;
      material.uniforms.gradientOffset.value = Math.sin(this.time) * 0.5 + 0.5;
    });
  }

  public setLinkOpacity(linkId: string, opacity: number): void {
    const material = this.flowMaterials.get(linkId);
    if (material) {
      material.uniforms.opacity.value = opacity;
    }
  }

  public dispose(): void {
    this.flowMaterials.forEach(material => {
      material.dispose();
    });
    this.flowMaterials.clear();
  }
}

export class LiquidEffect {
  private time = 0;
  private nodeMaterials: Map<string, THREE.ShaderMaterial> = new Map();

  public createLiquidNodeMaterial(nodeId: string): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color('#49475B') },
        glowColor: { value: new THREE.Color('#ACC196') },
        opacity: { value: 0.9 },
        glowIntensity: { value: 1.0 },
        liquidSpeed: { value: 0.5 },
      },
      vertexShader: `
        uniform float time;
        uniform float liquidSpeed;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;
          
          vec3 pos = position;
          float wave = sin(position.x * 10.0 + time * liquidSpeed) * 0.01;
          pos.y += wave;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 baseColor;
        uniform vec3 glowColor;
        uniform float opacity;
        uniform float glowIntensity;
        uniform float liquidSpeed;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          
          float wave1 = sin(vUv.x * 20.0 + time * liquidSpeed) * 0.5 + 0.5;
          float wave2 = sin(vUv.y * 15.0 - time * liquidSpeed * 0.7) * 0.5 + 0.5;
          float combinedWave = wave1 * wave2;
          
          vec3 color = mix(baseColor, glowColor, fresnel * glowIntensity);
          color = mix(color, glowColor, combinedWave * 0.2);
          
          float finalOpacity = opacity * (0.8 + fresnel * 0.2);
          
          gl_FragColor = vec4(color, finalOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.nodeMaterials.set(nodeId, material);
    return material;
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;

    this.nodeMaterials.forEach(material => {
      material.uniforms.time.value = this.time;
      
      const pulse = Math.sin(this.time * 2) * 0.2 + 1;
      material.uniforms.glowIntensity.value = pulse;
    });
  }

  public setNodeGlow(nodeId: string, intensity: number): void {
    const material = this.nodeMaterials.get(nodeId);
    if (material) {
      material.uniforms.glowIntensity.value = intensity;
    }
  }

  public dispose(): void {
    this.nodeMaterials.forEach(material => {
      material.dispose();
    });
    this.nodeMaterials.clear();
  }
}