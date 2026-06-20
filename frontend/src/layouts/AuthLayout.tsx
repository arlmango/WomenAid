import { Outlet } from "react-router-dom";
import { LanguageToggle } from "../components/LanguageToggle";
import { GradientBackdrop } from "../components/GradientBackdrop";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <GradientBackdrop />

      <div className="relative mb-6 flex w-full max-w-sm items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-pink to-magenta font-serif text-lg text-white shadow-btn">
            W
          </span>
          <h1 className="font-serif text-2xl">
            <span className="text-indigo">Women</span>
            <span className="text-magenta">AId</span>
          </h1>
        </div>
        <LanguageToggle />
      </div>
      <div className="relative w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
