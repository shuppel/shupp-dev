import * as THREE from "three";
import type { CreatureKind } from "./creatureEngine";
import type { GearId } from "./companions";
import { places } from "./townModel";
import {
  defaultGenome,
  phenotype,
  seededRandom,
  type Genome,
} from "./creatureGenetics";

export const species = {
  sprout: {
    name: "Frill grazer",
    family: "Triceratops",
    description: "A low-set grazer with a weathered crown.",
  },
  finch: {
    name: "Reed runner",
    family: "Raptor",
    description: "A feathered forager with a long, balancing tail.",
  },
  moth: {
    name: "Canopy browser",
    family: "Sauropod",
    description: "A long-necked browser with a quiet, searching gaze.",
  },
};
const unitSphere = new THREE.SphereGeometry(1, 32, 24);
const dinoSphere = new THREE.SphereGeometry(1, 48, 32);
const portraitSphere = new THREE.SphereGeometry(1, 64, 48);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
export function material(
  color: THREE.ColorRepresentation,
  roughness = 0.78,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}
export function ball(
  parent: THREE.Object3D,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  geometry: THREE.BufferGeometry = unitSphere,
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(
  parent: THREE.Object3D,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
): THREE.Mesh {
  const m = new THREE.Mesh(boxGeo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function pole(
  parent: THREE.Object3D,
  mat: THREE.Material,
  a: THREE.Vector3,
  b: THREE.Vector3,
  r1: number,
  r2 = r1,
): THREE.Mesh {
  const delta = b.clone().sub(a),
    m = new THREE.Mesh(
      new THREE.CylinderGeometry(r2, r1, delta.length(), 24),
      mat,
    );
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    delta.normalize(),
  );
  m.castShadow = true;
  parent.add(m);
  return m;
}
function cone(
  parent: THREE.Object3D,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
  tilt = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 40, 6), mat);
  m.position.set(x, y, z);
  m.rotation.x = tilt;
  m.castShadow = true;
  parent.add(m);
  return m;
}
// Pigment and scale relief are independent: dark markings do not become pits.
// A saved seed reproduces the same individual in the town and every portrait.
function skin(genome: Genome): THREE.MeshStandardMaterial {
  const traits = phenotype(genome),
    rand = seededRandom(genome.seed ^ 0x738bd12);
  const pigment = document.createElement("canvas");
  pigment.width = 1024;
  pigment.height = 512;
  const ctx = pigment.getContext("2d");
  if (ctx !== null) {
    ctx.fillStyle = traits.palette.hide;
    ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 130; i++) {
      const x = rand() * 1024,
        y = rand() * 512,
        r = 25 + rand() * 100,
        g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(
        0,
        i % 2 === 0 ? "rgba(243,234,206,.09)" : "rgba(44,49,38,.075)",
      );
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.fillStyle = traits.palette.mark;
    ctx.strokeStyle = traits.palette.mark;
    if (traits.marking === "freckles") {
      for (let i = 0; i < 950; i++) {
        ctx.globalAlpha = 0.1 + rand() * 0.23;
        ctx.beginPath();
        ctx.ellipse(
          rand() * 1024,
          rand() * 512,
          1 + rand() * 5,
          1 + rand() * 3,
          rand() * 3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    } else if (traits.marking === "bands") {
      for (let i = 0; i < 14; i++) {
        ctx.globalAlpha = 0.15 + rand() * 0.11;
        ctx.lineWidth = 10 + rand() * 15;
        ctx.beginPath();
        const x = i * 85;
        ctx.moveTo(x, -20);
        ctx.bezierCurveTo(x + 55, 130, x - 55, 330, x + 25, 540);
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < 120; i++) {
        ctx.globalAlpha = 0.08 + rand() * 0.08;
        ctx.lineWidth = 2 + rand() * 4;
        const x = rand() * 1024,
          y = rand() * 512;
        ctx.beginPath();
        ctx.ellipse(
          x,
          y,
          12 + rand() * 28,
          6 + rand() * 16,
          rand() * 4,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  const relief = document.createElement("canvas");
  relief.width = relief.height = 512;
  const rc = relief.getContext("2d");
  if (rc !== null) {
    rc.fillStyle = "#6d6d6d";
    rc.fillRect(0, 0, 512, 512);
    for (let row = -1; row < 54; row++)
      for (let col = -1; col < 54; col++) {
        const x = col * 10 + (row % 2) * 5,
          y = row * 10,
          r = 3.6 + rand() * 0.7,
          g = rc.createRadialGradient(x - 1, y - 1, 0.3, x, y, r);
        g.addColorStop(0, "#b6b6b6");
        g.addColorStop(0.7, "#969696");
        g.addColorStop(1, "#6d6d6d");
        rc.fillStyle = g;
        rc.beginPath();
        rc.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2);
        rc.fill();
      }
  }
  const map = new THREE.CanvasTexture(pigment),
    bump = new THREE.CanvasTexture(relief);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [map, bump]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
  }
  bump.repeat.set(2, 1.5);
  const m = new THREE.MeshStandardMaterial({
    map,
    bumpMap: bump,
    bumpScale: 0.027,
    roughness: traits.roughness,
    metalness: 0,
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.skinBelly = {
      value: new THREE.Color(traits.palette.belly),
    };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSkinNormal;",
      )
      .replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nvSkinNormal = normal;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSkinNormal;\nuniform vec3 skinBelly;",
      )
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\nfloat underside = 1.0-smoothstep(-.65,.12,normalize(vSkinNormal).y);\ndiffuseColor.rgb = mix(diffuseColor.rgb, skinBelly, underside*.52);\ndiffuseColor.rgb *= mix(1.0,.88,smoothstep(.1,.9,vSkinNormal.y));",
      );
  };
  m.customProgramCacheKey = () => "fern-fauna-skin-v2";
  return m;
}
export interface DinoRig {
  group: THREE.Group;
  body: THREE.Group;
  legs: THREE.Group[];
  tail: THREE.Group;
  head: THREE.Group;
}
export function makeDino(
  kind: CreatureKind,
  equipped: GearId[] = [],
  level = 1,
  genome: Genome = defaultGenome,
  detail: "world" | "portrait" = "world",
): DinoRig {
  const group = new THREE.Group(),
    body = new THREE.Group(),
    head = new THREE.Group(),
    tail = new THREE.Group(),
    legs: THREE.Group[] = [];
  group.add(body);
  group.userData.genome = genome.seed;
  const traits = phenotype(genome),
    rand = seededRandom(genome.seed ^ 0x991ec),
    geometry = detail === "portrait" ? portraitSphere : dinoSphere;
  const part = (
    parent: THREE.Object3D,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ): THREE.Mesh => ball(parent, mat, x, y, z, sx, sy, sz, geometry);
  const hide = skin(genome),
    dark = material("#28342d", 0.32),
    ivory = material("#b9b49c", 0.72),
    mark = material(traits.palette.mark),
    iris = material(traits.palette.iris, 0.3),
    gold = material("#b59a63", 0.45);
  const long = kind === "moth",
    raptor = kind === "finch",
    frilled = kind === "sprout";
  part(
    body,
    hide,
    0,
    raptor ? 1.18 : 1.04,
    0,
    raptor ? 0.49 : 0.66,
    raptor ? 0.57 : 0.62,
    long ? 1.12 : 1.03,
  );
  // A longer horizontal torso and anatomical neck replace the upright mascot belly.
  if (raptor) {
    const chest = part(body, hide, 0, 1.43, 0.43, 0.36, 0.55, 0.42);
    chest.rotation.x = 0.3;
  }
  tail.position.set(0, 1, -0.69);
  tail.scale.z = traits.tail;
  body.add(tail);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.08, -0.01, -0.6),
    new THREE.Vector3(0.28, 0.06, -1.25),
    new THREE.Vector3(0.46, 0.16, -1.95),
  ]);
  const tubular = detail === "portrait" ? 80 : 56,
    radial = detail === "portrait" ? 32 : 24,
    tailGeom = new THREE.TubeGeometry(curve, tubular, 0.34, radial, false),
    pos = tailGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = Math.floor(i / (radial + 1)) / tubular,
      center = curve.getPointAt(t),
      v = new THREE.Vector3().fromBufferAttribute(pos, i);
    v.sub(center)
      .multiplyScalar(Math.pow(1 - t, 0.85) * 0.985 + 0.015)
      .add(center);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  tailGeom.computeVertexNormals();
  const tm = new THREE.Mesh(tailGeom, hide);
  tm.castShadow = true;
  tm.receiveShadow = true;
  tail.add(tm);
  for (const side of [-1, 1]) {
    const positions = raptor ? [-0.22] : [0.58, -0.63];
    for (const z of positions) {
      const leg = new THREE.Group();
      leg.position.set(side * (raptor ? 0.39 : 0.47), 0.82, z);
      body.add(leg);
      legs.push(leg);
      part(leg, hide, 0, -0.18, 0, raptor ? 0.25 : 0.21, 0.39, 0.28);
      part(leg, hide, 0, -0.51, 0.075, 0.13, 0.27, 0.17);
      part(leg, hide, 0, -0.68, 0.23, 0.2, 0.14, 0.32);
      for (const toe of [-1, 0, 1])
        part(leg, ivory, toe * 0.115, -0.68, 0.46, 0.044, 0.045, 0.09);
    }
    if (raptor) {
      const arm = part(body, hide, side * 0.4, 1.4, 0.55, 0.115, 0.27, 0.13);
      arm.rotation.z = side * 0.5;
      part(body, hide, side * 0.53, 1.22, 0.7, 0.08, 0.11, 0.19);
      for (let f = 0; f < 5; f++) {
        const feather = part(
          body,
          mark,
          side * (0.49 + f * 0.038),
          1.29 - f * 0.065,
          0.55 - f * 0.018,
          0.035,
          0.18,
          0.1,
        );
        feather.rotation.z = side * -0.48;
      }
    }
  }
  head.position.set(
    0,
    long ? 2.72 : raptor ? 1.96 : 1.44,
    long ? 0.61 : raptor ? 0.7 : 0.99,
  );
  head.scale.setScalar(traits.head);
  body.add(head);
  if (long) {
    head.position.y *= traits.neck;
    const neckTop = head.position.y + 0.04,
      neckBase = 0.9;
    const neck = part(
      body,
      hide,
      0,
      (neckTop + neckBase) / 2,
      0.42,
      0.3,
      (neckTop - neckBase) / 2 + 0.1,
      0.34,
    );
    neck.rotation.x = 0.11;
  }
  const headWidth = frilled ? 0.49 : raptor ? 0.36 : 0.33,
    headHeight = frilled ? 0.37 : 0.28;
  part(head, hide, 0, 0.03, 0, headWidth, headHeight, frilled ? 0.55 : 0.48);
  part(
    head,
    hide,
    0,
    -0.11,
    frilled ? 0.4 : 0.46,
    frilled ? 0.4 : 0.27,
    frilled ? 0.23 : 0.18,
    frilled ? 0.46 : 0.57,
  );
  part(head, hide, 0, -0.24, 0.48, frilled ? 0.34 : 0.24, 0.065, 0.41);
  // Small lateral amber eyes sit in skin lids. No white eye-mask, cheek buttons, or chest badge.
  for (const side of [-1, 1]) {
    const x = side * headWidth * 0.86;
    part(head, hide, x, 0.085, 0.27, 0.13, 0.145, 0.105);
    part(head, iris, x + side * 0.034, 0.055, 0.342, 0.077, 0.09, 0.045);
    part(head, dark, x + side * 0.038, 0.052, 0.379, 0.032, 0.065, 0.018);
    part(
      head,
      material("#e6dfc5", 0.15),
      x + side * 0.031,
      0.083,
      0.394,
      0.013,
      0.016,
      0.009,
    );
    const brow = part(head, hide, x, 0.155, 0.31, 0.14, 0.055, 0.09);
    brow.rotation.z = side * 0.12;
    part(
      head,
      dark,
      side * (frilled ? 0.22 : 0.15),
      -0.015,
      frilled ? 0.801 : 0.945,
      0.023,
      0.017,
      0.014,
    );
  }
  if (frilled) {
    const frill = part(
      head,
      hide,
      0,
      0.21,
      -0.42,
      0.79 * traits.crest,
      0.66 * traits.crest,
      0.16,
    );
    frill.rotation.x = -0.23;
    for (let i = 0; i < 11; i++) {
      const a = (Math.PI * i) / 10;
      const bump = part(
        head,
        hide,
        Math.cos(a) * 0.72 * traits.crest,
        0.17 + Math.sin(a) * 0.62 * traits.crest,
        -0.4,
        0.07,
        0.085,
        0.07,
      );
      bump.rotation.z = -a;
    }
    for (const side of [-1, 1]) {
      const horn = cone(
        head,
        ivory,
        side * 0.3,
        0.45,
        0.15,
        0.088,
        0.49 * traits.crest * (0.97 + rand() * 0.06),
        0.62,
      );
      horn.rotation.z = side * -0.13;
    }
    cone(head, ivory, 0, 0.065, 0.65, 0.075, 0.23 * traits.crest, 0.7);
    // A horn-coloured beak is kept small and blunt.
    part(head, ivory, 0, -0.155, 0.84, 0.16, 0.1, 0.1);
  } else if (raptor) {
    for (let i = 0; i < 7; i++) {
      const plume = part(
        head,
        mark,
        (i % 2 === 0 ? -1 : 1) * 0.04,
        0.29 - i * 0.016,
        -0.05 - i * 0.058,
        0.022,
        0.095 * traits.crest,
        0.078,
      );
      plume.rotation.x = -0.55;
    }
  } else {
    for (let i = 0; i < 6; i++)
      part(
        body,
        hide,
        0,
        1.62 - i * 0.06,
        -0.15 - i * 0.18,
        0.055,
        0.075 * traits.crest,
        0.09,
      );
  }
  // Field equipment stays recognisable as equipment, not part of a species silhouette.
  if (equipped.includes("scarf")) {
    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(long ? 0.29 : 0.37, 0.06, 20, 56),
      material("#a86850"),
    );
    scarf.rotation.x = Math.PI / 2;
    scarf.position.set(0, long ? 2.02 : raptor ? 1.62 : 1.27, 0.52);
    body.add(scarf);
    const flap = box(
      body,
      scarf.material,
      0.18,
      scarf.position.y - 0.2,
      0.77,
      0.13,
      0.33,
      0.045,
    );
    flap.rotation.z = -0.15;
  }
  if (equipped.includes("lens")) {
    const lens = new THREE.Mesh(
      new THREE.TorusGeometry(0.133, 0.025, 16, 48),
      gold,
    );
    lens.position.set(headWidth * 0.86 + 0.04, 0.058, 0.391);
    head.add(lens);
    part(
      head,
      new THREE.MeshPhysicalMaterial({
        color: "#b7c8b1",
        transparent: true,
        opacity: 0.22,
        roughness: 0.13,
      }),
      headWidth * 0.86 + 0.04,
      0.058,
      0.4,
      0.113,
      0.113,
      0.012,
    );
  }
  if (equipped.includes("planner")) {
    box(body, material("#695b43"), -0.56, 1.03, 0.43, 0.32, 0.4, 0.1);
    box(body, ivory, -0.56, 1.03, 0.49, 0.26, 0.32, 0.02);
    for (let i = 0; i < 3; i++)
      box(body, mark, -0.56, 1.11 - i * 0.075, 0.507, 0.17, 0.015, 0.01);
  }
  if (equipped.includes("retry")) {
    const charm = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.026, 16, 40),
      gold,
    );
    charm.position.set(0.59, 1.04, 0.47);
    body.add(charm);
  }
  if (equipped.includes("wings"))
    for (const side of [-1, 1]) {
      const wing = part(
        body,
        ivory,
        side * 0.61,
        1.42,
        -0.34,
        0.09,
        0.32,
        0.29,
      );
      wing.rotation.z = side * -0.55;
    }
  if (level >= 3) {
    const tag = box(body, gold, 0.51, 1.16, 0.64, 0.085, 0.12, 0.025);
    tag.rotation.z = 0.1;
  }
  group.scale.set(traits.width, traits.height, traits.length);
  group.rotation.y = -0.25;
  return { group, body, legs, tail, head };
}
export function animateDino(
  rig: DinoRig,
  time: number,
  moving: boolean,
  reduced: boolean,
): void {
  const wave = reduced ? 0 : Math.sin(time * (moving ? 10 : 2));
  rig.body.position.y = wave * (moving ? 0.045 : 0.018);
  rig.tail.rotation.y = reduced ? 0 : Math.sin(time * 2) * 0.13;
  rig.head.rotation.z = reduced ? 0 : Math.sin(time * 1.6) * 0.025;
  rig.legs.forEach((leg, i) => {
    leg.rotation.x = moving ? wave * 0.3 * (i % 2 === 0 ? 1 : -1) : 0;
  });
}
export function makeKeeper(): {
  group: THREE.Group;
  legs: THREE.Group[];
  arms: THREE.Group[];
} {
  const group = new THREE.Group(),
    legs: THREE.Group[] = [],
    arms: THREE.Group[] = [],
    pants = material("#394e53"),
    shirt = material("#f4dcaa"),
    skinMat = material("#bd885e"),
    hair = material("#43392d");
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.2, 0.83, 0);
    ball(leg, pants, 0, -0.24, 0, 0.18, 0.35, 0.2);
    ball(leg, material("#554536"), 0, -0.62, 0.13, 0.2, 0.14, 0.3);
    group.add(leg);
    legs.push(leg);
    const arm = new THREE.Group();
    arm.position.set(side * 0.43, 1.44, 0);
    ball(arm, shirt, 0, -0.14, 0, 0.17, 0.29, 0.17);
    ball(arm, skinMat, 0, -0.43, 0.015, 0.13, 0.13, 0.13);
    group.add(arm);
    arms.push(arm);
  }
  ball(group, shirt, 0, 1.21, 0, 0.47, 0.5, 0.29);
  box(group, material("#649284"), 0, 1.16, -0.28, 0.54, 0.63, 0.27);
  ball(group, skinMat, 0, 1.96, 0.015, 0.34, 0.38, 0.32);
  ball(group, hair, 0, 2.12, -0.065, 0.36, 0.3, 0.3);
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.59, 0.59, 0.08, 28),
    material("#bfa177"),
  );
  brim.position.y = 2.22;
  brim.castShadow = true;
  group.add(brim);
  ball(group, material("#dfc190"), 0, 2.33, -0.025, 0.4, 0.25, 0.37);
  box(group, material("#72866c"), 0, 2.25, 0.29, 0.5, 0.1, 0.12);
  for (const side of [-1, 1])
    ball(group, hair, side * 0.12, 1.98, 0.302, 0.035, 0.045, 0.025);
  return { group, legs, arms };
}
function tree(
  parent: THREE.Object3D,
  x: number,
  z: number,
  scale: number,
): void {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  parent.add(g);
  const trunk = material("#88715a");
  pole(
    g,
    trunk,
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.05, 2.5, 0),
    0.15,
    0.1,
  );
  const green = material("#709579");
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4;
    const b = ball(
      g,
      green,
      Math.cos(a) * 0.55,
      2.5 + Math.sin(i) * 0.3,
      Math.sin(a) * 0.55,
      0.9,
      0.72,
      0.83,
    );
    b.rotation.z = a;
  }
}
export function makeTown(): THREE.Group {
  const town = new THREE.Group(),
    grass = material("#aec298"),
    sand = material("#ead8b3"),
    wood = material("#795d43"),
    cream = material("#f3e6c4"),
    stone = material("#9baba0");
  const land = box(town, grass, 0, -0.45, 0, 26, 0.8, 23);
  land.receiveShadow = true;
  box(town, sand, 0, -0.015, 1.9, 22, 0.09, 4.5);
  box(town, sand, 0, -0.01, -1.8, 4.8, 0.1, 12);
  box(town, sand, -6.3, -0.01, 3.6, 3.5, 0.1, 7);
  box(town, sand, 7, -0.01, 3.6, 3, 0.1, 7);
  for (let i = 0; i < 55; i++) {
    const x = Math.sin(i * 21.3) * 11,
      z = Math.cos(i * 13.1) * 9.4;
    if (Math.abs(z - 2) < 2 || Math.abs(x) < 2.5) continue;
    ball(
      town,
      material(i % 2 === 0 ? "#8cac79" : "#c9d39d"),
      x,
      0.06,
      z,
      0.19,
      0.08,
      0.18,
    );
  }
  for (const p of places) {
    const g = new THREE.Group();
    g.position.set(p.x, 0, p.z);
    g.userData.place = p.id;
    town.add(g);
    if (p.id === "shop" || p.id === "hatchery") {
      box(g, stone, 0, 0.16, 0, p.width + 0.25, 0.32, p.depth + 0.2);
      box(g, cream, 0, 1.6, 0, p.width, 2.9, p.depth);
      const roof = new THREE.Mesh(
        new THREE.CylinderGeometry(0, 1, 1, 4),
        material(p.color),
      );
      roof.position.y = 3.6;
      roof.scale.set(p.width * 0.82, 1.9, p.depth * 0.93);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      g.add(roof);
      box(g, wood, 0, 1.04, p.depth / 2 + 0.06, 1.15, 2.1, 0.18);
      box(
        g,
        material("#536b68"),
        0,
        1.45,
        p.depth / 2 + 0.17,
        0.69,
        0.62,
        0.035,
      );
      ball(
        g,
        material("#e6be6d"),
        0.38,
        1,
        p.depth / 2 + 0.19,
        0.05,
        0.05,
        0.06,
      );
      for (const side of [-1, 1]) {
        box(g, wood, side * 1.72, 1.7, p.depth / 2 + 0.1, 0.9, 1.18, 0.14);
        box(
          g,
          material("#8eb7b1"),
          side * 1.72,
          1.74,
          p.depth / 2 + 0.18,
          0.69,
          0.91,
          0.04,
        );
        box(g, cream, side * 1.72, 1.74, p.depth / 2 + 0.22, 0.04, 0.94, 0.04);
        box(g, cream, side * 1.72, 1.74, p.depth / 2 + 0.22, 0.71, 0.04, 0.04);
        box(g, wood, side * 1.72, 0.98, p.depth / 2 + 0.27, 1, 0.19, 0.48);
        for (let k = 0; k < 3; k++)
          ball(
            g,
            material("#78986b"),
            side * 1.72 + (k - 1) * 0.25,
            1.14,
            p.depth / 2 + 0.3,
            0.16,
            0.2,
            0.17,
          );
      }
      const awning = box(
        g,
        material(p.id === "shop" ? "#de9970" : "#8ca78a"),
        0,
        2.45,
        p.depth / 2 + 0.6,
        2.55,
        0.16,
        1.3,
      );
      awning.rotation.x = 0.13;
      for (const side of [-1, 1])
        pole(
          g,
          wood,
          new THREE.Vector3(side * 1.13, 0, p.depth / 2 + 1.1),
          new THREE.Vector3(side * 1.13, 2.4, p.depth / 2 + 1.1),
          0.055,
        );
      if (p.id === "hatchery") {
        for (let i = 0; i < 3; i++)
          ball(
            g,
            material(["#d5e2b8", "#e8c799", "#accbd1"][i]),
            -2 + i * 0.55,
            0.6,
            2.7,
            0.23,
            0.34,
            0.23,
          );
      } else {
        for (let i = 0; i < 2; i++) {
          box(g, wood, 2 + i * 0.15, 0.35 + i * 0.5, 2.65, 0.65, 0.65, 0.65);
        }
      }
    } else if (p.id === "missions") {
      for (const side of [-1, 1])
        pole(
          g,
          wood,
          new THREE.Vector3(side, 0, 0),
          new THREE.Vector3(side, 2.65, 0),
          0.095,
        );
      box(g, wood, 0, 1.85, 0, 2.5, 1.5, 0.25);
      box(g, material("#bd9671"), 0, 1.85, 0.14, 2.25, 1.25, 0.03);
      for (let i = 0; i < 3; i++) {
        const paper = box(
          g,
          cream,
          (i - 1) * 0.65,
          1.84,
          0.18,
          0.48,
          0.77,
          0.03,
        );
        paper.rotation.z = (i - 1) * 0.09;
        box(
          g,
          material("#ad7960"),
          (i - 1) * 0.65,
          1.97,
          0.205,
          0.3,
          0.055,
          0.01,
        );
      }
      const roof = box(g, material("#6b8a75"), 0, 2.8, 0, 2.8, 0.17, 0.85);
      roof.rotation.x = 0.17;
    } else if (p.id === "camp") {
      const tent = new THREE.Mesh(
        new THREE.ConeGeometry(2.05, 2.7, 3),
        material("#d6b878"),
      );
      tent.rotation.y = Math.PI / 3;
      tent.position.y = 1.35;
      tent.castShadow = true;
      g.add(tent);
      box(g, wood, 1.1, 0.7, 1.02, 0.65, 1.4, 0.055);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        ball(
          g,
          stone,
          Math.cos(a) * 0.55 + 0.8,
          0.14,
          Math.sin(a) * 0.55 + 2,
          0.22,
          0.15,
          0.19,
        );
      }
      pole(
        g,
        wood,
        new THREE.Vector3(0.4, 0.15, 1.9),
        new THREE.Vector3(1.2, 0.15, 2.1),
        0.12,
      );
    } else {
      for (const side of [-1, 1]) {
        box(g, stone, side * 1.6, 1.8, 0, 0.52, 3.6, 0.7);
        ball(g, material("#7a9f78"), side * 1.6, 3.72, 0, 0.65, 0.35, 0.53);
      }
      box(g, wood, 0, 3.4, 0, 3.8, 0.42, 0.48);
      box(g, cream, 0, 3.39, 0.26, 1.7, 0.27, 0.04);
    }
  }
  for (const [x, z, s] of [
    [-11, -8, 1.35],
    [-3, -9, 1],
    [4, -9, 1.2],
    [11, -8, 1.5],
    [-11, 3, 1.2],
    [11, 1, 1],
    [-11, 8, 1.25],
    [1, 9.5, 1.1],
    [11, 9, 1.25],
  ])
    tree(town, x, z, s);
  // A shallow pond, stepping stones, ferns and a fence give the town a lived-in edge.
  const pond = ball(
    town,
    material("#7fafad", 0.24),
    -3,
    0.01,
    7.7,
    1.5,
    0.04,
    1.15,
  );
  pond.receiveShadow = true;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    ball(
      town,
      stone,
      -3 + Math.cos(a) * 1.5,
      0.05,
      7.7 + Math.sin(a) * 1.1,
      0.25,
      0.14,
      0.2,
    );
  }
  for (let i = 0; i < 13; i++) {
    const x = -11 + i * 1.8;
    box(town, wood, x, 0.65, -10, 0.13, 1.3, 0.13);
    if (i < 12) box(town, wood, x + 0.9, 0.85, -10, 1.8, 0.11, 0.11);
  }
  return town;
}
export function lightScene(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight("#fff4db", "#718c76", 2.7));
  const sun = new THREE.DirectionalLight("#ffe9c0", 3.2);
  sun.position.set(-10, 18, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -19,
    right: 19,
    top: 19,
    bottom: -19,
    near: 0.1,
    far: 70,
  });
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.0003;
  sun.shadow.radius = 3;
  scene.add(sun);
  const rim = new THREE.DirectionalLight("#c8e4ec", 1);
  rim.position.set(10, 6, -10);
  scene.add(rim);
}
export function disposeScene(scene: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>();
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      geometries.add(obj.geometry);
      for (const mat of Array.isArray(obj.material)
        ? obj.material
        : [obj.material]) {
        materials.add(mat);
        if (mat instanceof THREE.MeshStandardMaterial) {
          if (mat.map !== null) textures.add(mat.map);
          if (mat.bumpMap !== null) textures.add(mat.bumpMap);
          if (mat.roughnessMap !== null) textures.add(mat.roughnessMap);
        }
      }
    }
  });
  geometries.forEach((g) => {
    if (
      g !== unitSphere &&
      g !== boxGeo &&
      g !== dinoSphere &&
      g !== portraitSphere
    )
      g.dispose();
  });
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}
