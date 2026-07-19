import { lazy, Suspense, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Lazy so three.js only loads client-side after hydration
const Scene = lazy(() => import("./guide-avatar-3d.scene"));

interface Props {
  className?: string;
  /** Height utility class, e.g. "h-48". Width fills container. */
  heightClassName?: string;
}

/**
 * RealDoor Guide — 3D read-only avatar.
 * - Renders GLB with @react-three/fiber + drei.
 * - Subtle idle sway/breathing; static under prefers-reduced-motion.
 * - Never animates approval, judgment, or emotional assessment.
 */
export function GuideAvatar3D({ className, heightClassName = "h-40" }: Props) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-md bg-gradient-to-b from-accent/40 to-paper",
        heightClassName,
        className,
      )}
      role="img"
      aria-label="RealDoor Guide avatar"
    >
      {hydrated ? (
        <Suspense fallback={<AvatarSkeleton />}>
          <Scene />
        </Suspense>
      ) : (
        <AvatarSkeleton />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-paper to-transparent" />
    </div>
  );
}

function AvatarSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
      <div className="h-16 w-16 animate-pulse rounded-full bg-accent/70" />
    </div>
  );
}
