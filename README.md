# WomenAId

AI-триаж снимков шейки матки (decision-support, **не диагноз**) + модуль
мониторинга скрининга/симптомов для пациенток в Казахстане. MVP, готовится
к пилоту с клиникой. См. [CLAUDE.md](CLAUDE.md) — неприкосновенные правила
безопасности.

> **Статус:** этот репозиторий пока содержит минимальный, но настоящий слой
> контроля доступа (аутентификация + авторизация). Бизнес-логика триажа и
> мониторинга — **заглушки** (`STUB`), они намеренно не реализованы (см.
> CLAUDE.md: триаж/red-flag/safety-сообщения — стоп-сигнал).

## Быстрый запуск через Docker

Самый быстрый способ показать демо на ноутбуке (например, в кабинете у
главврача): одна команда поднимает backend и frontend с нуля. Нужен только
Docker (с Docker Compose).

```bash
docker compose up --build
```

При **первом** старте контейнер backend сам:

1. генерирует синтетические демо-данные (`app.ml.make_demo_data`),
2. обучает демо-модель и сохраняет checkpoint (`app.ml.train` → `checkpoint.joblib`),
3. заполняет демо-пациенток и демо-врача (`scripts/seed_demo.py`),
4. запускает API (uvicorn).

Поэтому первый старт медленнее (идёт обучение). Последующие — быстрее:
checkpoint уже есть, переобучение пропускается.

После старта (единое SPA, маршруты внутри одного фронтенда):

- **Кабинет врача:** http://localhost:8080/clinic
- **Кабинет пациентки (PWA):** http://localhost:8080/patient
- **API (Swagger):** http://localhost:8000/docs (или http://localhost:8080/docs через nginx)
- **Демо-врач:** `demo_doc` / `demo1234`

БД и checkpoint лежат в Docker-томе `womenaid_data` и переживают перезапуск.
Начать с чистого листа: `docker compose down -v`.

> ⚠️ Модель обучена на **синтетических** данных и **не прошла клиническую
> валидацию** (`NOT_CLINICALLY_VALIDATED`). Только для демонстрации. Модель
> натренирована, но намеренно **не подключена** к пациентскому эндпоинту —
> serving остаётся заглушкой (см. CLAUDE.md).

Ниже — запуск без Docker (для разработки).

## Демо на Vercel (эфемерные данные)

Репозиторий настроен на деплой в Vercel «из коробки»:

- `vercel.json` запускает `npm install && npm run build` в `frontend/` (Vite SPA)
  и отдаёт результат (`frontend/dist/`) как статику — кабинет врача на `/clinic`,
  PWA пациентки на `/patient`, остальные пути — SPA-фоллбек на `index.html`;
- `api/index.py` — Python-serverless-функция, которая монтирует реальный FastAPI
  под `/api`, так что вызовы фронтенда `/api/...` и `/health` работают без изменений;
- маршрутизация заданы в `vercel.json` (зависимости функции — слим-набор
  в корневом `requirements.txt`, без scikit-learn/numpy, чтобы влезть в лимит).

Деплой: подключите репозиторий в Vercel (Root Directory — корень репо). Вход:
`demo_doc` / `demo1234`, пациентки `patient1…patient3` / `demo1234`.

> ⚠️ **Это ДЕМО, не пилот.** На Vercel writable только `/tmp`, и он эфемерный:
> SQLite-БД и загруженные снимки живут в `/tmp` и **сбрасываются при холодном
> старте** (поэтому демо-данные пересеваются на каждом cold start). Аудит и
> retention в таком режиме недолговечны. Для пилота с постоянными данными —
> container-хост ниже. Для непустого демо задайте в env Vercel свои
> `WOMENAID_SECRET_KEY` и `WOMENAID_FILE_ENCRYPTION_KEY` (иначе используются
> небезопасные демо-значения).

## Деплой на container-хост (Render / Railway / Fly) — для пилота

> Для **пилота с постоянными данными** Vercel не подходит (эфемерный `/tmp`,
> см. выше): нужен хост, который держит контейнер с постоянным диском под
> SQLite, зашифрованные снимки, аудит и retention.

