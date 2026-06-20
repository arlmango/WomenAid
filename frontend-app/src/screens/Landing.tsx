import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarHeart,
  HeartHandshake,
  Lock,
  ScanLine,
  ShieldCheck,
  ShieldAlert,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { HeroVisual } from "../components/three/HeroVisual";
import { staggerContainer, staggerItem, scrollReveal, scrollRevealViewport } from "../lib/motionVariants";
import { PrimaryButton, GhostButton } from "../components/ui";

const HOW_IT_WORKS = [
  {
    Icon: ScanLine,
    title: "AI-триаж снимков",
    text:
      "Загруженный снимок получает триаж-категорию для маршрутизации к врачу. " +
      "Это decision-support, не диагноз — окончательное решение всегда принимает врач.",
    badge: "bg-rose-bg text-rose-deep",
  },
  {
    Icon: CalendarHeart,
    title: "Мониторинг скрининга и симптомов",
    text:
      "Статус скрининга считается по возрасту и дате последнего обследования. " +
      "Дневник симптомов — тревожные (red-flag) записи всегда ведут к рекомендации обратиться к врачу.",
    badge: "bg-lavender-bg text-lavender-deep",
  },
];

const SECURITY_POINTS = [
  {
    Icon: Lock,
    title: "Согласие — технический гейт",
    text: "Без активного согласия AI-анализ невозможен на уровне кода, не только по политике.",
  },
  {
    Icon: ShieldAlert,
    title: "Red-flag — всегда приоритет",
    text: "Тревожный симптом ведёт к рекомендации «обратитесь к врачу» независимо от остального.",
  },
  {
    Icon: UserCheck,
    title: "raw_score — только врачу",
    text: "Эндпоинт пациентки никогда не возвращает raw_score/confidence — только триаж-категорию и сообщение.",
  },
  {
    Icon: Stethoscope,
    title: "Модель помечена как демо",
    text: "Каждая запись несёт статус NOT_CLINICALLY_VALIDATED, пока модель не прошла клиническую проверку.",
  },
];

export function Landing() {
  return (
    <div>
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-pink to-magenta text-white shadow-btn">
            <HeartHandshake size={18} strokeWidth={2.25} />
          </span>
          <span className="font-serif text-xl">
            <span className="text-indigo">Women</span>
            <span className="text-magenta">AId</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/login" className="text-sm font-semibold text-navy hover:underline">
            Войти
          </Link>
          <Link to="/register">
            <PrimaryButton className="px-4 py-2 text-xs">Регистрация</PrimaryButton>
          </Link>
        </div>
      </header>

      {/* --- Hero --- */}
      <section className="relative mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:grid-cols-2 sm:items-center sm:py-16">
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.h1 variants={staggerItem} className="font-serif text-4xl leading-tight text-navy sm:text-5xl">
            AI-триаж и мониторинг скрининга шейки матки
          </motion.h1>
          <motion.p variants={staggerItem} className="mt-4 max-w-md text-base text-ink-soft">
            Инструмент поддержки принятия решений для медперсонала и понятный
            мобильный кабинет для пациентки — раньше заметить, быстрее дойти до врача.
          </motion.p>
          <motion.div variants={staggerItem} className="mt-7 flex flex-wrap gap-3">
            <Link to="/register">
              <PrimaryButton>
                <HeartHandshake size={18} /> Создать кабинет
              </PrimaryButton>
            </Link>
            <Link to="/login">
              <GhostButton>Войти</GhostButton>
            </Link>
          </motion.div>
          {/* Disclaimer — instant fade only, never staggered with the hero copy. */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-4 max-w-md text-xs leading-relaxed text-ink-muted"
          >
            WomenAId не ставит диагноз. Результат AI — вспомогательная информация
            для маршрутизации (decision-support); окончательное решение принимает врач.
          </motion.p>
        </motion.div>

        <div className="relative h-[280px] sm:h-[380px]">
          <HeroVisual />
        </div>
      </section>

      {/* --- Problem --- */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={scrollRevealViewport}
        variants={scrollReveal}
        className="mx-auto max-w-3xl px-5 py-10 text-center"
      >
        <h2 className="font-serif text-2xl text-navy">Проблема</h2>
        <p className="mt-3 text-ink-soft">
          Скрининг шейки матки часто пропускают или откладывают — нет напоминаний,
          нет понятного места для тревожных симптомов, нет быстрой маршрутизации
          снимка к врачу. Раннее выявление спасает время, которого потом не хватает.
        </p>
      </motion.section>

      {/* --- How it works (2 real modules) --- */}
      <section className="mx-auto max-w-5xl px-5 py-10">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={scrollRevealViewport}
          variants={scrollReveal}
          className="mb-6 text-center font-serif text-2xl text-navy"
        >
          Как это работает
        </motion.h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div
              key={item.title}
              initial="hidden"
              whileInView="show"
              viewport={scrollRevealViewport}
              variants={scrollReveal}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, boxShadow: "var(--shadow-soft-hover)" }}
              className="rounded-card border-[1.5px] border-line bg-surface p-6"
            >
              <span className={`mb-3 grid h-11 w-11 place-items-center rounded-full ${item.badge}`}>
                <item.Icon size={20} strokeWidth={2.25} />
              </span>
              <h3 className="font-semibold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- Security as architecture --- */}
      <section className="mx-auto max-w-5xl px-5 py-10">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={scrollRevealViewport}
          variants={scrollReveal}
          className="mb-2 text-center font-serif text-2xl text-navy"
        >
          Безопасность как архитектура
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="show"
          viewport={scrollRevealViewport}
          variants={scrollReveal}
          className="mb-6 text-center text-sm text-ink-soft"
        >
          Это не формальности — это код, который технически не даёт пропустить эти правила.
        </motion.p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECURITY_POINTS.map((point, i) => (
            <motion.div
              key={point.title}
              initial="hidden"
              whileInView="show"
              viewport={scrollRevealViewport}
              variants={scrollReveal}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.03 }}
              className="rounded-card-sharp border-[1.5px] border-line bg-surface p-4"
            >
              <span className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-mint-bg text-mint-deep">
                <point.Icon size={17} strokeWidth={2.25} />
              </span>
              <h3 className="text-sm font-semibold text-ink">{point.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{point.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- CTA --- */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={scrollRevealViewport}
        variants={scrollReveal}
        className="mx-auto max-w-3xl px-5 py-14 text-center"
      >
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-pink to-magenta text-white shadow-btn">
          <ShieldCheck size={22} strokeWidth={2.25} />
        </span>
        <h2 className="font-serif text-2xl text-navy">Готовы начать?</h2>
        <p className="mt-2 text-ink-soft">Создайте кабинет пациентки — это бесплатно и займёт пару минут.</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register">
            <PrimaryButton>Создать кабинет</PrimaryButton>
          </Link>
          <Link to="/login">
            <GhostButton>У меня уже есть аккаунт</GhostButton>
          </Link>
        </div>
        <p className="mx-auto mt-6 max-w-md text-[11px] leading-relaxed text-ink-muted">
          WomenAId не ставит диагноз. Результат AI — вспомогательная информация
          для маршрутизации; окончательное решение принимает врач. Демо-модель
          не прошла клиническую валидацию.
        </p>
      </motion.section>
    </div>
  );
}
