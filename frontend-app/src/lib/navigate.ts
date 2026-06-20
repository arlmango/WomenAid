// Lets lib/api.ts (outside the React tree) redirect on 401 without needing
// React Router context. Set once from App.tsx via useNavigate().
import type { NavigateFunction } from "react-router-dom";

let navigateRef: NavigateFunction | null = null;

export function setNavigate(fn: NavigateFunction): void {
  navigateRef = fn;
}

export function navigateTo(path: string): void {
  if (navigateRef) navigateRef(path, { replace: true });
  else window.location.assign(path);
}