Стек разворачивается одним Docker-образом (`deploy/Dockerfile`), где в одном
контейнере работают nginx (статика + reverse-proxy `/api` → `127.0.0.1:8000`) и
uvicorn — то есть тот же single-origin, что и в локальном `docker-compose`, без
CORS и без правок фронтенда.

**Render (push-to-deploy из GitHub, как было на Vercel):**

1. Запушьте репозиторий в GitHub.
2. Render → **New + → Blueprint** → выберите этот репозиторий. Render прочитает
   `render.yaml` и создаст web-сервис + постоянный диск `/data`.
3. В Environment сервиса задайте `WOMENAID_FILE_ENCRYPTION_KEY` (он не
   генерируется автоматически — должен быть валидным ключом Fernet):

   ```bash
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

   Без него вход/health/статика работают, но загрузка снимка осознанно падает с
   ошибкой — шифрование на диске никогда не пропускается молча.
4. После деплоя: `https://<сервис>.onrender.com/clinic` — кабинет врача,
   `…/patient` — PWA пациентки. Демо-вход: `demo_doc` / `demo1234`.

**Постоянные данные.** `render.yaml` объявляет диск `/data` (SQLite + снимки +
аудит) и план `starter` — диск требует платного плана. Для быстрого бесплатного
смоук-теста можно убрать блок `disk:` и поставить `plan: free`, **но** тогда
данные эфемерны (сбрасываются при каждом редеплое и при засыпании сервиса) —
для реального пилота это неприемлемо, используйте `starter` + диск.

**Railway / Fly.io.** Образ переносим: укажите `deploy/Dockerfile`, смонтируйте
том на `/data` и задайте те же переменные (`WOMENAID_SECRET_KEY`,
`WOMENAID_FILE_ENCRYPTION_KEY`). Хост подставляет `$PORT` — entrypoint
автоматически рендерит nginx под него.

## Стек

- **Backend:** FastAPI, SQLite (SQLAlchemy 2.0)
- **Аутентификация:** JWT (`python-jose`), хэширование паролей `passlib[bcrypt]`
- **ML:** scikit-learn (RandomForest) — есть демо-обучение
  (`app.ml.make_demo_data` / `app.ml.train` → `checkpoint.joblib`), но к
  пациентскому serving намеренно не подключено
- **Frontend:** Vite + React + TypeScript + Tailwind CSS + Framer Motion,
  единое SPA с ролевой маршрутизацией (`/auth`, `/patient/*`, `/clinic/*`),
  PWA только для кабинета пациентки (`vite-plugin-pwa`) — см. ниже

## Установка

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

## Запуск backend

```bash
cd backend
uvicorn app.main:app --reload
```

Интерактивная документация: http://127.0.0.1:8000/docs

## Запуск frontend

В отдельном терминале (backend должен быть запущен на `:8000` — см. выше):

```bash
cd frontend
npm install
npm run dev
```

Откроется на http://localhost:5173 — Vite проксирует `/api`, `/health`,
`/docs`, `/openapi.json` на `http://localhost:8000` (см. `vite.config.ts`),
так что отдельный CORS не нужен, как и в Docker/Vercel/Render. Кабинет
врача — `/clinic`, кабинет пациентки — `/patient`, вход — `/auth`.

Production-сборка: `npm run build` (выход в `frontend/dist/`) — её используют
все три деплой-сценария выше (Docker, Vercel, Render), руками собирать не
нужно.

## Создание пользователей (демо-аккаунты)

Скрипт `scripts/create_user.py` создаёт пользователей из консоли. Роли:
`patient`, `clinician`, `admin`. Для роли `patient` пользователь привязывается
к строке в `patients` через `patient_id` (создаётся автоматически, если не
указан `--patient-id`).

```bash
# из корня репозитория, с активным venv
python scripts/create_user.py --username admin --role admin     --password adminpw
python scripts/create_user.py --username doc   --role clinician --password docpw
python scripts/create_user.py --username alice --role patient   --password alicepw --full-name "Alice A."
```

## Аутентификация

Все защищённые эндпоинты требуют JWT в заголовке `Authorization: Bearer <token>`.
Токен выдаётся по `POST /auth/login` (form-encoded `username` + `password`).

**Логин (получить токен):**

```bash
curl -s -X POST http://127.0.0.1:8000/auth/login \
  -d "username=alice&password=alicepw"
# -> {"access_token":"eyJhbGci...","token_type":"bearer"}
```

