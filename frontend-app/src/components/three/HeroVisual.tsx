import { Component, lazy, Suspense, type ReactNode } from "react";
import { usePrefersReducedMotion } from "../../lib/usePrefersReducedMotion";
import { useIsCoarsePointer } from "../../lib/useIsCoarsePointer";
import { BlobFallback } from "./BlobFallback";

// Lazy: three.js + @react-three/fiber + drei are a real chunk of bytes —
// never block the landing page's main thread/initial paint on them.
const BlobScene = lazy(() =>
  import("./BlobScene").then((m) => ({ default: m.BlobScene })),
);

class WebglErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <BlobFallback />;
    return this.props.children;
  }
}

export function HeroVisual() {
  const reducedMotion = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();

  // Reduced motion OR a touch/narrow ("likely mobile, likely weaker GPU")
  // device: never even fetch the ~235KB gzip three.js+r3f+drei bundle — the
  // static SVG is the intended experience here, not a degraded fallback.
  if (reducedMotion || coarse) {
    return <BlobFallback />;
  }

  return (
    <WebglErrorBoundary>
      <Suspense fallback={<BlobFallback />}>
        <BlobScene reducedMotion={false} cheap={false} />
      </Suspense>
    </WebglErrorBoundary>
  );
}
