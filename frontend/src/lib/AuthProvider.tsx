import { useMemo, useState, type ReactNode } from "react";
import { AuthContext, clearSession, loadSession, storeToken, type Session } from "./auth";
import { setConsentFlag } from "./consentFlag";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());

  const value = useMemo(
    () => ({
      session,
      login: (token: string) => {
        const next = storeToken(token);
        setSession(next);
        return next;
      },
      logout: () => {
        clearSession();
        setConsentFlag(false);
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