**Запрос с токеном:**

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/auth/login \
  -d "username=alice&password=alicepw" | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

curl -s -X POST http://127.0.0.1:8000/risk-assessment/upload/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Роли и доступ

| Эндпоинт                                   | Кто имеет доступ                                    |
|--------------------------------------------|-----------------------------------------------------|
| `POST /auth/login`                         | все (публичный)                                     |
| `/risk-assessment/clinic/*`                | только `clinician` / `admin`                        |
| `/monitoring/clinic/*`                     | только `clinician` / `admin`                        |
| `POST /risk-assessment/upload/{patient_id}`| `clinician` / `admin`, **или** `patient` со своим `patient_id` |
| `/monitoring/patients/{patient_id}/*`      | `clinician` / `admin`, **или** `patient` со своим `patient_id` |
| `/admin/*` (в т.ч. `GET /admin/audit-log`) | только `admin`                                      |
| `DELETE /monitoring/patients/{patient_id}/data` | только `admin`                                 |

Без токена — `401`. Не та роль / чужой `patient_id` — `403`.

> **Безопасность:** `SECRET_KEY` берётся из `WOMENAID_SECRET_KEY` (по умолчанию —
> небезопасное dev-значение). Обязательно задайте его в любом реальном развёртывании.
> То же самое касается `WOMENAID_FILE_ENCRYPTION_KEY` (шифрование снимков на диске,
> см. «Путь к пилоту» ниже) — в Docker-демо используется небезопасный фиксированный
> ключ, в реальном развёртывании сгенерируйте свой:
> `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`.

## Кабинеты: врач (десктоп) и пациентка (PWA)

Одно SPA (`frontend/`, Vite + React + TypeScript), ролевая маршрутизация под
разную аудиторию — у каждой роли свой layout и свои требования к офлайн-доступу:

| Кабинет    | Путь          | Что это                                                          |
|------------|---------------|-------------------------------------------------------------------|
| Вход       | `/auth`       | Общий экран логина, редирект по роли из JWT                       |
| Врача      | `/clinic/*`   | Десктоп-дашборд: очередь триажа, ревью с `raw_score`/`confidence`  |
| Пациентки  | `/patient/*`  | Mobile-first (375px), нижняя навигация, выезжающие bottom-sheets   |

**Кабинет пациентки — PWA** (только `/patient/*`; `/clinic/*` — обычная
desktop-страница, не устанавливается):

- **Устанавливается на домашний экран.** Android/Chrome — кнопка «Добавить на
  домашний экран» (через `beforeinstallprompt`); iOS Safari — вручную
  («Поделиться» → «На экран Домой»). Manifest (`vite-plugin-pwa`) ограничен
  `scope`/`start_url: /patient`.
- **Service worker (`sw.js`) кэширует только статическую оболочку** —
  HTML/CSS/JS/иконки/manifest (`workbox.globPatterns` в `vite.config.ts`),
  чтобы приложение открывалось офлайн. **Медицинские данные офлайн не
  кэшируются:** для `/api/*`, `/health`, `/docs`, `/openapi.json` не задано ни
  одного `runtimeCaching`-правила и они в `navigateFallbackDenylist` — service
  worker их никогда не перехватывает и не пишет в Cache Storage. Токен
  авторизации хранится в `sessionStorage` (не переживает закрытие вкладки,
  не пишется на диск).
- **Иконки** (`frontend/public/icons/`) генерируются воспроизводимо скриптом
  `scripts/make_patient_pwa_icons.py` (без ручных бинарников в репозитории).
- **Secure context:** service worker работает на `https://` и на
  `http://localhost` — Docker-демо на `:8080` и `npm run dev` на `:5173`
  подходят.

**Кабинет врача** (`/clinic/*`): таблица очереди с горизонтальным скроллом
(`overflow-x-auto`), клик по строке открывает модалку ревью с `raw_score` /
`confidence` / `model_status`, формой решения (`POST .../review/{id}`) и
ссылкой на PDF-отчёт. `raw_score`/`confidence` собраны в отдельный
code-split чанк (`ClinicQueue`) — они физически не входят в JS-бандл, который
скачивает сессия пациентки.

## Путь к пилоту (защита данных)

