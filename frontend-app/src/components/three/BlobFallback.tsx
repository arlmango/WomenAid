// Static SVG version of the same blob — used when prefers-reduced-motion is
// set, before the 3D scene has loaded, or if WebGL isn't available. Never an
// empty screen. The slow pulse animation is automatically neutralized by the
// global prefers-reduced-motion rule in index.css.
export function BlobFallback() {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full animate-[blob-pulse_8s_ease-in-out_infinite]">
      <defs>
        <linearGradient id="blob-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f2628f" />
          <stop offset="45%" stopColor="#9b6fe0" />
          <stop offset="100%" stopColor="#4a4fe8" />
        </linearGradient>
      </defs>
      <path
        fill="url(#blob-gradient)"
        d="M199.8,33.6c44.5-1.2,90.3,17.6,116.4,53.6c26.4,36.4,32.4,86.1,18.2,129.1c-13.9,42.2-46.4,77.4-87.3,93.8
        c-41.6,16.7-91.4,14-129.6-9.3c-38.6-23.6-64.6-66-69.1-110.9c-4.5-44.7,12.9-91.6,47.6-120.6C130.4,42.7,164.2,34.6,199.8,33.6z"
      />
      <style>{`
        @keyframes blob-pulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.04) rotate(4deg); }
        }
      `}</style>
    </svg>
  );
}
