// Signature "mesh grain" backdrop: large blurred aurora blobs (pink /
// purple / peach) on the warm cream canvas, under a subtle noise overlay
// (`.grain`). Purely decorative (pointer-events off, aria-hidden), never
// interferes with text contrast since cards sit on solid --color-surface.
export function GradientBackdrop() {
  return (
    <div className="grain pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg" aria-hidden="true">
      <div className="absolute -top-28 -left-24 h-[26rem] w-[26rem] rounded-full bg-blob-pink/40 blur-3xl" />
      <div className="absolute top-1/4 -right-32 h-[30rem] w-[30rem] rounded-full bg-blob-lavender/40 blur-3xl" />
      <div className="absolute -bottom-32 left-1/4 h-[24rem] w-[24rem] rounded-full bg-blob-peach/50 blur-3xl" />
      <div className="absolute top-2/3 right-1/4 h-[18rem] w-[18rem] rounded-full bg-blob-orange/30 blur-3xl" />
    </div>
  );
}
