// Ambient, fixed-position color blobs behind the app shell. Exists purely so
// the glassmorphism on headers/sidebars/cards (bg-white/NN + backdrop-blur)
// has something colorful underneath to actually blur — on a flat single-tone
// background, "glass" surfaces are visually indistinguishable from plain
// semi-transparent panels. No interactive content lives here (pointer-events
// disabled, aria-hidden).
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
