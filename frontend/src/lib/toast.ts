// Minimal toast event bus: lib/api.ts (outside the React tree) and any
// component can call toast.error/success/info; <Toaster/> is the only
// subscriber and renders them. No external dependency — keeps full control
// over styling (rose palette) and bundle size.
export type ToastKind = "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  text: string;
}

type Listener = (toasts: ToastMessage[]) => void;

let toasts: ToastMessage[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener(toasts);
}

function push(kind: ToastKind, text: string): void {
  const message: ToastMessage = { id: nextId++, kind, text };
  toasts = [...toasts, message];
  emit();
  window.setTimeout(() => dismiss(message.id), 5000);
}

function dismiss(id: number): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => listeners.delete(listener);
}

export const toast = {
  success: (text: string) => push("success", text),
  error: (text: string) => push("error", text),
  info: (text: string) => push("info", text),
  dismiss,
  subscribe,
};
