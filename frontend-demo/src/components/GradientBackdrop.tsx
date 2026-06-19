// Ambient color blobs behind the app so the glassmorphism surfaces have
// something to blur. Purely decorative (pointer-events off, aria-hidden).
export function GradientBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg" aria-hidden="true">
      <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-rose-pale/60 blur-3xl" />
      <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-lavender-bg blur-3xl" />
      <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-mint-bg/80 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-peach-bg/70 blur-3xl" />
    </div>
  );
}
