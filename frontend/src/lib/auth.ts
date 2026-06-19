// Session helpers. The JWT lives in sessionStorage only (never localStorage,
// never written to disk by the service worker) — same intentional choice as
// the old vanilla frontend: it disappears when the tab/app closes.
import { createContext, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import type { JwtClaims, Role } from "../types/api";

const STORAGE_KEY = "womenaid_token";

export interface Session {
  token: string;
  username: string;
  role: Role;
  patientId: number | null;
}

function decode(token: string): JwtClaims | null {
  try {
    const claims = jwtDecode<JwtClaims>(token);
    if (claims.exp && Date.now() / 1000 > claims.exp) return null; // expired
    return claims;
  } catch {
    return null;
  }
}

export function loadSession(): Session | null {
  const token = sessionStorage.getItem(STORAGE_KEY);
  if (!token) return null;
  const claims = decode(token);
  if (!claims) {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
  return { token, username: claims.sub, role: claims.role, patientId: claims.patient_id ?? null };
}

export function storeToken(token: string): Session | null {
  sessionStorage.setItem(STORAGE_KEY, token);
  return loadSession();
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function homePathForRole(role: Role): string {
  return role === "patient" ? "/patient" : "/clinic";
}

export interface AuthContextValue {
  session: Session | null;
  login: (token: string) => Session | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
