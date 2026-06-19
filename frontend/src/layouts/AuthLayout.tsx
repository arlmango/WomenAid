import { Outlet } from "react-router-dom";
import { LanguageToggle } from "../components/LanguageToggle";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-4 py-10">
      {/* Soft decorative gradient blobs — purely visual, no content. */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-rose-pale/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-lavender-bg blur-3xl" />

      <div className="relative mb-6 flex w-full max-w-sm items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-rose to-blush font-serif text-lg text-white shadow-btn">
            W
          </span>
          <h1 className="font-serif text-2xl text-ink">WomenAId</h1>
        </div>
        <LanguageToggle />
      </div>
      <div className="relative w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