Клиника обязательно спросит: **«кто и когда смотрел данные пациентки?»** Это
must-have для разговора о защите персональных медицинских данных. Поэтому в
системе есть **журнал аудита** (`audit_log`) — неизменяемая запись о каждом
доступе к данным и каждом значимом действии.

**Что логируется (как минимум):**

| Действие                              | `action`                              | `target_type` |
|---------------------------------------|---------------------------------------|---------------|
| Врач открыл очередь триажа            | `view_clinic_queue`                   | `risk_assessment` |
| Врач сделал review assessment (решение)| `review_assessment`                   | `risk_assessment` |
| Просмотр карточки пациентки           | `view_patient_card`                   | `patient`     |
| Запись согласия пациентки             | `consent.given`                       | `patient`     |
| Отзыв согласия пациентки              | `consent.withdrawn`                   | `patient`     |

Каждая запись хранит: `actor_user_id`, `actor_role`, `action`, `target_type`,
`target_id`, `created_at` (UTC) и `details` (JSON, напр. принятое решение или
старое/новое значение согласия).

**Просмотр журнала — только для `admin`:** `GET /admin/audit-log`, с фильтрами по
пациентке и по диапазону дат.

```bash
ADMIN=$(curl -s -X POST http://127.0.0.1:8000/auth/login \
  -d "username=admin&password=adminpw" | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# все события по пациентке 1 за период
curl -s -H "Authorization: Bearer $ADMIN" \
  "http://127.0.0.1:8000/admin/audit-log?patient_id=1&start=2026-01-01&end=2026-12-31"
```

Параметры: `patient_id`, `start`, `end` (ISO 8601, UTC, границы включительно),
`limit` (1–1000, по умолчанию 200; сортировка — новые сверху).

> **Семантика фильтра `patient_id`:** возвращает события с `target_type='patient'`
> и `target_id=patient_id` (просмотр карточки, согласие). События уровня
> assessment/appointment ссылаются на собственный `target_id`, а `patient_id`
> хранится в `details`.

### Согласие пациентки (версионируемое, отзываемое)

Согласие — это не просто флаг, а запись в `consent_records` (`id`, `patient_id`,
`consent_text_version`, `consent_text_snapshot`, `given_at`, `withdrawn_at`).
Текст версии передаётся **явно** при записи согласия (не хардкод), и в записи
сохраняется снимок текста, с которым пациентка согласилась.

- `POST /monitoring/patients/{id}/consent` — записать согласие. Тело:
  `{"consent_text_version": "...", "consent_text_snapshot": "..."}`.
- `POST /monitoring/patients/{id}/consent/withdraw` — отозвать согласие
  (проставляет `withdrawn_at` всем активным записям).

Поле `patients.consent_given` сохранено для обратной совместимости как
**вычисляемое** (синхронизируется автоматически): `true`, только если есть хотя бы
одна запись согласия без `withdrawn_at`.

**Согласие — это технический гейт, а не только политика** (см. CLAUDE.md): без
активного согласия `POST /risk-assessment/upload/{patient_id}` отклоняется с
`403` ещё до запуска анализа. После отзыва согласия загрузка снова начинает
отклоняться немедленно.

```bash
# записать согласие (от имени пациентки или клинициста)
curl -s -X POST http://127.0.0.1:8000/monitoring/patients/1/consent \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"consent_text_version":"v1.0","consent_text_snapshot":"Я согласна на AI-обработку снимка..."}'

# отозвать согласие
curl -s -X POST http://127.0.0.1:8000/monitoring/patients/1/consent/withdraw \
  -H "Authorization: Bearer $TOKEN"
```

### PDF-отчёт для врача

Чтобы показать клинике, как результат выглядит в рабочем процессе (а не JSON в
Swagger), есть PDF-отчёт по ассессменту:

`GET /risk-assessment/clinic/{assessment_id}/report.pdf` (только `clinician`/`admin`,
действие логируется в аудит). Генерируется через **reportlab**. Содержит:
данные пациентки (display_name, возраст, ID), дату снимка, `model_version`,
**крупно** `model_status` (красная плашка, если модель не валидирована),
`triage_label` + confidence, поле «Решение врача» (`clinician_decision`) и
дисклеймер внизу страницы.

