// Signature ambient decoration: blurred color blobs on the cream background.
// Purely decorative — pointer-events off, aria-hidden.
export function GradientBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg" aria-hidden="true">
      <div className="absolute -top-28 -left-24 h-[26rem] w-[26rem] rounded-full bg-blob-pink/60 blur-3xl" />
      <div className="absolute top-1/4 -right-32 h-[30rem] w-[30rem] rounded-full bg-blob-lavender/60 blur-3xl" />
      <div className="absolute -bottom-32 left-1/4 h-[24rem] w-[24rem] rounded-full bg-blob-orange/50 blur-3xl" />
    </div>
  );
}
