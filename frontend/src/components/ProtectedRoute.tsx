import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, homePathForRole } from "../lib/auth";
import type { Role } from "../types/api";

// Unauthenticated -> /auth. Wrong role (e.g. a patient hitting /clinic/*) is
// sent to their own home rather than a blank/403 page.
export function ProtectedRoute({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { session } = useAuth();

  if (!session) return <Navigate to="/auth" replace />;
  if (!allow.includes(session.role)) return <Navigate to={homePathForRole(session.role)} replace />;

  return <>{children}</>;
}
