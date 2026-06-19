// Backend has no "GET my consent status" endpoint (see app/routers/monitoring.py
// — only POST consent / POST consent/withdraw exist), so the SPA tracks
// whether consent was given *this session* locally and re-derives truth from
// the server's own 403 on upload if it's ever wrong (e.g. withdrawn
// elsewhere). sessionStorage, not localStorage — same lifetime as the token.
const KEY = "womenaid_consent_given";

export function getConsentFlag(): boolean {
  return sessionStorage.getItem(KEY) === "1";
}

export function setConsentFlag(value: boolean): void {
  if (value) sessionStorage.setItem(KEY, "1");
  else sessionStorage.removeItem(KEY);
}
