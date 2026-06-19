import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarHeart,
  HeartHandshake,
  NotebookPen,
  ScanLine,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { PageTransition } from "../components/PageTransition";
import { ModelStatusBadge, PrimaryButton, GhostButton, SyntheticDataNote } from "../components/ui";

const FEATURES = [
  {
    Icon: ScanLine,
    title: "AI-триаж снимков",
    text: "Снимок шейки матки получает триаж-категорию для маршрутизации — это поддержка решения врача, не диагноз.",
    badge: "bg-rose-bg text-rose-deep",
  },
  {
    Icon: CalendarHeart,
    title: "Мониторинг скрининга",
    text: "Радиальный таймлайн показывает пациентке, когда подходит срок планового скрининга.",
    badge: "bg-lavender-bg text-lavender-deep",
  },
  {
    Icon: NotebookPen,
    title: "Дневник симптомов",
    text: "Пациентка ведёт дневник; тревожные (red-flag) симптомы всегда ведут к рекомендации обратиться к врачу.",
    badge: "bg-peach-bg text-peach-deep",
  },
];

const FOR_WHOM = [
  { Icon: HeartHandshake, title: "Для пациенток", text: "Мобильный кабинет: скрининг, симптомы, загрузка снимка, записи на приём." },
  { Icon: Stethoscope, title: "Для клиник", text: "Очередь триажа, карточки пациенток и отчёты для медперсонала на десктопе." },
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <PageTransition variant="desktop">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2.5">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-rose to-blush text-white shadow-btn">
              <HeartHandshake size={24} strokeWidth={2.25} />
            </span>
            <span className="font-serif text-3xl text-ink">WomenAId</span>
          </div>
          <h1 className="mx-auto max-w-3xl font-serif text-4xl leading-tight text-ink sm:text-5xl">
            AI-триаж и мониторинг скрининга шейки матки
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-ink-soft">
            Инструмент поддержки принятия решений для медперсонала и спокойный,
            понятный кабинет для пациентки. Ранняя маршрутизация — больше шансов
            вовремя дойти до врача.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryButton className="w-full sm:w-auto" onClick={() => navigate("/login?role=patient")}>
              <HeartHandshake size={18} /> Войти как пациентка
            </PrimaryButton>
            <GhostButton className="w-full sm:w-auto" onClick={() => navigate("/login?role=clinician")}>
              <Stethoscope size={18} /> Войти как врач
            </GhostButton>
          </div>
        </motion.div>

        {/* Feature cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
              className="rounded-card border border-white/60 bg-white/80 p-5 shadow-soft backdrop-blur-sm"
            >
              <span className={`mb-3 grid h-11 w-11 place-items-center rounded-full ${f.badge}`}>
                <f.Icon size={20} strokeWidth={2.25} />
              </span>
              <h3 className="font-serif text-lg text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{f.text}</p>
            </motion.div>
          ))}
        </div>

        {/* For whom */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FOR_WHOM.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.35 }}
              className="flex items-start gap-3 rounded-card border border-white/60 bg-white/70 p-5 shadow-soft backdrop-blur-sm"
            >
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-mint-bg text-mint-deep">
                <f.Icon size={19} strokeWidth={2.25} />
              </span>
              <div>
                <h3 className="font-semibold text-ink">{f.title}</h3>
                <p className="mt-0.5 text-sm text-ink-soft">{f.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Honesty block — kept prominent on purpose */}
        <div className="mt-8 space-y-3">
          <ModelStatusBadge />
          <div className="flex items-start gap-2.5 rounded-card border border-rose-pale/60 bg-rose-bg/50 p-4 text-sm text-ink-soft">
            <ShieldCheck size={18} className="mt-0.5 flex-none text-rose-deep" />
            <p>
              WomenAId не ставит диагноз. Любой вывод AI — вспомогательная
              информация для маршрутизации; окончательное решение всегда
              принимает врач.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <Activity size={13} /> Демонстрационная версия продукта
          </span>
          <SyntheticDataNote />
        </div>
      </div>
    </PageTransition>
  );
}
