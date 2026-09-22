import * as THREE from "three";
import type { CreatureKind } from "./creatureEngine";
import type { GearId } from "./companions";
import { places } from "./townModel";

export const species = {
  sprout: {
    name: "Mossback",
    family: "Triceratops",
    color: "#769c63",
    ink: "#33593b",
    description: "A big frill. A steady little friend.",
  },
  finch: {
    name: "Embertail",
    family: "Raptor",
    color: "#d58c51",
    ink: "#865236",
    description: "Quick feet and a very curious nose.",
  },
  moth: {
    name: "Tidecrest",
    family: "Sauropod",
    color: "#77a9b4",
    ink: "#426779",
    description: "A long neck. A softer view of the world.",
  },
};
const unitSphere = new THREE.SphereGeometry(1, 24, 16);
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
): THREE.Mesh {
  const m = new THREE.Mesh(unitSphere, mat);
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
      new THREE.CylinderGeometry(r2, r1, delta.length(), 12),
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
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 16), mat);
  m.position.set(x, y, z);
  m.rotation.x = tilt;
  m.castShadow = true;
  parent.add(m);
  return m;
}
// The skin uses a generated scale height map and pigment map under real scene lighting.
// Keeping these local makes portraits and the world share the exact same material.
function skin(color: string): THREE.MeshStandardMaterial {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  if (ctx !== null) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 24; row++)
      for (let col = 0; col < 24; col++) {
        const x = col * 12 + (row % 2) * 6,
          y = row * 12;
        ctx.fillStyle = `rgba(255,247,207,${0.07 + (0.08 * ((col * 7 + row * 11) % 9)) / 9})`;
        ctx.beginPath();
        ctx.ellipse(x, y, 4.6, 3.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(30,55,35,.11)";
        ctx.lineWidth = 0.65;
        ctx.stroke();
      }
  }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 1.5);
  const m = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map,
    bumpMap: map,
    bumpScale: 0.055,
    roughness: 0.57,
    metalness: 0,
  });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      "#include <common>\nvarying vec3 vSkinNormal;",
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <beginnormal_vertex>",
      "#include <beginnormal_vertex>\nvSkinNormal = normal;",
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      "#include <common>\nvarying vec3 vSkinNormal;",
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      "#include <color_fragment>\nfloat dorsal = smoothstep(-0.4, 0.8, vSkinNormal.y);\ndiffuseColor.rgb *= mix(vec3(1.13,1.07,.87),vec3(.78,.89,.78),dorsal);",
    );
  };
  m.customProgramCacheKey = () => "dino-skin-v1";
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
): DinoRig {
  const group = new THREE.Group(),
    body = new THREE.Group(),
    head = new THREE.Group(),
    tail = new THREE.Group(),
    legs: THREE.Group[] = [];
  group.add(body);
  const s = species[kind],
    hide = skin(s.color),
    belly = material("#e7dbaf"),
    dark = material("#243c39", 0.32),
    ivory = material("#f3e6bf"),
    spot = material(s.ink),
    gold = material("#d5a849", 0.35);
  const long = kind === "moth",
    raptor = kind === "finch";
  ball(body, hide, 0, 1.05, 0, 0.68, 0.72, 0.9);
  ball(body, belly, 0, 0.99, 0.46, 0.5, 0.54, 0.52);
  tail.position.set(0, 1, -0.56);
  body.add(tail);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.1, -0.04, -0.55),
    new THREE.Vector3(0.35, 0.05, -1.15),
    new THREE.Vector3(0.62, 0.26, -1.62),
  ]);
  // A tapered tail follows a curve instead of ending in a primitive cone.
  const tailGeom = new THREE.TubeGeometry(curve, 24, 0.33, 12, false);
  const pos = tailGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = Math.floor(i / 13) / 24,
      center = curve.getPointAt(t),
      v = new THREE.Vector3().fromBufferAttribute(pos, i);
    v.sub(center)
      .multiplyScalar(1 - t * 0.96)
      .add(center);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  tailGeom.computeVertexNormals();
  const tm = new THREE.Mesh(tailGeom, hide);
  tm.castShadow = true;
  tail.add(tm);
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.46, 0.8, raptor ? -0.1 : 0.35);
    body.add(leg);
    legs.push(leg);
    ball(leg, hide, 0, -0.22, 0, 0.27, 0.42, 0.29);
    ball(leg, hide, 0, -0.62, 0.14, 0.24, 0.2, 0.4);
    for (const toe of [-1, 0, 1])
      ball(leg, ivory, toe * 0.13, -0.64, 0.46, 0.05, 0.055, 0.115);
    if (!raptor) {
      const back = leg.clone();
      back.position.z = -0.56;
      body.add(back);
      legs.push(back);
    } else {
      ball(body, hide, side * 0.56, 1.25, 0.55, 0.13, 0.25, 0.14);
      ball(body, ivory, side * 0.57, 1.05, 0.68, 0.1, 0.06, 0.14);
    }
  }
  head.position.set(0, long ? 2.75 : 1.78, long ? 0.65 : 0.69);
  body.add(head);
  if (long) {
    const neck = ball(body, hide, 0, 2, 0.35, 0.36, 1.32, 0.38);
    neck.rotation.x = 0.17;
  }
  ball(head, hide, 0, 0.06, 0, raptor ? 0.55 : 0.6, 0.5, 0.61);
  ball(head, hide, 0, -0.13, 0.43, raptor ? 0.47 : 0.54, 0.29, 0.56);
  ball(head, belly, 0, -0.3, 0.49, 0.43, 0.095, 0.42);
  // Eyelids, glossy eyes, catchlights, nostrils and cheek patches give each silhouette a face.
  for (const side of [-1, 1]) {
    ball(head, spot, side * 0.44, 0.17, 0.29, 0.21, 0.23, 0.15);
    ball(head, ivory, side * 0.455, 0.15, 0.36, 0.154, 0.177, 0.1);
    ball(head, dark, side * 0.458, 0.15, 0.443, 0.093, 0.123, 0.057);
    ball(
      head,
      material("#ffffff", 0.05),
      side * 0.439,
      0.196,
      0.484,
      0.031,
      0.036,
      0.02,
    );
    ball(head, spot, side * 0.255, -0.06, 0.916, 0.047, 0.038, 0.026);
    ball(
      head,
      material(raptor ? "#ecae70" : "#a1b883"),
      side * 0.49,
      -0.18,
      0.57,
      0.12,
      0.056,
      0.08,
    );
  }
  if (kind === "sprout") {
    const frill = ball(head, hide, 0, 0.18, -0.39, 0.91, 0.83, 0.14);
    frill.rotation.x = -0.17;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (i / 8);
      ball(
        head,
        belly,
        Math.cos(a) * 0.8,
        0.14 + Math.sin(a) * 0.78,
        -0.37,
        0.13,
        0.14,
        0.07,
      );
    }
    for (const side of [-1, 1])
      cone(head, ivory, side * 0.4, 0.58, 0.25, 0.12, 0.57, 0.46);
    cone(head, ivory, 0, 0.11, 0.77, 0.085, 0.3, 0.7);
  } else if (raptor) {
    for (let i = 0; i < 4; i++)
      cone(
        head,
        spot,
        0,
        0.47 - i * 0.016,
        -0.03 - i * 0.16,
        0.11,
        0.3 - i * 0.035,
        -0.25,
      );
  } else {
    for (let i = 0; i < 3; i++)
      ball(head, spot, 0, 0.53, -0.2 + i * 0.16, 0.1, 0.22 - i * 0.04, 0.12);
  }
  for (let i = 0; i < 5; i++)
    for (const side of [-1, 1])
      ball(
        body,
        spot,
        side * (0.59 - i * 0.035),
        1.2 + i * 0.065,
        -0.45 + i * 0.19,
        0.078,
        0.055,
        0.09,
      );
  if (equipped.includes("scarf")) {
    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.43, 0.1, 10, 28),
      material("#cb6750"),
    );
    scarf.rotation.x = Math.PI / 2;
    scarf.position.set(0, long ? 1.9 : 1.61, 0.52);
    body.add(scarf);
    const flap = box(body, scarf.material, 0.23, 1.34, 0.8, 0.2, 0.43, 0.055);
    flap.rotation.z = -0.2;
  }
  if (equipped.includes("lens")) {
    const lens = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.036, 8, 24),
      gold,
    );
    lens.position.set(0.455, head.position.y + 0.15, head.position.z + 0.47);
    body.add(lens);
    ball(
      body,
      new THREE.MeshPhysicalMaterial({
        color: "#b1e6df",
        transparent: true,
        opacity: 0.4,
        roughness: 0.1,
      }),
      0.455,
      head.position.y + 0.15,
      head.position.z + 0.475,
      0.17,
      0.17,
      0.02,
    );
  }
  if (equipped.includes("planner")) {
    box(body, material("#654b37"), -0.58, 1.02, 0.55, 0.45, 0.54, 0.12);
    box(body, ivory, -0.58, 1.03, 0.625, 0.36, 0.43, 0.03);
    for (let i = 0; i < 3; i++)
      box(body, spot, -0.58, 1.15 - i * 0.1, 0.646, 0.23, 0.018, 0.016);
  }
  if (equipped.includes("retry")) {
    const charm = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.04, 8, 20),
      gold,
    );
    charm.position.set(0.63, 1.05, 0.5);
    body.add(charm);
  }
  if (equipped.includes("wings"))
    for (const side of [-1, 1]) {
      const wing = ball(body, belly, side * 0.73, 1.55, -0.35, 0.16, 0.5, 0.42);
      wing.rotation.z = side * -0.55;
    }
  if (level >= 3) ball(body, gold, 0, 1.22, 0.79, 0.12, 0.12, 0.05);
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
        if (mat instanceof THREE.MeshStandardMaterial && mat.map !== null)
          textures.add(mat.map);
      }
    }
  });
  geometries.forEach((g) => {
    if (g !== unitSphere && g !== boxGeo) g.dispose();
  });
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}
