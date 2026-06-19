import { Outlet } from "react-router-dom";
import { LanguageToggle } from "../components/LanguageToggle";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10">
      <div className="mb-6 flex w-full max-w-sm items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-rose to-blush font-serif text-lg text-white shadow-btn">
            W
          </span>
          <h1 className="font-serif text-2xl text-ink">WomenAId</h1>
        </div>
        <LanguageToggle />
      </div>
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
