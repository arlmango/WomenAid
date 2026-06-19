// A module-level ref to the router's navigate function, so non-React code
// (lib/api.ts, which runs outside the React tree) can redirect on 401
// without React Router context.
import type { NavigateFunction } from "react-router-dom";

let navigateRef: NavigateFunction | null = null;

export function setNavigate(fn: NavigateFunction): void {
  navigateRef = fn;
}

export function navigateTo(path: string): void {
  if (navigateRef) navigateRef(path, { replace: true });
  else window.location.assign(path);
}
