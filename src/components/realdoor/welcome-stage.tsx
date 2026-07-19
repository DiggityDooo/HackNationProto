import { motion, useReducedMotion } from "framer-motion";
import { FileText } from "lucide-react";

// Layered offset paper cards animated in on mount, drifting under
// reduced-motion-safe CSS keyframes (see styles.css). Static under
// prefers-reduced-motion.
export function WelcomeStage() {
  const reduce = useReducedMotion();
  const base = { opacity: 0, y: 24, rotate: 0 };

  return (
    <div
      className="relative mx-auto grid aspect-[4/3] w-full max-w-md place-items-center"
      aria-hidden="true"
    >
      {/* back sheet */}
      <motion.div
        initial={reduce ? { opacity: 1 } : { ...base, rotate: -6 }}
        animate={{ opacity: 1, y: 0, rotate: reduce ? -3.5 : -3.5 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-8 inset-y-6 paper-card-raised paper-drift-1"
        style={{ background: "var(--color-paper)" }}
      >
        <div className="p-4">
          <div className="h-2 w-24 rounded-full bg-muted" />
          <div className="mt-3 space-y-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-1.5 rounded-full bg-muted" style={{ width: `${75 - i * 6}%` }} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* middle sheet */}
      <motion.div
        initial={reduce ? { opacity: 1 } : { ...base, rotate: 3 }}
        animate={{ opacity: 1, y: 0, rotate: reduce ? 1.5 : 1.5 }}
        transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-4 inset-y-4 paper-card-raised paper-drift-2"
      >
        <div className="p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" aria-hidden />
            <div className="h-2 w-28 rounded-full bg-primary/25" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border p-2">
                <div className="h-1 w-10 rounded-full bg-muted" />
                <div className="mt-1.5 h-1.5 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* front sheet */}
      <motion.div
        initial={reduce ? { opacity: 1 } : { ...base, rotate: 8 }}
        animate={{ opacity: 1, y: 0, rotate: reduce ? 4 : 4 }}
        transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-2 inset-y-2 paper-card-raised paper-drift-3"
      >
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="h-2 w-24 rounded-full bg-primary/40" />
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
              SYNTHETIC
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-2.5 w-3/4 rounded-full bg-foreground/80" />
            <div className="h-1.5 w-full rounded-full bg-muted" />
            <div className="h-1.5 w-11/12 rounded-full bg-muted" />
            <div className="h-1.5 w-9/12 rounded-full bg-muted" />
          </div>
          <div className="mt-5 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/20" />
            <div className="h-1.5 w-24 rounded-full bg-muted" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
