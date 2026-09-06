/**
 * Generic octilinear transit schematic in Singapore MRT line colours
 * (red, green, purple, orange, blue, brown). Lines are straight segments
 * with 45°/90° bends; every station node sits exactly on a line.
 * Trains move along lines via SVG animateMotion.
 */

const PATHS = {
  red: "M-20,90 H280 L440,250 H820",
  green: "M-20,230 H160 L350,40 H820",
  purple: "M100,-20 V140 H540 V340",
  orange: "M-20,180 H420 L510,270 H820",
  blue: "M820,60 H720 L600,180 V300",
  brown: "M-20,300 H240 L340,200 H500 L600,300 H820",
};

const LINES = [
  { id: "red", color: "#D42E12", d: PATHS.red },
  { id: "green", color: "#009645", d: PATHS.green },
  { id: "purple", color: "#9900AA", d: PATHS.purple },
  { id: "orange", color: "#FA9E0D", d: PATHS.orange },
  { id: "blue", color: "#005EC4", d: PATHS.blue },
  { id: "brown", color: "#9D5B25", d: PATHS.brown },
];

const INTERCHANGES = [
  { x: 100, y: 90 }, // red × purple
  { x: 210, y: 180 }, // green × orange
  { x: 390, y: 200 }, // red × brown
  { x: 440, y: 200 }, // orange × brown
  { x: 540, y: 240 }, // purple × brown
  { x: 540, y: 270 }, // purple × orange
  { x: 600, y: 270 }, // blue × orange
  { x: 600, y: 300 }, // blue × brown
];

const STATIONS = [
  { x: 40, y: 90 }, // red
  { x: 220, y: 90 },
  { x: 360, y: 170 },
  { x: 520, y: 250 },
  { x: 640, y: 250 },
  { x: 60, y: 230 }, // green
  { x: 255, y: 135 },
  { x: 450, y: 40 },
  { x: 620, y: 40 },
  { x: 760, y: 40 },
  { x: 100, y: 40 }, // purple
  { x: 240, y: 140 },
  { x: 400, y: 140 },
  { x: 60, y: 180 }, // orange
  { x: 320, y: 180 },
  { x: 465, y: 225 },
  { x: 700, y: 270 },
  { x: 770, y: 60 }, // blue
  { x: 660, y: 120 },
  { x: 600, y: 230 },
  { x: 80, y: 300 }, // brown
  { x: 170, y: 300 },
  { x: 290, y: 250 },
  { x: 700, y: 300 },
];

export default function TransitMap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 320" className={className} role="img" aria-label="Schematic transit network map">
      <defs>
        <path id="tm-red" d={PATHS.red} />
        <path id="tm-green" d={PATHS.green} />
        <path id="tm-purple" d={PATHS.purple} />
        <path id="tm-brown" d={PATHS.brown} />
      </defs>

      {LINES.map((l) => (
        <path
          key={l.id}
          d={l.d}
          fill="none"
          stroke={l.color}
          strokeWidth="4.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      ))}

      {STATIONS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r="5" fill="#FAFAF7" stroke="#111111" strokeWidth="2" />
      ))}

      {INTERCHANGES.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r="9" fill="#FAFAF7" stroke="#111111" strokeWidth="2.5" />
          <circle cx={s.x} cy={s.y} r="3" fill="#111111" />
        </g>
      ))}

      {/* moving trains */}
      <g>
        <rect x="-14" y="-5" width="28" height="10" rx="5" fill="#111111" />
        <animateMotion dur="14s" repeatCount="indefinite" rotate="auto">
          <mpath href="#tm-red" />
        </animateMotion>
      </g>
      <g>
        <rect x="-12" y="-4.5" width="24" height="9" rx="4.5" fill="#111111" opacity="0.85" />
        <animateMotion dur="18s" begin="-7s" repeatCount="indefinite" rotate="auto">
          <mpath href="#tm-green" />
        </animateMotion>
      </g>
      <g>
        <rect x="-10" y="-4" width="20" height="8" rx="4" fill="#111111" opacity="0.7" />
        <animateMotion dur="11s" begin="-3s" repeatCount="indefinite" rotate="auto">
          <mpath href="#tm-purple" />
        </animateMotion>
      </g>
      <g>
        <rect x="-10" y="-4" width="20" height="8" rx="4" fill="#111111" opacity="0.55" />
        <animateMotion dur="22s" begin="-12s" repeatCount="indefinite" rotate="auto">
          <mpath href="#tm-brown" />
        </animateMotion>
      </g>
    </svg>
  );
}
