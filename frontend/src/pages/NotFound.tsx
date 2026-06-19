import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-4 text-center">
      <h1 className="font-serif text-3xl text-ink">404</h1>
      <p className="text-ink-soft">Страница не найдена.</p>
      <Link to="/" className="font-semibold text-rose-deep hover:underline">
        На главную
      </Link>
    </div>
  );
}
