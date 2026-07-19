// Stylized 2D SVG guide — "RealDoor Guide". No WebGL. Subtle idle blink;
// static under prefers-reduced-motion (see styles.css). Never animates
// approval / judgment cues.

export function AvatarGuide({
  size = 48,
  active = false,
  className,
}: {
  size?: number;
  active?: boolean;
  className?: string;
}) {
  return (
    <svg
      role="img"
      aria-label="RealDoor Guide"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
    >
      {/* soft halo when active */}
      {active && (
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="none"
          stroke="var(--color-primary)"
          strokeOpacity="0.35"
          strokeWidth="1"
        >
          <animate attributeName="r" values="26;30;26" dur="4s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.15;0.35;0.15" dur="4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* head */}
      <circle cx="32" cy="26" r="14" fill="var(--color-accent)" stroke="var(--color-primary)" strokeWidth="1.25" />
      {/* shoulders */}
      <path
        d="M10 58 C 12 46, 22 42, 32 42 C 42 42, 52 46, 54 58 Z"
        fill="var(--color-primary)"
        opacity="0.85"
      />
      {/* collar */}
      <path
        d="M22 44 L 32 50 L 42 44"
        stroke="var(--color-paper)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* eyes (idle blink) */}
      <g fill="var(--color-ink)">
        <ellipse cx="26.5" cy="26" rx="1.4" ry="1.8">
          <animate
            attributeName="ry"
            values="1.8;1.8;0.2;1.8;1.8"
            keyTimes="0;0.45;0.5;0.55;1"
            dur="6s"
            repeatCount="indefinite"
          />
        </ellipse>
        <ellipse cx="37.5" cy="26" rx="1.4" ry="1.8">
          <animate
            attributeName="ry"
            values="1.8;1.8;0.2;1.8;1.8"
            keyTimes="0;0.45;0.5;0.55;1"
            dur="6s"
            repeatCount="indefinite"
          />
        </ellipse>
      </g>

      {/* neutral mouth — never a smile that could read as approval */}
      <path
        d="M27 32.5 Q 32 33.5 37 32.5"
        stroke="var(--color-ink)"
        strokeWidth="1.25"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* subtle doorway motif behind head */}
      <rect
        x="20"
        y="10"
        width="24"
        height="18"
        rx="2"
        fill="none"
        stroke="var(--color-primary)"
        strokeOpacity="0.25"
        strokeWidth="1"
      />
    </svg>
  );
}
