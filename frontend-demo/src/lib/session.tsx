import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { mockApi } from "./mockApi";
import type { Role } from "./types";

// Mock auth — just an app-level role, no JWT. "Log in" flips state.
interface SessionValue {
  role: Role | null;
  login: (role: Role) => Promise<void>;
  logout: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);
const STORAGE_KEY = "womenaid_demo_role";

function readStoredRole(): Role | null {
  const v = sessionStorage.getItem(STORAGE_KEY);
  return v === "patient" || v === "clinician" ? v : null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  // Persisted in sessionStorage so a page refresh during a demo keeps you in
  // the cabinet instead of bouncing to the login screen.
  const [role, setRole] = useState<Role | null>(readStoredRole);

  const value = useMemo<SessionValue>(
    () => ({
      role,
      login: async (r) => {
        await mockApi.login(r);
        sessionStorage.setItem(STORAGE_KEY, r);
        setRole(r);
      },
      logout: () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setRole(null);
      },
    }),
    [role],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within <SessionProvider>");
  return ctx;
}
