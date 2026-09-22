import { useEffect, useRef, useState, type RefObject } from "react";
import { clamp, findPath, walkable, type Point } from "./field";
interface WalkerOptions {
  initial: Point;
  field: RefObject<HTMLDivElement | null>;
  blocks: Point[];
  reduced: boolean;
  keyboard?: RefObject<Set<string>>;
  paused?: boolean;
}
export interface Walker {
  position: Point;
  walking: boolean;
  facing: number;
  go: (target: Point, onArrival?: () => void) => void;
  stop: () => void;
  reset: (p: Point) => void;
}
export function useWalker({
  initial,
  field,
  blocks,
  reduced,
  keyboard,
  paused = false,
}: WalkerOptions): Walker {
  const [position, setPosition] = useState(initial),
    [walking, setWalking] = useState(false),
    [facing, setFacing] = useState(1);
  const current = useRef(initial),
    path = useRef<Point[]>([]),
    arrival = useRef<(() => void) | null>(null);
  const latest = useRef({ blocks, reduced, paused });
  latest.current = { blocks, reduced, paused };
  const stop = (): void => {
    path.current = [];
    arrival.current = null;
    setWalking(false);
  };
  const reset = (p: Point): void => {
    stop();
    current.current = p;
    setPosition(p);
  };
  const go = (target: Point, onArrival?: () => void): void => {
    const route = findPath(current.current, target, latest.current.blocks);
    arrival.current = onArrival ?? null;
    if (latest.current.reduced) {
      const p = route.at(-1);
      if (p) {
        current.current = p;
        setPosition(p);
      }
      path.current = [];
      setWalking(false);
      const done = arrival.current;
      arrival.current = null;
      done?.();
      return;
    }
    path.current = route;
    if (route.length === 0) {
      const done = arrival.current;
      arrival.current = null;
      done?.();
    }
  };
  useEffect(() => {
    let frame = 0,
      last = 0;
    const tick = (now: number): void => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      const rect = field.current?.getBoundingClientRect();
      if (!rect || latest.current.paused) {
        setWalking(false);
        frame = requestAnimationFrame(tick);
        return;
      }
      const held = keyboard?.current;
      const dx =
        Number(held?.has("d") === true || held?.has("arrowright") === true) -
        Number(held?.has("a") === true || held?.has("arrowleft") === true);
      const dy =
        Number(held?.has("s") === true || held?.has("arrowdown") === true) -
        Number(held?.has("w") === true || held?.has("arrowup") === true);
      const p = current.current;
      let next = p,
        moving = false;
      if (dx !== 0 || dy !== 0) {
        path.current = [];
        arrival.current = null;
        const length = Math.hypot(dx, dy),
          speed = 220;
        const x = clamp(
            p.x + (((dx / length) * speed * dt) / rect.width) * 100,
            8,
            92,
          ),
          y = clamp(
            p.y + (((dy / length) * speed * dt) / rect.height) * 100,
            25,
            88,
          );
        if (walkable({ x, y }, latest.current.blocks)) next = { x, y };
        else if (walkable({ x, y: p.y }, latest.current.blocks))
          next = { x, y: p.y };
        else if (walkable({ x: p.x, y }, latest.current.blocks))
          next = { x: p.x, y };
        moving = next !== p;
      } else if (path.current.length > 0) {
        const target = path.current[0],
          vx = ((target.x - p.x) * rect.width) / 100,
          vy = ((target.y - p.y) * rect.height) / 100,
          d = Math.hypot(vx, vy),
          travel = 225 * dt;
        if (d <= travel) {
          next = target;
          path.current.shift();
        } else
          next = {
            x: p.x + ((target.x - p.x) * travel) / d,
            y: p.y + ((target.y - p.y) * travel) / d,
          };
        moving = true;
      }
      if (next.x !== p.x) setFacing(next.x < p.x ? -1 : 1);
      if (next !== p) {
        current.current = next;
        setPosition(next);
      }
      setWalking(moving);
      if (
        path.current.length === 0 &&
        arrival.current &&
        dx === 0 &&
        dy === 0
      ) {
        const done = arrival.current;
        arrival.current = null;
        done();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [field, keyboard]);
  return { position, walking, facing, go, stop, reset };
}
