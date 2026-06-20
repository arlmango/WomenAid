// Central fetch wrapper — every real backend call goes through this, so 401
// handling and error toasts live in one place.
import { useAuthStore } from "./authStore";
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
  silent?: boolean; // suppress the automatic error toast
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
      return data.detail.map((d: { msg: string }) => d.msg).join(" ");
    }
  } catch {
    // not JSON
  }
  return `Ошибка сервера (${res.status})`;
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
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
    useAuthStore.getState().logout();
    navigateTo("/login");
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
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }
  return apiFetch<T>(path, { ...options, method: "POST", headers, body: payload });
}

// POST /auth/login expects form-urlencoded (OAuth2PasswordRequestForm).
export function login(username: string, password: string) {
  const body = new URLSearchParams({ username, password });
  return apiFetch<{ access_token: string }>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    silent: true, // the login screen shows its own inline + shake error
  });
}

export function register(payload: import("./types").RegisterPayload) {
  return apiPost<{ access_token: string }>("/api/auth/register", payload, { silent: true });
}
