import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { disposeScene, lightScene, makeDino, species } from "./dinoScene";
import type { CreatureKind } from "./creatureEngine";
import type { GearId } from "./companions";
export default function DinoPortrait({
  kind,
  equipment = [],
  level = 1,
}: {
  kind: CreatureKind;
  equipment?: GearId[];
  level?: number;
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
      );
    scene.add(rig.group);
    rig.group.rotation.y = -0.52;
    camera.position.set(4, 3.1, 6.5);
    camera.lookAt(0, 1.35, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
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
      camera.zoom = Math.min(1, camera.aspect / 0.95);
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
  }, [kind, signature, level]);
  return (
    <div
      ref={host}
      className="ct-dino-portrait"
      role="img"
      aria-label={`${species[kind].name} dinosaur companion`}
    >
      {failed && <span>{species[kind].family}</span>}
    </div>
  );
}
