import * as THREE from 'three';

export interface FxSankeyData {
  nodes: FxNode[];
  links: FxLink[];
  metadata?: FxMetadata;
}

export interface FxNode {
  id: string;
  label: string;
  value?: number;
  color?: string | THREE.Color;
  gradient?: GradientConfig;
  position?: THREE.Vector3;
  level?: number;
  metadata?: Record<string, any>;
  opacity?: number;
  glow?: GlowConfig;
}

export interface FxLink {
  source: string;
  target: string;
  value: number;
  opacity?: number;
  gradient?: GradientConfig;
  particles?: ParticleConfig;
  curvature?: number;
  flowSpeed?: number;
  metadata?: Record<string, any>;
}

export interface GradientConfig {
  type: 'linear' | 'radial' | 'flow';
  colors: string[];
  stops?: number[];
  animate?: boolean;
  speed?: number;
}

export interface ParticleConfig {
  enabled: boolean;
  count?: number;
  size?: number;
  speed?: number;
  color?: string | THREE.Color;
  opacity?: number;
  trail?: boolean;
  glow?: boolean;
}

export interface GlowConfig {
  enabled: boolean;
  color?: string | THREE.Color;
  intensity?: number;
  radius?: number;
}

export interface FxMetadata {
  title?: string;
  description?: string;
  units?: string;
  theme?: ThemeConfig;
  animation?: AnimationConfig;
}

export interface ThemeConfig {
  background?: string | THREE.Color;
  nodeStyle?: 'glass' | 'solid' | 'gradient' | 'liquid';
  linkStyle?: 'bezier' | 'arc' | 'straight' | 'flow';
  colorScheme?: 'opulent' | 'vibrant' | 'monochrome' | 'custom';
  customColors?: string[];
}

export interface AnimationConfig {
  duration?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';
  stagger?: number;
  loop?: boolean;
  autoPlay?: boolean;
}

export interface ViewConfig {
  zoom?: number;
  rotation?: THREE.Euler;
  position?: THREE.Vector3;
  focusNode?: string;
  highlightPath?: string[];
  dimUnfocused?: boolean;
  perspective?: 'top' | 'side' | 'isometric' | 'free';
}

export interface SmartView {
  name: string;
  description: string;
  config: ViewConfig;
  transition?: AnimationConfig;
}

export interface LayoutConfig {
  type: 'hierarchical' | 'circular' | 'force' | 'custom';
  padding?: number;
  nodeSpacing?: number;
  levelSpacing?: number;
  iterations?: number;
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

export interface InteractionConfig {
  hover?: boolean;
  click?: boolean;
  drag?: boolean;
  zoom?: boolean;
  rotate?: boolean;
  tooltips?: boolean;
  selection?: boolean;
}

export interface FxSankeyConfig {
  data: FxSankeyData;
  layout?: LayoutConfig;
  theme?: ThemeConfig;
  animation?: AnimationConfig;
  interaction?: InteractionConfig;
  views?: SmartView[];
  defaultView?: string;
  responsive?: boolean;
  performance?: PerformanceConfig;
}

export interface PerformanceConfig {
  maxParticles?: number;
  useLOD?: boolean;
  shadowQuality?: 'high' | 'medium' | 'low' | 'none';
  antialias?: boolean;
  pixelRatio?: number;
}

export interface CalculatedNode extends FxNode {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  inputValue: number;
  outputValue: number;
  mesh?: THREE.Mesh;
}

export interface CalculatedLink extends FxLink {
  sourceNode: CalculatedNode;
  targetNode: CalculatedNode;
  path: THREE.Vector3[];
  curve?: THREE.CubicBezierCurve3;
  mesh?: THREE.Mesh;
  particleSystem?: THREE.Points;
}

export interface SankeyLayout {
  nodes: CalculatedNode[];
  links: CalculatedLink[];
  bounds: {
    min: THREE.Vector3;
    max: THREE.Vector3;
  };
}

export type NodeEventHandler = (node: FxNode, event: THREE.Event) => void;
export type LinkEventHandler = (link: FxLink, event: THREE.Event) => void;
export type ViewChangeHandler = (view: ViewConfig) => void;

export interface FxSankeyEvents {
  onNodeHover?: NodeEventHandler;
  onNodeClick?: NodeEventHandler;
  onNodeDrag?: NodeEventHandler;
  onLinkHover?: LinkEventHandler;
  onLinkClick?: LinkEventHandler;
  onViewChange?: ViewChangeHandler;
  onAnimationComplete?: () => void;
}