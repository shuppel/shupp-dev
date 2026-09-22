import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import {
  animateDino,
  disposeScene,
  lightScene,
  makeDino,
  makeKeeper,
  makeTown,
  type DinoRig,
} from "./dinoScene";
import {
  distance,
  findTownPath,
  isWalkable,
  nearbyPlace,
  nearbyWalkable,
  places,
  townSpawn,
  walkStep,
  type PlaceId,
  type Point,
} from "./townModel";
import { levelFor } from "./companions";
import type { Worker } from "./creatureEngine";
export interface TownControl {
  goTo: (id: PlaceId) => void;
  direction: (key: string, down: boolean) => void;
  focus: () => void;
}
interface Props {
  workers: Worker[];
  selected: number | null;
  paused: boolean;
  onNear: (id: PlaceId | null) => void;
  onInteract: (id: PlaceId) => void;
  onMove: () => void;
}
interface Actor {
  rig: DinoRig;
  position: Point;
  signature: string;
  route: Point[];
  destination: Point;
  routedAt: number;
}
const CreatureTown = forwardRef<TownControl, Props>(
  function CreatureTown(props, ref) {
    const host = useRef<HTMLDivElement>(null),
      callbacks = useRef(props),
      controller = useRef<TownControl>({
        goTo: () => undefined,
        direction: () => undefined,
        focus: () => undefined,
      });
    callbacks.current = props;
    const [failed, setFailed] = useState(false),
      [loaded, setLoaded] = useState(false);
    useImperativeHandle(
      ref,
      () => ({
        goTo: (id) => controller.current.goTo(id),
        direction: (key, down) => controller.current.direction(key, down),
        focus: () => controller.current.focus(),
      }),
      [],
    );
    useEffect(() => {
      const node = host.current;
      if (node === null) return;
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        });
      } catch {
        setFailed(true);
        return;
      }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.setClearColor("#cbd4b9");
      node.prepend(renderer.domElement);
      const scene = new THREE.Scene(),
        camera = new THREE.OrthographicCamera(-18, 18, 13, -13, 0.1, 100),
        town = makeTown(),
        keeper = makeKeeper(),
        actors = new Map<number, Actor>();
      scene.add(town, keeper.group);
      lightScene(scene);
      let player: Point = { ...townSpawn };
      try {
        const saved = JSON.parse(
          localStorage.getItem("saas-game-ui-town-position") ?? "null",
        ) as Point | null;
        if (saved !== null && isWalkable(saved)) player = saved;
      } catch {
        /* Fresh arrival. */
      }
      keeper.group.position.set(player.x, 0, player.z);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.45, 0.53, 40),
        new THREE.MeshBasicMaterial({
          color: "#fff1b9",
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(player.x, 0.055, player.z);
      scene.add(ring);
      const marker = new THREE.Mesh(
        new THREE.RingGeometry(0.23, 0.32, 24),
        new THREE.MeshBasicMaterial({
          color: "#ffffdf",
          side: THREE.DoubleSide,
        }),
      );
      marker.rotation.x = -Math.PI / 2;
      marker.visible = false;
      scene.add(marker);
      const ray = new THREE.Raycaster(),
        mouse = new THREE.Vector2(),
        plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
        hit = new THREE.Vector3(),
        keys = new Set<string>();
      let path: Point[] = [],
        last = performance.now(),
        frame = 0,
        lastNear: PlaceId | null = null,
        lastReport = 0,
        hasMoved = false,
        wasPaused = false,
        sceneInvalidated = true,
        lastSignature = "";
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const cameraCenter = new THREE.Vector3(0, 0, 0);
      let vertical = 26;
      const resize = (): void => {
        sceneInvalidated = true;
        const w = node.clientWidth,
          h = node.clientHeight;
        renderer.setSize(w, h);
        vertical = w < 700 ? 19 : 26;
        camera.left = (-vertical * (w / h)) / 2;
        camera.right = (vertical * (w / h)) / 2;
        camera.top = vertical / 2;
        camera.bottom = -vertical / 2;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(node);
      resize();
      const route = (point: Point): void => {
        path = findTownPath(player, point);
        if (path.length > 0) {
          marker.position.set(point.x, 0.08, point.z);
          marker.visible = true;
          node.dataset.destination = `${point.x},${point.z}`;
        }
      };
      controller.current = {
        goTo: (id) => {
          const p = places.find((p) => p.id === id);
          if (p !== undefined) route(p.door);
          node.focus({ preventScroll: true });
        },
        direction: (key, down) => {
          if (down) {
            keys.add(key);
            path = [];
            marker.visible = false;
          } else keys.delete(key);
        },
        focus: () => node.focus({ preventScroll: true }),
      };
      const down = (e: KeyboardEvent): void => {
        if (callbacks.current.paused || e.ctrlKey || e.metaKey || e.altKey)
          return;
        if (
          ["INPUT", "TEXTAREA", "SELECT"].includes(
            (e.target as HTMLElement).tagName,
          )
        )
          return;
        const key = e.key.toLowerCase();
        if (
          [
            "w",
            "a",
            "s",
            "d",
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
          ].includes(key)
        ) {
          e.preventDefault();
          keys.add(key);
          path = [];
          marker.visible = false;
        }
        if (key === "e" && !e.repeat) {
          const place = nearbyPlace(player);
          if (place !== undefined) {
            e.preventDefault();
            callbacks.current.onInteract(place.id);
          }
        }
      };
      const up = (e: KeyboardEvent): void => {
        keys.delete(e.key.toLowerCase());
      };
      const clear = (): void => {
        keys.clear();
      };
      const pointer = (e: PointerEvent): void => {
        if (callbacks.current.paused || e.target !== renderer.domElement)
          return;
        node.focus({ preventScroll: true });
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        ray.setFromCamera(mouse, camera);
        const intersections = ray.intersectObject(town, true);
        let object: THREE.Object3D | null = intersections[0]?.object ?? null;
        while (object !== null) {
          const id = object.userData.place as PlaceId | undefined;
          if (id !== undefined) {
            const place = places.find((p) => p.id === id);
            if (place !== undefined) route(place.door);
            return;
          }
          object = object.parent;
        }
        if (ray.ray.intersectPlane(plane, hit) !== null)
          route({ x: hit.x, z: hit.z });
      };
      node.addEventListener("pointerdown", pointer);
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
      window.addEventListener("blur", clear);
      document.addEventListener("visibilitychange", clear);
      const labels = Array.from(
        node.querySelectorAll<HTMLButtonElement>("[data-place]"),
      );
      const save = (): void => {
        try {
          localStorage.setItem(
            "saas-game-ui-town-position",
            JSON.stringify(player),
          );
        } catch {
          /* Session movement remains usable. */
        }
      };
      const tick = (now: number): void => {
        frame = requestAnimationFrame(tick);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const current = callbacks.current,
          paused = current.paused || document.hidden;
        const signature = `${current.selected}:${current.workers.map((w) => `${w.id}:${w.remaining}:${w.companion.xp}:${w.companion.equipped.join(",")}`).join("|")}`;
        if (
          paused &&
          wasPaused &&
          !sceneInvalidated &&
          signature === lastSignature
        )
          return;
        sceneInvalidated = false;
        lastSignature = signature;
        if (paused && !wasPaused) keys.clear();
        wasPaused = paused;
        let moving = false;
        if (!paused) {
          let dx =
              (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
              (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
            dz =
              (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
              (keys.has("w") || keys.has("arrowup") ? 1 : 0);
          if (dx === 0 && dz === 0 && path.length > 0) {
            const dest = path[0];
            if (distance(player, dest) < 0.15) {
              path.shift();
              if (path.length === 0) marker.visible = false;
            } else {
              dx = dest.x - player.x;
              dz = dest.z - player.z;
            }
          }
          const len = Math.hypot(dx, dz);
          if (len > 0) {
            const next = walkStep(player, {
              x: player.x + (dx / len) * dt * 4.7,
              z: player.z + (dz / len) * dt * 4.7,
            });
            moving = distance(next, player) > 0.001;
            player = next;
            if (moving) {
              keeper.group.rotation.y = Math.atan2(dx, dz);
              if (!hasMoved) {
                callbacks.current.onMove();
                hasMoved = true;
              }
            }
          }
        }
        keeper.group.position.set(
          player.x,
          moving && !reduced ? Math.sin(now * 0.012) * 0.035 : 0,
          player.z,
        );
        keeper.legs.forEach(
          (leg, i) =>
            (leg.rotation.x = moving
              ? Math.sin(now * 0.014) * 0.45 * (i === 0 ? 1 : -1)
              : 0),
        );
        keeper.arms.forEach(
          (arm, i) =>
            (arm.rotation.x = moving
              ? Math.sin(now * 0.014) * 0.3 * (i === 0 ? -1 : 1)
              : 0),
        );
        ring.position.set(player.x, 0.055, player.z);
        for (const w of current.workers) {
          const signature = [
            w.kind,
            w.companion.equipped.join(","),
            levelFor(w.companion.xp),
          ].join(":");
          let actor = actors.get(w.id);
          if (actor === undefined || actor.signature !== signature) {
            if (actor !== undefined) {
              scene.remove(actor.rig.group);
              disposeScene(actor.rig.group);
            }
            const rig = makeDino(
              w.kind,
              w.companion.equipped,
              levelFor(w.companion.xp),
            );
            rig.group.scale.setScalar(0.63);
            actor = {
              rig,
              position:
                actor?.position ??
                nearbyWalkable({
                  x: player.x - 1.3,
                  z: player.z + 1,
                }),
              signature,
              route: [],
              destination: { ...townSpawn },
              routedAt: 0,
            };
            actors.set(w.id, actor);
            scene.add(rig.group);
          }
          const i = current.workers.indexOf(w),
            mission = w.companion.assignment;
          const destination = nearbyWalkable(
            mission !== null && w.remaining > 0
              ? { x: 7 + i * 0.35, z: 7.5 }
              : w.remaining > 0
                ? (places.find(
                    (p) =>
                      p.id ===
                      (w.job === "deliver"
                        ? "missions"
                        : w.job === "index"
                          ? "camp"
                          : "gate"),
                  )?.door ?? townSpawn)
                : w.id === current.selected
                  ? { x: player.x - 1.3, z: player.z + 1.1 }
                  : { x: -2.8 + (i % 3) * 1.7, z: 4 + Math.floor(i / 3) * 1.6 },
          );
          if (
            !paused &&
            now - actor.routedAt > 500 &&
            (distance(actor.destination, destination) > 0.65 ||
              (actor.route.length === 0 &&
                distance(actor.position, destination) > 0.45))
          ) {
            actor.route = findTownPath(actor.position, destination);
            actor.destination = destination;
            actor.routedAt = now;
          }
          if (
            actor.route[0] !== undefined &&
            distance(actor.position, actor.route[0]) < 0.18
          )
            actor.route.shift();
          const target = actor.route[0] ?? actor.position;
          const d = distance(actor.position, target),
            walk = !paused && d > 0.22;
          if (walk) {
            const amount = Math.min(dt * 3.8, d);
            const delta = {
              x: (target.x - actor.position.x) / d,
              z: (target.z - actor.position.z) / d,
            };
            const next = walkStep(actor.position, {
              x: actor.position.x + delta.x * amount,
              z: actor.position.z + delta.z * amount,
            });
            actor.position = next;
            actor.rig.group.rotation.y = Math.atan2(delta.x, delta.z);
          }
          actor.rig.group.position.set(actor.position.x, 0, actor.position.z);
          animateDino(actor.rig, paused ? 0 : now / 1000, walk, reduced);
        }
        for (const [id, a] of actors)
          if (!current.workers.some((w) => w.id === id)) {
            scene.remove(a.rig.group);
            disposeScene(a.rig.group);
            actors.delete(id);
          }
        const near = nearbyPlace(player)?.id ?? null;
        if (near !== lastNear) {
          callbacks.current.onNear(near);
          lastNear = near;
        }
        node.dataset.near = near ?? "";
        const compact = node.clientWidth < 700,
          targetCenter = compact
            ? new THREE.Vector3(player.x, 0, player.z - 1)
            : new THREE.Vector3(player.x * 0.14, 0, player.z * 0.08 - 1);
        cameraCenter.lerp(targetCenter, reduced ? 1 : Math.min(dt * 4, 1));
        camera.position.copy(cameraCenter).add(new THREE.Vector3(0, 20, 22));
        camera.lookAt(cameraCenter);
        for (const label of labels) {
          const place = places.find((p) => p.id === label.dataset.place);
          if (place === undefined) continue;
          const projected = new THREE.Vector3(
            place.x,
            place.id === "missions" ? 3.5 : place.id === "camp" ? 3.6 : 4.7,
            place.z,
          ).project(camera);
          const x = (projected.x * 0.5 + 0.5) * node.clientWidth,
            y = (-projected.y * 0.5 + 0.5) * node.clientHeight;
          label.style.left = `${x}px`;
          label.style.top = `${y}px`;
          label.style.visibility =
            x < 40 ||
            x > node.clientWidth - 40 ||
            y < 85 ||
            y > node.clientHeight - 120
              ? "hidden"
              : "visible";
          label.dataset.near = String(near === place.id);
        }
        if (now - lastReport > 150) {
          node.dataset.x = player.x.toFixed(2);
          node.dataset.z = player.z.toFixed(2);
          node.dataset.walking = String(moving);
          node.dataset.companions = JSON.stringify(
            [...actors].map(([id, actor]) => ({ id, ...actor.position })),
          );
          lastReport = now;
        }
        renderer.render(scene, camera);
      };
      tick(performance.now());
      setLoaded(true);
      const saveInterval = window.setInterval(save, 2000);
      return () => {
        cancelAnimationFrame(frame);
        clearInterval(saveInterval);
        save();
        ro.disconnect();
        node.removeEventListener("pointerdown", pointer);
        window.removeEventListener("keydown", down);
        window.removeEventListener("keyup", up);
        window.removeEventListener("blur", clear);
        document.removeEventListener("visibilitychange", clear);
        disposeScene(scene);
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      };
    }, []);
    return (
      <div
        className="ct-world"
        ref={host}
        tabIndex={0}
        role="region"
        aria-label="Fernhaven town. Move with WASD or arrows, click to walk, E to interact."
        data-loaded={loaded}
      >
        {!loaded && !failed && (
          <div className="ct-loading">Opening the town gates…</div>
        )}
        {failed && (
          <div className="ct-loading">
            <b>This town needs WebGL.</b>
            <p>
              Enable graphics acceleration in your browser, then reload to
              explore.
            </p>
            <a href="/design/saas-game-ui">Back to the design system</a>
          </div>
        )}
        {places.map((p) => (
          <button
            key={p.id}
            className="ct-place-label"
            data-place={p.id}
            onClick={() => controller.current.goTo(p.id)}
            aria-label={`Walk to ${p.name}`}
          >
            <small>{p.label}</small>
            <span>{p.name}</span>
            <i>↗</i>
          </button>
        ))}
      </div>
    );
  },
);
export default CreatureTown;
