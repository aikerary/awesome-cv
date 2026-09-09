"use client";

import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { avatarGender } from "@/lib/env";

const modelPath = `/models/avatar-${avatarGender}.glb`;

class AvatarErrorBoundary extends Component<{ children: React.ReactNode; gender: typeof avatarGender; onAvatarClick: () => void; superSaiyan: boolean }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <ProceduralAvatar gender={this.props.gender} superSaiyan={this.props.superSaiyan} onAvatarClick={this.props.onAvatarClick} /> : this.props.children;
  }
}

function ModelAvatar({ superSaiyan, onAvatarClick }: { superSaiyan: boolean; onAvatarClick: () => void }) {
  const group = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Object3D | null>(null);
  const gltf = useGLTF(modelPath);
  const { scene, scale, y } = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(cloned);
    const size = bounds.getSize(new THREE.Vector3());
    const fittedScale = size.y > 0 ? 3.8 / size.y : 1.65;
    return { scene: cloned, scale: fittedScale, y: -2.15 - bounds.min.y * fittedScale };
  }, [gltf.scene]);

  useEffect(() => {
    headRef.current = null;
    scene.traverse((node) => {
      if (!headRef.current && /head/i.test(node.name)) headRef.current = node;
    });
  }, [scene]);

  useEffect(() => {
    if (!superSaiyan) return;
    scene.traverse((node) => {
      if (!/hair/i.test(node.name) || !("material" in node)) return;
      const material = node.material as THREE.MeshStandardMaterial;
      if (material?.color) material.color.set("#FFD42A");
    });
  }, [scene, superSaiyan]);

  const pointerTarget = usePointerTarget();

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointerTarget.current.x * 0.32, 0.06);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -pointerTarget.current.y * 0.08, 0.06);
    if (headRef.current) {
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, pointerTarget.current.x * 0.18, 0.06);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -pointerTarget.current.y * 0.1, 0.06);
    }
  });

  return <primitive ref={group} object={scene} position={[0, y, 0]} scale={scale} onPointerDown={onAvatarClick} />;
}

type HairStrand = {
  position: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  length: number;
  tone: "base" | "shadow" | "highlight";
};

function SuperSaiyanHair({ gender }: { gender: typeof avatarGender }) {
  const isFemale = gender === "female";
  const crownScale = isFemale ? 1.04 : 1;
  const strands: HairStrand[] = [
    { position: [0, 0.94, -0.04], rotation: [0, 0, 0], radius: 0.3, length: 1.55, tone: "base" },
    { position: [-0.28, 0.8, 0], rotation: [0, 0, 0.34], radius: 0.28, length: 1.42, tone: "base" },
    { position: [0.28, 0.8, 0], rotation: [0, 0, -0.34], radius: 0.28, length: 1.42, tone: "base" },
    { position: [-0.5, 0.48, -0.02], rotation: [0, 0, 0.74], radius: 0.24, length: 1.26, tone: "base" },
    { position: [0.5, 0.48, -0.02], rotation: [0, 0, -0.74], radius: 0.24, length: 1.26, tone: "base" },
    { position: [-0.45, -0.05, -0.24], rotation: [0.1, 0.26, 2.36], radius: 0.2, length: 1.48, tone: "shadow" },
    { position: [0.45, -0.05, -0.24], rotation: [0.1, -0.26, -2.36], radius: 0.2, length: 1.48, tone: "shadow" },
    { position: [-0.18, -0.24, -0.31], rotation: [0.08, 0.12, 2.86], radius: 0.22, length: 1.66, tone: "shadow" },
    { position: [0.18, -0.24, -0.31], rotation: [0.08, -0.12, -2.86], radius: 0.22, length: 1.66, tone: "shadow" },
    { position: [-0.13, 1.05, 0.23], rotation: [0.04, 0.12, 0.08], radius: 0.075, length: 1.08, tone: "highlight" },
    { position: [0.13, 1.05, 0.23], rotation: [0.04, -0.12, -0.08], radius: 0.075, length: 1.08, tone: "highlight" },
    { position: [-0.43, 0.62, 0.2], rotation: [0, 0, 0.7], radius: 0.06, length: 0.82, tone: "highlight" },
    { position: [0.43, 0.62, 0.2], rotation: [0, 0, -0.7], radius: 0.06, length: 0.82, tone: "highlight" },
  ];
  const materials = {
    base: { color: "#F6B91B", emissive: "#8A4B00", emissiveIntensity: 0.16 },
    shadow: { color: "#B66B08", emissive: "#4A2100", emissiveIntensity: 0.08 },
    highlight: { color: "#FFE987", emissive: "#C98200", emissiveIntensity: 0.2 },
  } as const;

  return <group scale={[crownScale, crownScale, crownScale]}>
    <mesh castShadow position={[0, 0.34, -0.05]} scale={[1, 0.82, 0.94]}>
      <sphereGeometry args={[0.67, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.68]} />
      <meshStandardMaterial color="#D88A0C" roughness={0.4} metalness={0.06} />
    </mesh>
    {strands.map(({ position, rotation, radius, length, tone }, index) => {
      const material = materials[tone];
      return <mesh key={index} castShadow position={position} rotation={rotation}>
        <coneGeometry args={[radius, length, 6]} />
        <meshStandardMaterial {...material} roughness={tone === "highlight" ? 0.25 : 0.36} metalness={0.08} />
      </mesh>;
    })}
  </group>;
}

