import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";

// Three depth layers (far -> near): far blurs/moves least, near is sharper
// and moves most — both with the pointer (parallax tilt) and with page
// scroll (parallax drift), so it reads as a real 3D composition rather
// than a single spinning object.
const LAYERS = [
  { color: "#9b6fe0", radius: 1.3, position: [-4.2, 1.4, -3] as const, mouseFactor: 0.15, scrollFactor: 0.08 },
  { color: "#c2399e", radius: 0.95, position: [4.3, -1.6, -1.4] as const, mouseFactor: 0.3, scrollFactor: 0.18 },
  { color: "#1b2a6b", radius: 0.6, position: [3.6, 2, 0] as const, mouseFactor: 0.5, scrollFactor: 0.3 },
];

function pointerToNormalized(e: PointerEvent): [number, number] {
  return [(e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1)];
}

function Layer({
  color,
  radius,
  position,
  mouseFactor,
  scrollFactor,
  pointer,
  scrollRef,
}: (typeof LAYERS)[number] & { pointer: { current: [number, number] }; scrollRef: { current: number } }) {
  const ref = useRef<Group>(null);

  useFrame((_, delta) => {
    const node = ref.current;
    if (!node) return;
    const targetX = position[0] + pointer.current[0] * mouseFactor;
    const targetY = position[1] + pointer.current[1] * mouseFactor - scrollRef.current * scrollFactor;
    node.position.x += (targetX - node.position.x) * Math.min(1, delta * 3);
    node.position.y += (targetY - node.position.y) * Math.min(1, delta * 3);
    node.rotation.x += delta * 0.06;
    node.rotation.y += delta * 0.09;
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <icosahedronGeometry args={[radius, 1]} />
        <meshStandardMaterial color={color} transparent opacity={0.4} roughness={0.25} metalness={0.1} />
      </mesh>
    </group>
  );
}

function Scene() {
  const pointer = useRef<[number, number]>([0, 0]);
  const scrollRef = useRef(0);

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      pointer.current = pointerToNormalized(e);
    }
    function onScroll() {
      scrollRef.current = window.scrollY / window.innerHeight;
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      {LAYERS.map((layer) => (
        <Layer key={layer.color} {...layer} pointer={pointer} scrollRef={scrollRef} />
      ))}
    </>
  );
}

// Lazy-loaded (see Landing.tsx) so three.js never ships in the bundle a
// patient/clinic session downloads — only the public marketing route pays
// for it.
export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      className="pointer-events-none"
    >
      <Scene />
    </Canvas>
  );
}
