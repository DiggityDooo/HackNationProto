import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Bounds } from "@react-three/drei";
import type { Group } from "three";
import guideAsset from "@/assets/realdoor-guide.glb.asset.json";

// Preload once
useGLTF.preload(guideAsset.url);

function GuideModel({ reduced }: { reduced: boolean }) {
  const ref = useRef<Group>(null);
  const { scene } = useGLTF(guideAsset.url);

  useFrame((_, delta) => {
    if (reduced || !ref.current) return;
    // Subtle idle: slow yaw sway + tiny vertical breathing
    const t = performance.now() / 1000;
    ref.current.rotation.y = Math.sin(t * 0.35) * 0.18;
    ref.current.position.y = Math.sin(t * 1.1) * 0.02;
    // Keep it gentle
    void delta;
  });

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export default function GuideAvatar3DScene() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.2, 2.4], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
      aria-hidden
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[2.5, 3, 2]} intensity={0.9} />
      <directionalLight position={[-2, 1, -1.5]} intensity={0.35} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.15}>
          <GuideModel reduced={reduced} />
        </Bounds>
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}