```bash
curl -s -H "Authorization: Bearer $DOC_TOKEN" \
  "http://127.0.0.1:8000/risk-assessment/clinic/3/report.pdf" -o report.pdf
```

> Кириллица рендерится через системный TTF (Arial/DejaVu; путь можно задать
> `WOMENAID_PDF_FONT`). Если шрифт не найден — fallback на Helvetica без
> кириллицы, поэтому для деплоя стоит положить шрифт в репозиторий.

### Шифрование, retention и «право на забвение»

Снимки, которые загружает `POST /risk-assessment/upload/{patient_id}`, хранятся
на диске зашифрованными — это снимает конкретный вопрос юриста клиники
«а что с данными после визита».

- **Шифрование на уровне хранения.** Файл шифруется (`cryptography.Fernet`)
  перед записью на диск. Ключ — из `WOMENAID_FILE_ENCRYPTION_KEY` (переменная
  окружения, не в коде); без ключа сохранение завершается понятной ошибкой,
  а не молчаливой записью в открытом виде. Имя файла на диске — случайный
  UUID (не оригинальное имя, не привязано к ФИО), путь — под
  `WOMENAID_UPLOAD_DIR` (по умолчанию `data/uploads`; в Docker —
  `/data/uploads`, тот же volume, что и БД).
- **Retention.** `patients.data_retention_until` продлевается на
  `WOMENAID_DEFAULT_RETENTION_DAYS` (по умолчанию **1095 дней / ~3 года —
  плейсхолдер, не юридическое решение**, конкретный срок нужно согласовать с
  юристом клиники) при каждой новой загрузке снимка. `scripts/purge_expired_data.py`
  — cron-скрипт: удаляет файлы снимков и зануляет `image_path` у пациенток, чей
  срок уже прошёл (запускать по расписанию — cron/systemd timer — отдельно от
  API-процесса). Действия логируются в `audit_log` от имени синтетического
  системного актора (роль `system`, пользователь `system_retention_job`), чтобы
  у каждой записи аудита был настоящий `actor_user_id`, даже когда действие
  запустил не человек.

  ```bash
  WOMENAID_DATABASE_URL=sqlite:///./womenaid.db \
  WOMENAID_FILE_ENCRYPTION_KEY=... \
  python scripts/purge_expired_data.py
  ```

- **Право на забвение.** `DELETE /monitoring/patients/{id}/data` (только
  `admin` — необратимое действие, см. таблицу ролей выше) удаляет файлы
  снимков, сами записи `risk_assessments` и персональные поля пациентки
  (`full_name`, `birth_date`, `last_screening_date`), отзывает активное
  согласие. Если `WOMENAID_KEEP_ANONYMIZED_STATS` (по умолчанию `true`) —
  на каждую удаляемую запись создаётся обезличенная строка
  (`anonymized_assessment_stats`): без `patient_id` и без какой-либо привязки
  к личности, только `triage_label`/`model_version`/`model_status`/дата — для
  агрегированной аналитики. `audit_log` при этом не трогается и не
  переписывается: это неизменяемый журнал того, что произошло, а не данных
  самой пациентки.

  ```bash
  curl -s -X DELETE -H "Authorization: Bearer $ADMIN" \
    http://127.0.0.1:8000/monitoring/patients/1/data
  ```

> Сознательное ограничение объёма: эндпоинт сейчас доступен только `admin`,
> а не самой пациентке напрямую — это административное действие по запросу
> пациентки через клинику, а не самостоятельная кнопка «удалить мои данные» в
> личном кабинете (того и кабинета пока нет).

**Известные ограничения (до пилота):** нет инструмента миграций — при изменении
схемы dev-БД нужно пересоздать (удалить `backend/womenaid.db`). Тип `appointment`
заложен в схему `audit_log`, но функциональности записи на приём пока нет.

## E2E-проверка

```bash
.venv/bin/python tests/e2e_auth.py     # контроль доступа (роли, владение)
.venv/bin/python tests/e2e_audit.py    # журнал аудита + /admin/audit-log
.venv/bin/python tests/e2e_consent.py  # версионируемое согласие + гейт upload
```

Каждый тест поднимает приложение на изолированной временной БД, создаёт
admin/clinician/двух пациенток и проверяет соответствующие правила.