function ProceduralAvatar({ gender = avatarGender, superSaiyan, onAvatarClick }: { gender?: typeof avatarGender; superSaiyan: boolean; onAvatarClick: () => void }) {
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const isFemale = gender === "female";

  const pointerTarget = usePointerTarget();

  useFrame(() => {
    if (body.current) body.current.rotation.y = THREE.MathUtils.lerp(body.current.rotation.y, pointerTarget.current.x * 0.28, 0.05);
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, pointerTarget.current.x * 0.45, 0.07);
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -pointerTarget.current.y * 0.2, 0.07);
    }
  });

  return (
    <group ref={body} position={[0, -1.25, 0]} onPointerDown={onAvatarClick}>
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <coneGeometry args={[isFemale ? 0.82 : 0.72, 1.95, isFemale ? 8 : 6]} />
        <meshStandardMaterial color={isFemale ? "#FF5C8A" : "#5360FF"} roughness={0.55} />
      </mesh>
      <group ref={head} position={[0, 1.18, 0]}>
        <mesh castShadow>
          <icosahedronGeometry args={[isFemale ? 0.58 : 0.62, 2]} />
          <meshStandardMaterial color="#E9E7DD" roughness={0.38} />
        </mesh>
        {isFemale && !superSaiyan && <mesh castShadow position={[0, 0.26, -0.04]}>
          <sphereGeometry args={[0.66, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color="#171B34" roughness={0.7} />
        </mesh>}
        {superSaiyan && <SuperSaiyanHair gender={gender} />}
        <mesh position={[0.22, 0.05, 0.53]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#10120F" />
        </mesh>
        <mesh position={[-0.22, 0.05, 0.53]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#10120F" />
        </mesh>
      </group>
    </group>
  );
}

function Scene() {
  const [modelAvailable, setModelAvailable] = useState<boolean | null>(null);
  const [superSaiyan, setSuperSaiyan] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(modelPath, { method: "HEAD", signal: controller.signal })
      .then((response) => setModelAvailable(response.ok))
      .catch(() => setModelAvailable(false));
    return () => controller.abort();
  }, []);

  return (
    <>
      <color attach="background" args={["#10120F"]} />
      <ambientLight intensity={1.4} />
      <directionalLight castShadow intensity={3.2} position={[3, 5, 4]} shadow-mapSize={[1024, 1024]} />
      <pointLight color="#B8FF38" intensity={12} position={[-4, 1, 2]} />
       <Suspense fallback={<ProceduralAvatar gender={avatarGender} superSaiyan={superSaiyan} onAvatarClick={() => setSuperSaiyan(true)} />}>
         {modelAvailable ? <AvatarErrorBoundary gender={avatarGender} superSaiyan={superSaiyan} onAvatarClick={() => setSuperSaiyan(true)}><ModelAvatar superSaiyan={superSaiyan} onAvatarClick={() => setSuperSaiyan(true)} /></AvatarErrorBoundary> : <ProceduralAvatar gender={avatarGender} superSaiyan={superSaiyan} onAvatarClick={() => setSuperSaiyan(true)} />}
      </Suspense>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.25, 0]}>
        <planeGeometry args={[200, 200]} />
        <shadowMaterial opacity={0.25} />
      </mesh>
    </>
  );
}

function usePointerTarget() {
  const target = useRef(new THREE.Vector2());

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      target.current.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    };
    const resetPointer = () => target.current.set(0, 0);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", resetPointer);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", resetPointer);
    };
  }, []);

  return target;
}

export function AvatarScene() {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 0.2, 6], fov: 36 }} gl={{ antialias: true, alpha: true }}>
      <Scene />
    </Canvas>
  );
}
