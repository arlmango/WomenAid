// Central fetch wrapper. Every API call in the app goes through apiFetch, so
// the "global fetch error handler" requirement is satisfied in one place:
// failures always raise a toast, and a 401 always clears the session and
// redirects to /auth — callers never need to repeat that boilerplate.
import { clearSession, loadSession } from "./auth";
import { navigateTo } from "./navigate";
import { toast } from "./toast";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  // Suppress the automatic error toast (e.g. when the caller wants to show
  // a more specific UI, like re-opening the consent sheet on 403).
  silent?: boolean;
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {
    // not JSON — fall through to a generic message
  }
  return `Ошибка сервера (${res.status})`;
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = loadSession();
  const headers = new Headers(options.headers);
  if (session && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  let res: Response;
  try {
    res = await fetch(path, { ...options, headers });
  } catch {
    const message = "Не удалось подключиться к серверу.";
    if (!options.silent) toast.error(message);
    throw new ApiError(0, message);
  }

  if (res.status === 401) {
    clearSession();
    navigateTo("/auth");
    const message = "Сессия истекла. Войдите снова.";
    if (!options.silent) toast.error(message);
    throw new ApiError(401, message);
  }

  if (!res.ok) {
    const message = await extractErrorMessage(res);
    if (!options.silent) toast.error(message);
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  const headers = new Headers(options?.headers);
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }
  return apiFetch<T>(path, { ...options, method: "POST", headers, body: payload });
}

export function apiDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "DELETE" });
}

// POST /auth/login expects form-urlencoded (OAuth2PasswordRequestForm), not JSON.
export async function login(username: string, password: string): Promise<{ access_token: string }> {
  const body = new URLSearchParams({ username, password });
  return apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    silent: true, // LoginPage shows its own inline error, not a toast
  });
}

export interface ConsentTextResponse {
  version: string;
  text: string;
}

// Public — the canonical consent text the registration form must show
// (see backend/app/consent.py) so what's displayed matches exactly what
// /auth/register records as the consent snapshot.
export function getConsentText(): Promise<ConsentTextResponse> {
  return apiGet("/api/auth/consent-text", { silent: true });
}

export interface RegisterPayload {
  display_name: string;
  birth_date: string; // ISO date (YYYY-MM-DD)
  phone?: string;
  region?: string;
  username: string;
  password: string;
  consent: boolean;
}

// POST /auth/register is JSON (see backend/app/schemas/auth.py::RegisterRequest).
// consent must be true or the backend rejects with 400 and creates nothing —
// not a softer "registered but unconsented" state (CLAUDE.md). Returns a
// token, same as login (auto-login after signup).
export function register(payload: RegisterPayload): Promise<{ access_token: string }> {
  return apiPost("/api/auth/register", payload, { silent: true });
}

// Fetches a PDF with the bearer token attached and returns a blob: URL the
// caller can window.open() — a plain <a href> can't carry Authorization.
export async function fetchPdfObjectUrl(path: string): Promise<string> {
  const session = loadSession();
  const headers = new Headers();
  if (session) headers.set("Authorization", `Bearer ${session.token}`);
  const res = await fetch(path, { headers });
  if (!res.ok) {
    const message = await extractErrorMessage(res);
    toast.error(message);
    throw new ApiError(res.status, message);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
