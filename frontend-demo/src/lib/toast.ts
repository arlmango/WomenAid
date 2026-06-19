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

function emit() {
  for (const l of listeners) l(toasts);
}

function push(kind: ToastKind, text: string) {
  const msg: ToastMessage = { id: nextId++, kind, text };
  toasts = [...toasts, msg];
  emit();
  window.setTimeout(() => dismiss(msg.id), 4500);
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (t: string) => push("success", t),
  error: (t: string) => push("error", t),
  info: (t: string) => push("info", t),
  dismiss,
  subscribe(l: Listener) {
    listeners.add(l);
    l(toasts);
    return () => {
      listeners.delete(l);
    };
  },
};
