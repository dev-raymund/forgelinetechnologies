/**
 * Wave divider between sections.
 *
 * Three stacked curves at different opacities give the edge some depth
 * rather than a single flat silhouette. `fill` must match the colour of the
 * section the wave is flowing *into*, so pass the next section's background.
 */
export default function Wave({
  fill = "#ffffff",
  flip = false,
  height,
}: {
  fill?: string;
  flip?: boolean;
  height?: number;
}) {
  return (
    <div className={flip ? "ec-wave is-flip" : "ec-wave"} aria-hidden="true">
      <svg
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={height ? { height } : undefined}
      >
        <path
          fill={fill}
          opacity="0.3"
          d="M0,58 C210,104 400,18 630,42 C860,66 1050,102 1240,78 C1320,68 1390,52 1440,44 L1440,110 L0,110 Z"
        />
        <path
          fill={fill}
          opacity="0.55"
          d="M0,72 C190,34 420,96 660,74 C900,52 1090,10 1290,32 C1355,39 1405,52 1440,60 L1440,110 L0,110 Z"
        />
        <path
          fill={fill}
          d="M0,86 C240,60 430,100 700,92 C970,84 1160,44 1440,74 L1440,110 L0,110 Z"
        />
      </svg>
    </div>
  );
}
