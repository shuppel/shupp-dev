import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { disposeScene, lightScene, makeDino, species } from "./dinoScene";
import type { CreatureKind } from "./creatureEngine";
import type { GearId } from "./companions";
import { defaultGenome, type Genome } from "./creatureGenetics";
export default function DinoPortrait({
  kind,
  equipment = [],
  level = 1,
  genome = defaultGenome,
}: {
  kind: CreatureKind;
  equipment?: GearId[];
  level?: number;
  genome?: Genome;
}): React.JSX.Element {
  const host = useRef<HTMLDivElement>(null),
    [failed, setFailed] = useState(false),
    signature = equipment.join(",");
  useEffect(() => {
    const node = host.current;
    if (node === null) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      setFailed(true);
      return;
    }
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30),
      rig = makeDino(
        kind,
        signature.length > 0 ? (signature.split(",") as GearId[]) : [],
        level,
        genome,
        "portrait",
      );
    scene.add(rig.group);
    rig.group.rotation.y = -0.52;
    const bounds = new THREE.Box3().setFromObject(rig.group),
      center = bounds.getCenter(new THREE.Vector3());
    camera.position.copy(center).add(new THREE.Vector3(4, 1.75, 6.5));
    camera.lookAt(center);
    camera.updateMatrixWorld();
    renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio, 1.5), 2.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    lightScene(scene);
    node.append(renderer.domElement);
    const resize = (): void => {
      const w = node.clientWidth,
        h = node.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.zoom = 1;
      camera.updateProjectionMatrix();
      // Fit the actual hatchling, including its tail and equipment, on narrow screens.
      let extentX = 0,
        extentY = 0;
      for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
          for (const z of [bounds.min.z, bounds.max.z]) {
            const point = new THREE.Vector3(x, y, z).project(camera);
            extentX = Math.max(extentX, Math.abs(point.x));
            extentY = Math.max(extentY, Math.abs(point.y));
          }
      camera.zoom = Math.min(1.15, 0.92 / extentX, 0.9 / extentY);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    resize();
    return () => {
      observer.disconnect();
      disposeScene(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [kind, signature, level, genome.seed, genome.version]);
  return (
    <div
      ref={host}
      className="ct-dino-portrait"
      data-genome={genome.seed}
      role="img"
      aria-label={`${species[kind].name} dinosaur companion`}
    >
      {failed && <span>{species[kind].family}</span>}
    </div>
  );
}
