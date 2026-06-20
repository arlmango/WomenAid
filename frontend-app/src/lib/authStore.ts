// Auth state via zustand. The JWT lives in sessionStorage ONLY — same rule
// the rest of the project follows (see frontend/patient-pwa history /
// frontend/src/lib/auth.ts): never localStorage, gone when the tab closes.
// We decode the token client-side for display/routing only; the backend is
// the actual authority on every request (no client-side signature check).
import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import type { JwtClaims, Role } from "./types";

const STORAGE_KEY = "womenaid_token";

interface AuthState {
  token: string | null;
  username: string | null;
  role: Role | null;
  patientId: number | null;
  setToken: (token: string) => void;
  logout: () => void;
}

function decode(token: string): JwtClaims | null {
  try {
    const claims = jwtDecode<JwtClaims>(token);
    if (claims.exp && Date.now() / 1000 > claims.exp) return null;
    return claims;
  } catch {
    return null;
  }
}

function fromStorage(): Pick<AuthState, "token" | "username" | "role" | "patientId"> {
  const token = sessionStorage.getItem(STORAGE_KEY);
  if (!token) return { token: null, username: null, role: null, patientId: null };
  const claims = decode(token);
  if (!claims) {
    sessionStorage.removeItem(STORAGE_KEY);
    return { token: null, username: null, role: null, patientId: null };
  }
  return { token, username: claims.sub, role: claims.role, patientId: claims.patient_id ?? null };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...fromStorage(),
  setToken: (token: string) => {
    sessionStorage.setItem(STORAGE_KEY, token);
    set(fromStorage());
  },
  logout: () => {
    sessionStorage.removeItem(STORAGE_KEY);
    set({ token: null, username: null, role: null, patientId: null });
  },
}));

export function homePathForRole(role: Role): string {
  return role === "patient" ? "/patient" : "/login";
}
