import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

export function useAnimeReveal<T extends HTMLElement>(routeKey: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const introTargets = root.querySelectorAll<HTMLElement>(
      "main > header, [data-anime='intro']",
    );
    const cardTargets = root.querySelectorAll<HTMLElement>("[data-anime='card']");
    const railTargets = root.querySelectorAll<HTMLElement>("[data-anime='rail-item']");
    const ambientTargets = root.querySelectorAll<HTMLElement>("[data-anime='ambient-orb']");

    const intro = animate(introTargets, {
      opacity: { from: 0 },
      y: { from: 16 },
      duration: 620,
      ease: "out(3)",
    });

    const cards = animate(cardTargets, {
      opacity: { from: 0 },
      y: { from: 18 },
      scale: { from: 0.985 },
      duration: 620,
      delay: stagger(38),
      ease: "out(3)",
    });

    const rail = animate(railTargets, {
      opacity: { from: 0 },
      x: { from: -10 },
      duration: 480,
      delay: stagger(52),
      ease: "out(3)",
    });

    const ambient = animate(ambientTargets, {
      x: stagger([18, -14], { from: "center" }),
      y: stagger([-12, 10], { from: "center" }),
      scale: stagger([1, 1.08], { from: "center" }),
      duration: 9000,
      delay: stagger(420),
      ease: "inOutSine",
      loop: true,
      alternate: true,
    });

    return () => {
      intro.revert();
      cards.revert();
      rail.revert();
      ambient.revert();
    };
  }, [routeKey]);

  return ref;
}
