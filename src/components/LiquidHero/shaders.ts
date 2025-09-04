export const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  uniform vec2 uMouse;
  
  // Simplex 3D Noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    // Create liquid distortion with multiple octaves
    vec3 pos = position;
    float noise1 = snoise(vec3(position.x * 1.5, position.y * 1.5 + uTime * 0.5, position.z * 1.5));
    float noise2 = snoise(vec3(position.x * 3.0 + 100.0, position.y * 3.0 + uTime * 0.3, position.z * 3.0));
    float noise3 = snoise(vec3(position.x * 5.0 + 200.0, position.y * 5.0 + uTime * 0.2, position.z * 5.0));
    
    // Combine noises for organic movement
    float liquidDistortion = noise1 * 0.3 + noise2 * 0.15 + noise3 * 0.05;
    
    // Mouse creates ripples
    vec2 mouseInfluence = (uMouse - 0.5) * 0.4;
    float mouseDistance = length(uv - uMouse);
    float ripple = sin(mouseDistance * 10.0 - uTime * 3.0) * exp(-mouseDistance * 2.0) * 0.2;
    
    pos.x += liquidDistortion * 0.3 + mouseInfluence.x * 0.15 + ripple * normal.x;
    pos.y += liquidDistortion * 0.3 + mouseInfluence.y * 0.15 + ripple * normal.y;
    pos.z += liquidDistortion * 0.2 + ripple * normal.z;
    
    // Organic wave effect
    float wave1 = sin(position.x * 2.0 + position.y * 1.5 + uTime * 1.5) * 0.08;
    float wave2 = cos(position.y * 2.5 + position.z * 1.0 - uTime * 1.2) * 0.06;
    pos += normal * (wave1 + wave2);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform float uDarkMode;
  uniform vec3 uLightColor;
  uniform vec3 uDarkColor;
  uniform vec3 uAccentColor;
  uniform vec3 uSecondaryColor;
  uniform float uOpacity;
  
  // Simplex 2D Noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  void main() {
    // Quantum field fluctuations
    float quantum1 = snoise(vUv * 10.0 + uTime * 0.5);
    float quantum2 = snoise(vUv * 20.0 - uTime * 0.7 + vec2(42.0));
    float quantum3 = snoise(vUv * 30.0 + uTime * 0.3 + vec2(137.0));
    
    // Wave function probability density
    float waveFunction = sin(length(vPosition) * 5.0 - uTime * 2.0) * 0.5 + 0.5;
    float probability = quantum1 * 0.4 + quantum2 * 0.3 + quantum3 * 0.3;
    probability = smoothstep(-0.5, 0.5, probability);
    
    // Quantum superposition of colors
    vec3 state1 = uLightColor;      // Green state
    vec3 state2 = uAccentColor;     // Orange state  
    vec3 state3 = uDarkColor;       // Purple state
    vec3 state4 = uSecondaryColor;  // Teal state
    
    // Probability amplitudes for each state
    float amp1 = sin(vPosition.x * 3.14159 + uTime) * 0.5 + 0.5;
    float amp2 = cos(vPosition.y * 3.14159 - uTime * 1.2) * 0.5 + 0.5;
    float amp3 = sin(vPosition.z * 3.14159 + uTime * 0.8) * 0.5 + 0.5;
    float amp4 = cos(length(vPosition) * 2.0 - uTime * 1.5) * 0.5 + 0.5;
    
    // Normalize amplitudes (Born rule)
    float totalAmp = amp1 + amp2 + amp3 + amp4;
    amp1 /= totalAmp;
    amp2 /= totalAmp;
    amp3 /= totalAmp;
    amp4 /= totalAmp;
    
    // Quantum color superposition
    vec3 quantumColor = state1 * amp1 + state2 * amp2 + state3 * amp3 + state4 * amp4;
    
    // Entanglement patterns
    float entanglement = sin(vPosition.x * vPosition.y * 10.0 + uTime) * 
                        cos(vPosition.y * vPosition.z * 10.0 - uTime) * 0.2;
    quantumColor *= (1.0 + entanglement);
    
    // Quantum tunneling effect
    float tunnel = exp(-length(vPosition - vec3(sin(uTime), cos(uTime), sin(uTime * 0.7)) * 3.0));
    quantumColor += vec3(tunnel * 0.3, tunnel * 0.5, tunnel * 0.7);
    
    // Uncertainty principle visualization
    float uncertainty = snoise(vPosition.xy * 50.0 + uTime * 5.0) * 0.1;
    quantumColor += vec3(uncertainty);
    
    // Observer effect - mouse interaction collapses wave function
    vec2 observerPos = uMouse;
    float observation = exp(-length(vUv - observerPos) * 5.0);
    vec3 collapsedState = mix(quantumColor, state2, observation);
    
    // Quantum interference patterns
    float interference = sin(vUv.x * 40.0 + uTime * 2.0) * sin(vUv.y * 40.0 - uTime * 3.0);
    interference *= (1.0 - observation) * 0.2;
    collapsedState += vec3(interference * 0.5, interference * 0.3, interference * 0.7);
    
    // Time dilation near massive quantum objects
    float timeDilation = 1.0 / (1.0 + length(vPosition) * 0.1);
    float localTime = uTime * timeDilation;
    
    // Quantum foam at small scales
    float foam = snoise(vPosition.xy * 100.0 + localTime * 10.0) * 
                 snoise(vPosition.yz * 100.0 - localTime * 10.0) * 0.1;
    collapsedState += vec3(foam);
    
    // Final alpha with quantum fluctuations
    float alpha = uOpacity * (0.3 + probability * 0.4 + waveFunction * 0.3);
    
    // Dark mode quantum glow
    if (uDarkMode > 0.5) {
      collapsedState *= 1.5;
      collapsedState += vec3(0.1, 0.05, 0.15); // Quantum vacuum energy
      alpha *= 0.9;
    }
    
    gl_FragColor = vec4(collapsedState, alpha);
  }
`;