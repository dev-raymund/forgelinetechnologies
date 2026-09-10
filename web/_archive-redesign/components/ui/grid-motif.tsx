/**
 * The blueprint hairline grid, extracted so it reads as one system across the
 * site rather than a one-off hero decoration. `fade` keeps it from running
 * hard into a section edge; `tone` switches it for light sections.
 */
export default function GridMotif({
  tone = "dark",
  size = 72,
  className = "",
  fade = true,
}: {
  tone?: "dark" | "light";
  size?: number;
  className?: string;
  fade?: boolean;
}) {
  const line = tone === "dark" ? "#fff" : "#0a1020";
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${
        tone === "dark" ? "opacity-[0.055]" : "opacity-[0.04]"
      } ${className}`}
      style={{
        backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        ...(fade
          ? {
              maskImage:
                "radial-gradient(ellipse 80% 70% at 50% 40%, #000 55%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 70% at 50% 40%, #000 55%, transparent 100%)",
            }
          : {}),
      }}
    />
  );
}
