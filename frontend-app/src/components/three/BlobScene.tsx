import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

// Abstract floating blob — deliberately NOT a medical icon (no cross, no
// cell, no organ). A soft deformed sphere whose color drifts through the
// brand gradient (pink -> violet -> indigo), auto-rotating slowly with a
// gentle mouse-parallax tilt (not drag). No postprocessing/bloom — keeps
// this cheap enough for the Lighthouse mobile budget.
const COLOR_STOPS = [
  new THREE.Color("#f2628f"), // pink
  new THREE.Color("#9b6fe0"), // violet
  new THREE.Color("#4a4fe8"), // indigo
  new THREE.Color("#c2399e"), // magenta
];

function Blob({ autoRotate, distortSpeed }: { autoRotate: boolean; distortSpeed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const { size } = useThree();

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (autoRotate) {
      mesh.rotation.y += delta * 0.18;
      mesh.rotation.x += delta * 0.06;
    }

    // Mouse parallax: gently lerp toward the pointer-driven target tilt —
    // a tilt, not a drag-to-rotate interaction.
    const targetX = pointer.current.y * 0.25;
    const targetY = pointer.current.x * 0.35;
    mesh.rotation.x += (targetX - mesh.rotation.x) * 0.04;
    mesh.rotation.y += (targetY - mesh.rotation.y) * 0.04 * (autoRotate ? 0 : 1);

    // Color drift through the brand gradient.
    const t = (Math.sin(state.clock.elapsedTime * 0.15) + 1) / 2;
    const stops = COLOR_STOPS.length - 1;
    const scaled = t * stops;
    const i = Math.floor(scaled);
    const localT = scaled - i;
    const color = COLOR_STOPS[i].clone().lerp(COLOR_STOPS[Math.min(i + 1, stops)], localT);
    const material = mesh.material as THREE.Material & { color: THREE.Color };
    if (material) material.color = color;

    pointer.current.x += (state.pointer.x - pointer.current.x) * 0.08;
    pointer.current.y += (state.pointer.y - pointer.current.y) * 0.08;
  });

  const scale = useMemo(() => Math.min(2.2, 1.6 + size.width / 1600), [size.width]);

  return (
    <mesh ref={meshRef} scale={scale}>
      <icosahedronGeometry args={[1, 12]} />
      <MeshDistortMaterial
        distort={0.45}
        speed={distortSpeed}
        roughness={0.15}
        metalness={0.25}
        color="#f2628f"
      />
    </mesh>
  );
}

export function BlobScene({
  reducedMotion,
  cheap,
}: {
  reducedMotion: boolean;
  cheap: boolean;
}) {
  return (
    <Canvas
      dpr={cheap ? 1 : [1, 1.5]}
      gl={{ antialias: !cheap, alpha: true }}
      camera={{ position: [0, 0, 4.2], fov: 42 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <directionalLight position={[-4, -2, -3]} intensity={0.5} color="#9b6fe0" />
      <Blob autoRotate={!reducedMotion} distortSpeed={reducedMotion ? 0.4 : cheap ? 1 : 1.8} />
    </Canvas>
  );
}
