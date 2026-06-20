import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../lib/authStore";

// Only "patient" has a cabinet in this app — clinician/admin tokens are
// valid (backend already authenticated them) but routed to the existing
// clinic dashboard in frontend/, not duplicated here (see README).
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.role);
  if (role !== "patient") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
