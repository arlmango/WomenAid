// Ambient backdrop for "Clinical Calm": a near-white surface with a very
// soft, low-saturation teal/mint wash in the corners — reads as gentle
// lighting, not decoration. Purely visual (pointer-events off, aria-hidden).
export function GradientBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg" aria-hidden="true">
      <div className="absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-teal-bg/70 blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-[34rem] w-[34rem] rounded-full bg-indigo-bg/50 blur-3xl" />
      <div className="absolute -bottom-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-teal-bg/50 blur-3xl" />
    </div>
  );
}
