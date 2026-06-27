# Журнал работ (work log)

Отчёт о выполненных задачах. Новые записи добавляются снизу после каждой
завершённой задачи.

---

## 2026-06-18 — Создан CLAUDE.md

- Создан [CLAUDE.md](../CLAUDE.md): разделы «О проекте», «Неприкосновенные
  правила», «Архитектура», «Текущий статус данных», «Команды».
- Контекст: репозиторий был пустым (только `.git`); файл оформлен как
  forward-looking guidance.
- **Файлы:** `CLAUDE.md`.

---

## 2026-06-18 — Аутентификация и контроль доступа

- Добавлены таблицы `users` и `patients`; JWT-логин `POST /auth/login`
  (`passlib[bcrypt]` + `python-jose`).
- Зависимости: `get_current_user`, `get_current_clinician`, `verify_patient_access`.
- Защита: `/risk-assessment/clinic/*` и `/monitoring/clinic/*` — только
  clinician/admin; `upload/{id}` и `/monitoring/patients/{id}/*` — clinician/admin
  или сама пациентка.
- Скрипт `scripts/create_user.py`; раздел «Аутентификация» в README.
- **Файлы:** `backend/app/**`, `scripts/create_user.py`, `README.md`,
  `tests/e2e_auth.py`, `.gitignore`, `backend/requirements.txt`.
- **Проверка:** `tests/e2e_auth.py` — 20/20; живой прогон uvicorn + curl.

---

## 2026-06-18 — Журнал аудита

- Таблица `audit_log` + помощник `record_audit`; эндпоинт
  `GET /admin/audit-log` (только admin) с фильтрами по `patient_id` и датам.
- Логируются: просмотр очереди триажа, review assessment, просмотр карточки
  пациентки, изменения согласия.
- Раздел «Путь к пилоту (защита данных)» в README.
- **Файлы:** `backend/app/models/audit.py`, `backend/app/audit.py`,
  `backend/app/routers/admin.py`, `backend/app/schemas/audit.py`, `README.md`,
  `tests/e2e_audit.py`.
- **Проверка:** `tests/e2e_audit.py` — 24/24; живой прогон curl.

---

## 2026-06-18 — Версионируемое согласие + технический гейт на upload

- Таблица `consent_records` (версия текста, снимок текста, given_at,
  withdrawn_at). `patients.consent_given` — вычисляемый/синхронизируемый флаг.
- Эндпоинты `POST /monitoring/patients/{id}/consent` и `.../consent/withdraw`.
- Гейт `require_active_consent`: без активного согласия `upload` → 403 до анализа.
- Правило добавлено в CLAUDE.md.
- Поймана и исправлена ошибка: при `autoflush=False` флаг не пересчитывался
  после отзыва (фикс — `db.flush()` в `sync_consent_flag`).
- **Файлы:** `backend/app/models/consent.py`, `backend/app/consent.py`,
  `backend/app/timeutils.py`, `backend/app/routers/{monitoring,risk_assessment}.py`,
  `CLAUDE.md`, `README.md`, `tests/e2e_consent.py`, обновлены `tests/e2e_{auth,audit}.py`.
- **Проверка:** consent 20/20, audit 24/24, auth 20/20; живой прогон curl.

---

## 2026-06-18 — Настроен журнал работ

- По просьбе пользователя: после каждой завершённой задачи отчёт пишется в
  этот файл (`docs/work-log.md`).
- **Файлы:** `docs/work-log.md`.

---

## 2026-06-18 — Демо-данные для показа клинике (seed_demo.py)

- `scripts/seed_demo.py` (через ORM): 8 пациенток по всем статусам скрининга
  (2 UP_TO_DATE, 2 DUE_SOON, 2 OVERDUE — одна ~1.9 года, 1 NOT_YET_ELIGIBLE,
  1 OUT_OF_PROGRAM_AGE), 4 записи симптомов (2 red-flag), 4 risk-assessment
  с разными triage_label (все несут `model_status`), активное согласие у
  in-program пациенток, демо-врач + по логину на пациентку. Печатает креды и ID.
- Реализованы модели/логика, которых раньше не было (были стабы):
  `Patient.birth_date/last_screening_date`, `screening_rules.get_screening_status`
  + `evaluate_symptom` + `RED_FLAG_SYMPTOMS`, модели `SymptomEntry` и
  `RiskAssessment`.
- ⚠️ Клинические пороги (возраст/интервал/окно) и red-flag список — **PLACEHOLDER,
  не клинически валидированы**, явно помечены в коде и в выводе скрипта. Это
  stop-signal зона CLAUDE.md; вопрос был поднят, пользователь перенаправил на
  демо — значения помечены, не выданы за настоящие.
- Поймана и исправлена ошибка: `DetachedInstanceError` в выводе (доступ к ORM
  после commit/close) — теперь печать использует снятые значения.
- **Файлы:** `scripts/seed_demo.py`, `backend/app/models/{patient,screening_rules,
  symptom,risk_assessment}.py`, `backend/app/db/database.py`.
- **Проверка:** прогон на одноразовой `/tmp`-БД (`womenaid.db` не тронут): все
  8 статусов как ожидалось, счётчики сходятся, guard идемпотентности работает.

---

## 2026-06-18 — PDF-отчёт по ассессменту для врача

- Эндпоинт `GET /risk-assessment/clinic/{assessment_id}/report.pdf`
  (clinician/admin, логируется как `generate_report_pdf`, 404 на отсутствующий).
  Генерация через **reportlab** (легче ставится, чем weasyprint — чистый wheel).
- В отчёте: данные пациентки (display_name/возраст/ID), дата снимка,
  `model_version`, `model_status` крупной красной плашкой если не валидирована,
  `triage_label` + confidence, поле «Решение врача» (`clinician_decision` или
  пустые линии), дисклеймер внизу.
- Кириллица: регистрируется системный TTF (Arial/DejaVu, env `WOMENAID_PDF_FONT`),
  fallback Helvetica.
- Модель `RiskAssessment` дополнена `model_version` + `clinician_decision`; seed
  проставляет версию и одно заполненное решение врача.
- **Файлы:** `backend/app/pdf_report.py`, `backend/app/routers/risk_assessment.py`,
  `backend/app/models/risk_assessment.py`, `scripts/seed_demo.py`,
  `backend/requirements.txt` (+reportlab, +pypdf), `tests/e2e_report.py`, `README.md`.
- **Проверка:** `tests/e2e_report.py` 23/23 (текст PDF извлекается pypdf —
  проверены все поля, плашка-предупреждение есть/нет по статусу, пустое решение
  не выдумывается, 404, доступ). Регрессия: auth 20, audit 24, consent 20.
  Живой прогон uvicorn+curl: 200, application/pdf, 64KB.

---

## 2026-06-18 — DATA_PARTNERSHIP.md (документ для разговора о данных)

- Создан `DATA_PARTNERSHIP.md` в корне (на русском, партнёрский тон, не питч):
  5 разделов — что просим (обезличенные снимки + разметка врача, ориентир
  500–1500), что делаем с данными (хранение, RBAC, журнал аудита, согласие как
  технический гейт, не передаём третьим лицам), что получает клиника (пилот,
  соавторство, приоритет), этико-юридический трек (ЛЭК, форма согласия,
  де-идентификация, закон РК), чего НЕ обещаем (не замена врача, не медизделие,
  точность не гарантирована до валидации).
- Опирался на реально внедрённое в этой сессии (RBAC, audit log, версионируемое
  согласие, гейт upload) — без обещаний несуществующего; объём данных дан как
  ориентир, статус модели (синтетика, без валидации) указан честно.
- **Файлы:** `DATA_PARTNERSHIP.md`.

---

## 2026-06-19 — Docker-стек для демо (`docker compose up`)

- `docker-compose.yml`: backend (FastAPI/uvicorn) + frontend (nginx статик +
  reverse-proxy API). Том `womenaid_data` для БД и checkpoint.
- `backend/Dockerfile` (python:3.12-slim): ставит requirements, system-deps
  `libgomp1` (sklearn) и `fonts-dejavu-core` (кириллица в PDF). Контекст сборки —
  корень репо (чтобы попали и `backend/`, и `scripts/`), Dockerfile лежит в `backend/`.
- `backend/entrypoint.sh`: при первом старте (нет `checkpoint.joblib`) →
  `make_demo_data` + `train`; затем идемпотентный `seed_demo.py`; затем uvicorn.
- Создана ML-демо-пайплайн, которой не было: `app/ml/make_demo_data.py`
  (синтетика, 1200 сэмплов × 16 фич) + `app/ml/train.py` (RandomForest →
  `checkpoint.joblib` с метаданными). ⚠️ Синтетика, `NOT_CLINICALLY_VALIDATED`;
  модель НЕ подключена к пациентскому serving (safety-зона не тронута).
- Создан минимальный `frontend/index.html` (его не было) + `docker/nginx.conf`.
- README: новый раздел «Быстрый запуск через Docker» — первым способом запуска.
- **Не запускал Docker** (не установлен на машине): проверил всё, что внутри —
  YAML compose, `sh -n` entrypoint, симуляция first/second start (train+seed →
  skip+skip), ML-пайплайн локально (accuracy 0.946 на синтетике). Регрессия:
  auth 20, audit 24, consent 20, report 23.
- **Файлы:** `docker-compose.yml`, `backend/Dockerfile`, `backend/entrypoint.sh`,
  `.dockerignore`, `docker/nginx.conf`, `frontend/index.html`,
  `backend/app/ml/{__init__,make_demo_data,train}.py`, `backend/requirements.txt`,
  `.gitignore`, `README.md`.

---

## 2026-06-19 — UX-правки `frontend/index.html` + экран логина и очередь врача

- Уточнил с пользователем: в файле не было ни логина, ни таблиц — это была
  демо-страница со статус-чеком. Согласовали добавить логин-экран и таблицу
  очереди врача (расширение функциональности, не просто фикс).
- **Обработка ошибок:** все `fetch()` (health, login, очередь) обёрнуты в
  try/catch с читаемым сообщением вместо silent fail/alert (разные сообщения
  для сети vs. 401 vs. прочих ошибок сервера).
- **Loading-индикаторы:** кнопки «Войти» и «Обновить» дизейблятся и меняют
  текст («Вход…» / «Загрузка…») на время запроса.
- **Логин-экран:** форма username/password → `POST /api/auth/login`, токен в
  `sessionStorage`, роль/имя/`patient_id` читаются из JWT-payload на клиенте
  (декодируется без проверки подписи — только для UI, авторизация всё равно
  серверная). Просрочённый токен (`exp`) автоматически разлогинивает.
  `clinician`/`admin` видят таблицу очереди (`GET /risk-assessment/clinic/queue`),
  `patient` — заглушку (личный кабинет пациентки не реализован — backend для
  него и не готов). Прямого доступа по `patient_id` без токена не было и нет.
- **Таблица очереди:** колонки строятся динамически из ключей реальных
  объектов ответа (эндпоинт сейчас STUB, всегда `items: []` — намеренно не
  трогал бизнес-логику триажа, см. CLAUDE.md), поэтому показывается честное
  «очередь пуста». Обёрнута в `.table-scroll` (`overflow-x:auto`) — на 375px
  скроллится сама таблица, а не страница.
- **RU/KZ toggle:** словарь `TRANSLATIONS` только для UI-чисто-интерфейсных
  строк (кнопки, заголовки, сообщения об ошибках). Дисклеймер, плашка статуса
  модели и любые будущие `patient_facing_message` — НЕ переводятся, остаются
  только на русском (явно прокомментировано в коде); KZ-строки — черновой
  перевод, без ревью носителем языка, что отражено в комментарии.
- Цвета/шрифты/структура карточек не менялись — только добавлены новые
  карточки (логин/сессия/очередь/пациентка) в существующем визуальном стиле.
- **Файлы:** `frontend/index.html`.
- **Проверка:** живой прогон — backend на временной БД (`/tmp`, не
  `backend/womenaid.db`) + самописный Node-прокси (имитация `docker/nginx.conf`,
  без Docker) + Playwright (headless Chromium): 15/15 проверок — неверный
  пароль → читаемая ошибка, успешный логин → показ роли и очереди, пустая
  очередь → честное сообщение, офлайн-режим во время запроса не роняет
  страницу, lang-toggle переводит UI но не дисклеймер, логаут возвращает к
  форме, на 375px таблица скроллится горизонтально без горизонтального скролла
  всей страницы. Все временные файлы/процессы (`/tmp/*`, Node, uvicorn) удалены
  после проверки.

---

## 2026-06-19 — Проверка SIPaKMeD/Herlev перед подключением (решение: не подключать)

- По просьбе пользователя — исследование (не код) публичных датасетов
  цитологии шейки матки **SIPaKMeD** и **Herlev** перед потенциальным
  использованием для обучения.
- **Лицензия:** у обоих нет явной лицензии от авторов — только формулировка
  «publicly available for experimental purposes» + просьба процитировать
  статью. Пометки «CC BY 4.0» на Kaggle/Roboflow — релицензирование третьими
  лицами, не имеющее силы поверх условий правообладателей. Для продукта,
  потенциально становящегося коммерческим, это требует отдельного письменного
  разрешения авторов (не запрашивалось).
- **Несовпадение модальности:** оба датасета — изображения **отдельных
  клеток** цитологического препарата (Pap-мазок), а не снимки шейки матки
  целиком (кольпоскопия/VIA), на которые рассчитан текущий
  `/risk-assessment/upload`. Модель на них решала бы другую задачу.
- **Решение пользователя:** датасеты сейчас не подключать к проекту (ни в
  основной демо-пайплайн, ни в отдельную экспериментальную ветку). Зафиксировал
  выводы как заметку в `DATA_PARTNERSHIP.md` (раздел «Рассмотренные публичные
  датасеты»), чтобы решение и его причины не потерялись.
- Код/модели/датасеты не менялись и не скачивались.
- **Файлы:** `DATA_PARTNERSHIP.md`.

---

## 2026-06-19 — Шифрование снимков, retention-политика, «право на забвение»

- Запрос пользователя ссылался на `app/ml/uploads`, которого фактически не
  существовало: `POST /risk-assessment/upload/{patient_id}` был заглушкой без
  параметра файла и без записи на диск. Сообщил об этом пользователю и
  реализовал реальный (минимальный) приём файла как необходимое расширение
  объёма задачи — без изменения текста ответа-заглушки
  (`triage_label`/`patient_facing_message`) и без касания триаж-логики.
- **Шифрование на диске:** `app/encryption.py` — симметричное шифрование
  (`cryptography.fernet.Fernet`), ключ только из `WOMENAID_FILE_ENCRYPTION_KEY`
  (никогда в коде); при отсутствии/невалидности ключа — явный отказ
  (`FileEncryptionNotConfigured`), а не запись открытым текстом. Файлы хранятся
  под `WOMENAID_UPLOAD_DIR/<patient_id>/<uuid>.enc` — оригинальное имя файла не
  сохраняется (не утекает PII, нет path traversal).
- **Retention:** новое поле `patients.data_retention_until`, продлевается при
  каждой загрузке (`app/retention.py::extend_retention`). Срок по умолчанию —
  1095 дней (`WOMENAID_DEFAULT_RETENTION_DAYS`), явно помечен как
  PLACEHOLDER/не юридическое решение, до согласования с клиникой. Cron-скрипт
  `scripts/purge_expired_data.py` удаляет файлы просроченных пациентов, обнуляя
  `image_path`, но оставляя саму запись `risk_assessment`; пишет в audit_log от
  имени синтетического системного актора (роль `system`, добавлена в
  `User.ROLES`, никаких реальных прав не даёт — проверено, что `ROLES` целиком
  не участвует ни в одной авторизационной проверке).
- **Право на забвение:** `DELETE /monitoring/patients/{id}/data` —
  **только admin** (сознательное и задокументированное в README ограничение
  по необратимости операции, не запрошено явно пользователем). Удаляет файлы
  снимков, обнуляет персональные поля пациентки, отзывает согласие, удаляет
  строки `risk_assessment` — но если включена политика
  (`WOMENAID_KEEP_ANONYMIZED_STATS`, по умолчанию true), переносит
  неидентифицирующие поля (`triage_label`, `model_version`, `model_status`,
  `dataset_status`, дата) в отдельную таблицу `anonymized_assessment_stats`,
  у которой **нет** `patient_id`/FK — связь с личностью разрывается
  структурно, не только по соглашению. `audit_log` при этом не трогается
  (остаётся неизменным журналом, включая записи об уже удалённых сущностях).
- README: добавлен раздел «Шифрование, retention и «право на забвение»» в
  «Путь к пилоту» — описывает все три механизма и явно отвечает на вопрос
  юриста клиники «а что с данными после визита».
- **Файлы:** `backend/app/config.py`, `backend/app/encryption.py` (новый),
  `backend/app/storage.py` (новый), `backend/app/retention.py` (новый),
  `backend/app/models/user.py`, `backend/app/models/patient.py`,
  `backend/app/models/anonymized_stat.py` (новый),
  `backend/app/models/risk_assessment.py`, `backend/app/db/database.py`,
  `backend/app/routers/risk_assessment.py`, `backend/app/routers/monitoring.py`,
  `backend/requirements.txt`, `backend/Dockerfile`, `docker-compose.yml`,
  `scripts/purge_expired_data.py` (новый), `README.md`,
  `tests/e2e_auth.py`, `tests/e2e_consent.py`,
  `tests/e2e_data_protection.py` (новый).
- **Проверка:** полный прогон на временных БД (`/tmp/*.db` через
  `WOMENAID_DATABASE_URL`, не `backend/womenaid.db`) и временных upload-папках
  (`tempfile.mkdtemp`): `e2e_auth.py` 20/20, `e2e_consent.py` 20/20,
  `e2e_audit.py` 24/24, `e2e_report.py` 23/23 (все обновлены под новый
  обязательный параметр `file` в upload), `e2e_data_protection.py` 28/28 —
  новый тест проверяет шифрование (файл на диске не совпадает с открытым
  текстом, расшифровывается обратно), отказ без ключа, продление retention,
  избирательность purge-job (трогает только просроченных), эффект и
  access-control (только admin, 403 для пациентки/клинициста, 404 для
  несуществующего пациента) права на забвение, сохранение анонимной строки
  статистики без привязки к личности. `git status --short` после прогона —
  репозиторий чист, реальная БД не существует/не тронута.

---

## 2026-06-19 — Кабинет пациентки вынесен в отдельное PWA (frontend/patient-pwa/)

- По просьбе пользователя кабинет пациентки (без кабинета врача) вынесен в
  отдельное минимальное PWA `frontend/patient-pwa/`. Кабинет врача
  (`frontend/index.html`, очередь триажа) оставлен как есть — десктоп-
  ориентированный, отдельный путь; намеренно НЕ объединял в одно приложение
  (разная аудитория, разные требования к офлайн-доступу).
- **PWA-обвязка:** `manifest.json` (standalone, theme `#1456c4`, иконки
  192/512 + maskable, относительные пути под `/patient-pwa/`), регистрация
  service worker, поддержка «добавить на домашний экран» — Android/Chrome через
  `beforeinstallprompt` (реальная кнопка), iOS Safari — пошаговая инструкция в
  самом кабинете (у iOS нет install-API). Мета-теги `apple-touch-icon`,
  `apple-mobile-web-app-*` для iOS.
- **Безопасность кэша (ключевое требование задачи):** service worker (`sw.js`)
  кэширует **только статическую оболочку** (HTML/CSS/JS/иконки/manifest/offline).
  Всё динамическое и медицинское (`/api/*`, `/health`, `/openapi.json`,
  `/docs`), кросс-доменные и не-GET запросы — никогда не перехватываются
  (`respondWith` не вызывается) и не пишутся в Cache Storage; медданные доступны
  только онлайн. Токен — в `sessionStorage` (не на диск, не переживает закрытие
  вкладки). При офлайне — баннер + статическая `offline.html` без медданных.
- **Кабинет** (`index.html` + `app.js` + `styles.css`): вход пациентки (тот же
  `/api/auth/login`), демо-кабинет (честно помечен как заглушка — разделы
  скрининга/симптомов/результатов не реализованы), переключатель RU/KZ. Если
  на PWA заходит клиницист/админ — показывается уведомление со ссылкой на
  десктоп-кабинет (`../`). Дисклеймер и плашка статуса модели — без `data-i18n`,
  остаются только на русском (правило про неперевод медицинских/safety-строк
  соблюдено, как и в основном фронтенде).
- **Иконки** генерируются воспроизводимым скриптом
  `scripts/make_patient_pwa_icons.py` (Pillow, без ручных бинарников):
  бренд-синий фон + белая «W», anti-aliasing через 4× суперсэмплинг; обычные
  (скруглённые) + maskable (full-bleed, safe-zone) + apple-touch (180) +
  favicon (32).
- В основной `frontend/index.html` — одна маленькая ссылка из карточки
  пациентки на мобильный кабинет (RU/KZ); очередь триажа врача не тронута.
  В `README.md` — новая секция «Кабинеты: врач (десктоп) и пациентка (PWA)» и
  ссылка на `/patient-pwa/` в Docker-разделе. Изменений backend нет.
- **Файлы:** `frontend/patient-pwa/index.html` (новый),
  `frontend/patient-pwa/app.js` (новый), `frontend/patient-pwa/styles.css`
  (новый), `frontend/patient-pwa/sw.js` (новый),
  `frontend/patient-pwa/manifest.json` (новый),
  `frontend/patient-pwa/offline.html` (новый),
  `frontend/patient-pwa/icons/*.png` (5 иконок, сгенерированы),
  `scripts/make_patient_pwa_icons.py` (новый), `frontend/index.html`,
  `README.md`.
- **Проверка:** `node --check` для `app.js`/`sw.js` — ОК; `manifest.json` —
  валидный JSON, относительные пути/иконки; HTML (`index.html`/`offline.html`)
  парсится; все 23 ключа `data-i18n` присутствуют в словаре `app.js`; дисклеймер
  не помечен `data-i18n`. **Node-харнесс для `sw.js`** (мок SW-scope, симуляция
  fetch-событий): подтверждено, что `/api/auth/login`, `/api/.../queue`,
  `/api/.../symptoms`, `/health`, `/openapi.json`, `/docs` и кросс-домен —
  НЕ перехватываются (не кэшируются), а статика (`styles.css`, навигация) —
  перехватывается. Живой прогон `http.server`: все ассеты PWA отдаются
  (HTTP 200, корректные content-type — `application/json`, `text/javascript`,
  `image/png` и т.д.), основной `index.html` по-прежнему работает и содержит
  ссылку на PWA. Иконки — валидные PNG нужных размеров (192/512/512/180/32).
  Все временные файлы/процессы удалены после проверки.

---

## 2026-06-19 — Деплой: диагностика Vercel 404 + конфиг для container-хоста

- Пользователь задеплоил проект на Vercel и получил `404: NOT_FOUND`
  (`ID: fra1::…` — сигнатура Vercel). Диагноз: архитектурное несоответствие, а
  не отсутствие файлов (всё закоммичено и в origin/main). Проект — Docker-стек
  (FastAPI+SQLite+nginx), а Vercel раздаёт только статику/serverless: нет
  постоянного uvicorn/SQLite и writable-диска для зашифрованных снимков, аудита
  и retention. В корне нет `index.html` → 404 на `/`; даже отдав статику, Vercel
  не поднимет бэкенд (логин/`/health` не заработают).
- Спросил направление (AskUserQuestion). Выбор пользователя: **весь стек на
  один container-хост** (наименьший объём переделок, сохраняет single-origin,
  persistent-данные и весь модуль защиты данных без правок кода).
- **Решение — один комбинированный Docker-образ** (`deploy/Dockerfile`): в одном
  контейнере nginx (статика + reverse-proxy `/api`→`127.0.0.1:8000`,
  `/health`/`/docs`/`/openapi.json`) и uvicorn. Тот же single-origin, что в
  локальном `docker-compose`, без CORS и без изменений фронтенда/бэкенда.
  - `deploy/nginx.conf.template` — как `docker/nginx.conf`, но `listen ${PORT}`
    (подстановка через envsubst на старте) и проксирование на локальный uvicorn;
    плюс `Cache-Control: no-cache` для `sw.js`, чтобы обновления PWA доходили.
  - `deploy/entrypoint.sh` — idempotent seed демо-данных, опциональное обучение
    модели (по умолчанию ВЫКЛ — модель не подключена к serving, ради быстрого и
    надёжного старта), запуск uvicorn в фоне + ожидание готовности, envsubst
    nginx-конфига под `$PORT`, запуск nginx в foreground; `wait -n` — если
    падает любой процесс, контейнер завершается (хост перезапустит).
  - `render.yaml` — Blueprint для Render (push-to-deploy из GitHub, как было на
    Vercel): web-сервис на Docker, диск `/data` (SQLite + снимки), healthcheck
    `/health`, регион `frankfurt` (ближайший к Казахстану). `WOMENAID_SECRET_KEY`
    — `generateValue`, `WOMENAID_FILE_ENCRYPTION_KEY` — `sync:false` (валидный
    ключ Fernet нельзя автогенерировать; задаётся вручную, без него загрузка
    осознанно падает, шифрование не пропускается молча).
- Backend/фронтенд-код НЕ менялся (правки только инфраструктурные + docs).
- **Файлы:** `deploy/Dockerfile` (новый), `deploy/nginx.conf.template` (новый),
  `deploy/entrypoint.sh` (новый), `render.yaml` (новый), `README.md`.
- **Проверка** (без локального Docker — его нет в окружении; сборку образа
  подтвердит первый деплой на Render):
  - `bash -n deploy/entrypoint.sh` — синтаксис ОК.
  - Симуляция envsubst: в `nginx.conf.template` подставляется только `${PORT}`
    (`listen 10000;`), а `$host`/`$remote_addr`/`$uri`/`$scheme` сохраняются.
  - `render.yaml` — валидный YAML, нужные ключи (runtime docker, dockerfilePath,
    healthCheckPath `/health`, диск `/data`, 3 env-переменные).
  - **Функциональный прогон backend-слоя** (той части, что проксирует nginx) из
    venv на временной БД `/tmp` + реальный ключ Fernet: seed → `/health` 200,
    `demo_doc` логин → валидный JWT, очередь клиники 200 (клиницист) / 401
    (без токена), `patient1` загрузка снимка → 200 без `raw_score`/`confidence`,
    `/openapi.json` 200. 7/7 PASS. Реальная `backend/womenaid.db` не тронута.
  - Статика (PWA + кабинет врача) проверена ранее через `http.server`.
- **Дальше (нужно действие пользователя):** эти файлы надо закоммитить и
  запушить в `main`, чтобы Render их увидел; затем подключить репозиторий в
  Render как Blueprint и задать `WOMENAID_FILE_ENCRYPTION_KEY`. Авто-коммит не
  делал — по правилу коммит/пуш только по явной просьбе.

---

## 2026-06-19 — Vercel: фикс 404 + рабочий бэкенд (serverless, эфемерное демо)

- Пользователь настоял оставить деплой на Vercel и попросил «доработай чтобы всё
  работало» (не только убрать 404, но и логин/API).
- **Шаг 1 — фикс 404** (`vercel.json`, коммит `5072669`, запушен с явного
  разрешения): фронтенд лежит в `frontend/`, в корне нет `index.html` → Vercel
  отдавал 404. Добавил rewrites: `/` → `frontend/index.html`, `/patient-pwa/` →
  PWA, `/(.*)` → `frontend/$1`.
- **Шаг 2 — бэкенд как Vercel Python serverless** (`api/index.py`): функция
  монтирует реальный FastAPI (`app.main`) под `/api`, так что существующие
  вызовы фронта `/api/...` работают БЕЗ правок фронтенда (mount срезает префикс
  `/api`); плюс лёгкий `/health` на корне. На Vercel writable только `/tmp` и он
  эфемерный → БД (`sqlite:////tmp/...`) и загрузки в `/tmp/uploads`,
  демо-данные пересеваются на каждом cold start (`demo_doc`/`admin`/
  `patient1..3`, пароль `demo1234`). `os.environ.setdefault(...)` ставится ДО
  импорта `app` (config читает env на импорте); демо-ключ Fernet захардкожен
  для работы загрузки из коробки (данные в `/tmp` одноразовые; реальные ключи
  задаются в env Vercel).
- **Размер функции:** проверил граф импортов — serving-путь НЕ тянет
  scikit-learn/numpy/joblib (они только в `backend/app/ml/`, не импортируются
  роутерами). Поэтому отдельный слим `requirements.txt` в корне (fastapi,
  sqlalchemy, passlib[bcrypt], bcrypt, python-jose, cryptography,
  python-multipart, reportlab) — влезает в лимит Vercel. Локальный
  `backend/requirements.txt` и Docker-образ не тронуты.
- `vercel.json`: `functions.api/index.py.includeFiles="backend/**"` (бандлит
  пакет), rewrites `/api/(.*)` и `/health` → функция (раньше статики),
  `no-cache` для `sw.js`.
- README: секция «Демо на Vercel (эфемерные данные)» + предупреждение, что это
  ДЕМО (данные не персистентны), а пилот — на container-хосте.
- Backend/фронтенд-код НЕ менялся.
- **Файлы:** `api/index.py` (новый), `requirements.txt` (новый, корневой слим),
  `vercel.json` (обновлён), `README.md`.
- **Проверка (локально, как импортирует Vercel):** загрузил `api/index.py` через
  `importlib` (отрабатывает env-setup + seed + сборка parent-app), прогнал через
  `TestClient(mod.app)`: `/health` 200, `/api/auth/login demo_doc` → JWT, очередь
  клиники 200 / 401 без токена, неверный пароль 401, `patient1` логин + загрузка
  снимка 200 без `raw_score`/`confidence`, загрузка чужого пациента 403 — 9/9
  PASS. Слим-`requirements.txt` сверен с графом импортов (нет EmailStr/jinja2 и
  т.п.). Саму сборку/роутинг на стороне Vercel локально проверить нельзя (нет
  Docker/Vercel CLI) — подтвердится первым деплоем; конфиг сделан по
  каноничному паттерну FastAPI-on-Vercel.

---

## 2026-06-19 — Редизайн фронтенда (soft-rose дизайн-система)

- По детальному ТЗ пользователя полностью переделал визуальный язык кабинета
  врача (`frontend/index.html`) и PWA пациентки (`frontend/patient-pwa/`
  — `styles.css` + `index.html`): цветовая система, типографика, компоненты.
- **Цвета:** заменил сине-серую палитру на soft-rose из ТЗ (CSS-переменные:
  `--bg #FDF6F9`, `--rose #E8779A`, `--rose-deep`, `--rose-pale`, `--blush`,
  `--lavender`, `--peach`, `--mint`, `--ink #3D2535`, `--urgent` и т.д.).
- **Шрифты:** «DM Serif Display» (заголовки h1/h2) + «DM Sans» (body) с Google
  Fonts (`display=swap`, системный serif/sans как фолбэк офлайн).
- **Компоненты:** топбар (white + border-bottom, лого «W» в круге с
  градиентом `135deg rose→blush`), таб-переключатель языка (активный — rose,
  `border-radius 99px`), `.btn-primary` (градиент + `shadow 0 4px 14px`,
  hover → `rose-deep`), `.btn-secondary` (ghost, border `rose-pale`), карточки
  (`radius 18px`, hover `rose-pale` + мягкая тень), инпуты (`focus` — rose +
  кольцо `0 0 0 3px #E877991F`, фон `#FFFAFC`), пиллы/бейджи (uptodate/duesoon/
  overdue/priority/routine/urgent/redflag/demo по ТЗ), `.msg-box`
  (обычный/urgent), таблица очереди (rose-тон, горизонтальный скролл сохранён).
- **Декор (3 из 3):** градиентный hero-баннер под топбаром в PWA (gradient
  `160deg`, плавный mask-fade в фон); SVG-«акварельный цветок» в пустом
  состоянии кабинета пациентки (`.empty-state`); тонкий dot-паттерн
  (`radial-gradient`, repeat-x) в шапке карточек.
- **Что НЕ трогал (по ТЗ):** весь JS (fetch/auth/i18n-словари/health), тексты
  дисклеймеров и safety-сообщений, структуру (все элементы и `id` на месте,
  классы только переименованы/добавлены), RBAC. `data-i18n`-ключи не менял и
  новых строк без словаря не добавлял (hero-tagline и бейдж «демо» — статика,
  без `data-i18n`, чтобы `applyLang` их не затирал).
- **Файлы:** `frontend/index.html`, `frontend/patient-pwa/index.html`,
  `frontend/patient-pwa/styles.css`.
- **Проверка:** обе страницы парсятся; все `id`, которые дёргает JS
  (`getElementById` / `$()`), на месте; все `data-i18n`-ключи присутствуют в
  словарях; `app.js` не изменён (git diff пуст); баланс скобок CSS; touch-таргеты
  `min-height` 44–48px; таблица — `overflow-x:auto`. **Скриншоты headless
  Chrome:** кабинет врача (≈900px) и PWA пациентки (375px) — вёрстка не ломается,
  без горизонтального переполнения, шрифты DM подхватились, палитра/компоненты
  соответствуют ТЗ.
- **На заметку (вне scope ТЗ):** `manifest.json` `theme_color` и иконки PWA
  всё ещё синие (`#1456c4`) — при желании перегенерировать под rose отдельно.

---

> ⚠️ **Разрыв в журнале.** Записи ниже за 2026-06-19…06-20 восстановлены
> постфактум по `git log`/`git show` — в момент работы отчёт сюда не писался,
> хотя правило это требует (см. запись «Настроен журнал работ» выше). Поэтому
> детали решений и проверок здесь беднее, чем в обычных записях: что не видно
> в диффе/сообщении коммита, я не выдумываю.

## 2026-06-19/06-20 — Переезд `frontend/` на Vite + React + TypeScript + Tailwind (восстановлено по git)

- Старый `frontend/index.html` (vanilla JS, 548 строк) и `frontend/patient-pwa/`
  удалены; вместо них — SPA на Vite/React/TS/Tailwind с роутингом `/auth`,
  `/patient/*`, `/clinic/*` (коммиты `f96e19f`, `4b54847`).
- Добавлены страница регистрации и сайдбар-навигация кабинета врача,
  `backend/app/routers/auth.py` и `schemas/auth.py` расширены под неё
  (`f63a451`).
- Общие UI-компоненты (`FieldInput`, `EmptyState`, `GradientBackdrop`) и переход
  иконографии на `lucide-react` (`e6326f3`).
- Дневник симптомов и график скрининга пациентки, обзор клиники — подключены к
  реальному backend (не заглушки): `backend/app/ml/image_quality.py`,
  `backend/app/ml/inference.py`, расширения `monitoring.py`/`risk_assessment.py`
  (`01901ca`).
- **Файлы:** `frontend/src/**` (новое SPA целиком), `frontend/Dockerfile`,
  `docker/nginx.conf`, `docker-compose.yml`, `deploy/*`, `api/index.py`,
  `backend/app/routers/{auth,monitoring,risk_assessment}.py`,
  `backend/app/ml/{image_quality,inference}.py`, `vercel.json`.
- **Проверка:** не задокументирована в момент работы — что конкретно
  прогонялось перед коммитом, по диффу не видно.

---

## 2026-06-20 — `frontend-demo/`, `frontend-app/` как параллельные ветки + обновление зависимостей (восстановлено по git)

- `ee11881`: создан `frontend-demo/` — отдельный мок-прототип (свой
  `package.json`, `BottomSheet`/`Modal`/`ScreeningRing`/`Toaster` и т.д.),
  параллельно основному `frontend/`.
- `814d130`: создан `frontend-app/` — ещё одна отдельная версия фронтенда
  (`GradientBackdrop`, `ScreeningRing`, `ProtectedRoute`); также правки
  `backend/app/consent.py` и `backend/app/models/patient.py`. Этот каталог
  позже стал тем самым «flagship»-экспериментом с 3D-сценой и PWA, который
  был удалён 2026-06-21 (см. ниже) после прямой негативной обратной связи
  пользователя.
- **Файлы:** `frontend-demo/**` (новый), `frontend-app/**` (новый, позже
  удалён), `backend/app/consent.py`, `backend/app/models/patient.py`.
- **Проверка:** не задокументирована.

---

## 2026-06-20 — Ребрендинг палитры на teal (восстановлено по git)

- `0969031`: цветовая палитра сведена к teal, упрощены стили границ по всему
  `frontend/`. Детали ТЗ/обсуждения не сохранились — коммит без сопутствующего
  отчёта.
- **Файлы:** не перечисляю построчно — правки в `frontend/src/index.css` и
  компонентах, использующих цветовые токены (см. `git show 0969031 --stat`).
- **Проверка:** не задокументирована.

---

## 2026-06-21 — Удаление `frontend-app/`, единый сайт `frontend/`, нативная форма регистрации

- Пользователь дал резкую обратную связь по `frontend-app/` («он ужасный…
  убери фронтенд апп… мне нужен просто рабочий сайт») — явная авторизация на
  удаление. Удалил `frontend-app/` целиком (~30 файлов: 3D-сцена на Three.js,
  многошаговая анимированная регистрация, экраны пациентки) — решение принято
  без повторного уточнения, чтобы не множить циклы «опять не угадал дизайн».
- `frontend/` стал единственным реальным сайтом. Регистрация в нём была
  заглушкой-редиректом на (теперь несуществующий) `frontend-app/` — заменена
  на настоящую одношаговую форму: `display_name`, `birth_date`, `region`,
  `phone`, `username`, `password`, подтверждение пароля, текст согласия
  (`GET /auth/consent-text`) и чекбокс согласия — кнопка submit заблокирована,
  пока чекбокс не отмечен (согласие — технический гейт на backend, не только
  UI-валидация, см. CLAUDE.md).
- README: убрана таблица «три фронтенда», добавлено честное объяснение, почему
  `frontend-app/` удалён (дублирование одного контракта `/auth/register` в
  двух приложениях приводило к молчаливому расхождению).
- **Файлы:** удалён `frontend-app/**`; изменены
  `frontend/src/lib/api.ts` (`getConsentText`, `register`),
  `frontend/src/i18n/translations.ts`, `frontend/src/pages/auth/RegisterPage.tsx`,
  `README.md`.
- **Проверка:** живой прогон через браузерную автоматизацию — регистрация →
  авто-логин → кабинет пациентки (новый аккаунт `realtest1`); логин врача →
  очередь триажа, счётчик пациенток увеличился с 8 до 9; полный набор e2e
  backend-тестов (78 проверок) зелёный; чистая сборка `frontend/`.

---

## 2026-06-21 — Публичный лендинг + удаление PWA-функциональности

- У `frontend/` не было публичной landing-страницы — `/` сразу редиректил на
  `/auth`. Добавлен `pages/Landing.tsx`: hero, 3 карточки фич, бейдж статуса
  модели, кнопки «Войти»/«Создать аккаунт». `/` теперь показывает лендинг
  неавторизованным и редиректит на кабинет только залогиненных.
- Убрана PWA-обвязка `frontend/` (`vite-plugin-pwa`, manifest, service worker,
  `WomenAId — кабинет пациентки`/standalone-режим) — она показывала браузерный
  баннер «установить как приложение», что пользователь явно не хотел («не надо
  приложение вообще, только… крутой веб-сайт»). Синхронно почищены
  `docker/nginx.conf`, `deploy/nginx.conf.template`, `vercel.json` (убраны
  спецправила для `/sw.js`).
- **Файлы:** `frontend/src/pages/Landing.tsx` (новый), `frontend/src/App.tsx`,
  `frontend/vite.config.ts`, `frontend/package.json`, `docker/nginx.conf`,
  `deploy/nginx.conf.template`, `vercel.json`.
- **Проверка:** сборка чистая, в `dist/` нет `manifest.webmanifest`/`sw.js`;
  живой прогон в браузере — лендинг рендерится без install-промпта, переход
  на `/auth` → вход → кабинет/очередь работают как раньше.

---

## 2026-06-24 — Flagship-редизайн (3D-сцена, glassmorphism, кастомный курсор, 3-шрифтовая система) + диагностика «узкой колонки»

- По детальному ТЗ пользователя (ориентир — Linear/Stripe/Vercel) поднял
  визуальный уровень `frontend/` — после явного предупреждения о риске (это
  близко к тому, что было удалено 2026-06-21) и подтверждения пользователем,
  что применять нужно именно к текущему `frontend/`, а не к новому отдельному
  сайту.
- **Новые примитивы:** `CustomCursor` (точка со spring-лагом, увеличивается
  над интерактивными элементами; отключена на touch/`prefers-reduced-motion`),
  `CursorGlow` (radial-gradient спотлайт за курсором), `HeroScene`
  (`@react-three/fiber`, 3 слоя icosahedron с параллаксом от мыши/скролла,
  **lazy-loaded** — three.js не попадает в бандл `/auth`/`/patient`/`/clinic`),
  `AnimatedNumber` (счётчик вверх при появлении в viewport).
- **Честность как UI:** `ModelStatusBadge` — стеклянная плашка с анимированной
  gradient-рамкой; текст статуса не менялся, добавлен hover/click-разворот
  «Почему мы это показываем» (новый текст, не подмена существующего).
  `TriageMessageCard` — карточка с gradient-кольцом/иконкой по
  `triage_label`, `patient_facing_message`/`disclaimer` — verbatim. Раздел
  «Путь к пилоту» на лендинге — честный 5-шаговый roadmap (2 шага реально
  готовы, остальное помечено «дальше»), без выдуманных метрик точности модели.
- **3-шрифтовая система:** Fraunces (variable opsz+wght — заголовки/hero/
  крупные метрики, ось анимируется при скролле hero) / Inter (тело) / IBM
  Plex Mono (только `model_status`, `triage_label`, `raw_score`/`confidence`,
  ID записей — таблица очереди, карточка триажа, бейдж).
  - Пойманный и исправленный баг: `font-variation-settings` требует синтаксис
    `"wght" 400, "opsz" 9` (двойные кавычки + запятая) — было написано
    `'wght' 400 'opsz' 9`, браузер тихо отбрасывал невалидное значение без
    единой ошибки в консоли. Ушёл в ложный след (подозревал, что
    framer-motion не прокидывает произвольные CSS-свойства через style-prop);
    подтвердил через `useMotionValueEvent`, что сам `MotionValue` считается
    верно — значит проблема в самой строке. После фикса синтаксиса вернулся к
    чистому декларативному `motion.h2 style={{fontVariationSettings}}`.
- **Диагностика «узкой колонки на десктопе»** (отдельный тикет в эту же
  сессию): измерил реальную рендер-ширину (не только классы) на `/`, `/auth`,
  `/clinic` при 1280px и ~756px — `<main>` использует доступную ширину с
  нормальными полями (1024-1040px), узких 375-480px колонок не нашёл. Бага в
  текущем коде `frontend/` нет. Пользователь сообщил, что баг — на деплое
  (Vercel/Render/Docker) и виден «везде», включая (по его ответу) и без
  старого кеша — вывод не дотянут до конца (URL деплоя не получен, поэтому
  прямую причину на проде не подтвердил). В качестве защитной меры добавил в
  `main.tsx` одноразовую очистку: при загрузке приложение само снимает
  регистрацию любого оставшегося Service Worker (от старой PWA-версии,
  удалённой 2026-06-21) и чистит `caches` — no-op для всех, у кого SW не было.
- **Файлы:** новые — `frontend/src/components/{AnimatedNumber,CursorGlow,
  CustomCursor,TriageMessageCard}.tsx`, `frontend/src/components/three/HeroScene.tsx`,
  `frontend/src/lib/{motion,usePrefersReducedMotion}.ts`; изменены —
  `frontend/index.html`, `frontend/src/index.css`, `frontend/src/main.tsx`,
  `frontend/src/App.tsx`, `frontend/src/components/ModelStatusBadge.tsx`,
  `frontend/src/i18n/translations.ts`, `frontend/src/pages/Landing.tsx`,
  `frontend/src/pages/auth/{LoginPage,RegisterPage}.tsx`,
  `frontend/src/pages/clinic/ClinicQueue.tsx`,
  `frontend/src/pages/patient/{PatientHome,PatientUpload}.tsx`,
  `frontend/package.json` (+`three`, `@react-three/fiber`, `@react-three/drei`).
- **Проверка:** `tsc -b` чистый, `vite build` чистый (3D-сцена — отдельный
  lazy-чанк ~234KB gzip, не в основном бандле); живой прогон в браузере —
  лендинг (3D-сцена, hover на бейдже, roadmap), логин/регистрация,
  upload → реальный AI-триаж → `TriageMessageCard` для всех категорий триажа,
  очередь врача с анимированными счётчиками, шрифты на всех экранах. Узкую
  колонку на деплое подтвердить/исправить не удалось — нужен URL.

---

## 2026-06-24 — Убран эффект «плавающего телефона» в кабинете пациентки

- Отдельный, точно описанный пользователем баг (другой от «узкой колонки» на
  деплое выше): корневой контейнер `PatientLayout.tsx` имел безусловный
  `max-w-[430px]` + `sm:rounded-card/border/shadow-soft-hover` — на десктопе
  кабинет пациентки выглядел как маленький телефон посреди пустого фона. Это
  было осознанное решение прошлой сессии (комментарий в коде явно это
  объяснял), но визуально не то, что нужно проекту.
- **Фикс:** `max-w-[430px]` и device-card стили убраны. Новая структура —
  настоящий адаптивный layout: full-width `<header>` (лого, имя, бейдж,
  logout) сверху на любом экране; нижний tab-bar (5 вкладок) теперь
  `sm:hidden` — виден только на мобильном (`fixed` к низу экрана, а не часть
  flex-колонки внутри карточки, как раньше); на десктопе (`sm:` и шире)
  вместо него — левый sidebar с теми же вкладками, по образцу `ClinicLayout`
  (тот же паттерн активного индикатора через `motion.span layoutId`, та же
  ширина `w-56`/`w-60`). Контент в `<main>` центрируется через `mx-auto
  max-w-3xl`, а не через `items-center` на родителе всей страницы.
  `GradientBackdrop`, `ModelStatusBadge`, все тексты/disclaimer,
  `PageTransition` (вариант `mobile` сохранён, это про анимацию, не про
  ширину), вся auth/RBAC-логика — не тронуты.
- **Файлы:** `frontend/src/layouts/PatientLayout.tsx`.
- **Проверка:** `tsc -b`/`vite build` чистые; в браузере (≥640px) — сайдбар
  `display: flex`, нижний tab-bar `display: none` (подтверждено через
  computed style, не только по классам); скриншоты `/patient` и
  `/patient/upload` — full-width header, sidebar с правильным активным
  пунктом, контент не растянут на всю ширину и не сжат в колонку-телефон;
  `document.documentElement.scrollWidth` не превышает `clientWidth` (нет
  горизонтального скролла). Точный пиксель-by-пиксель снимок на 375px не
  получил — инструмент браузерной автоматизации не позволяет надёжно задать
  произвольный viewport (попытки `--window-size` и `window.resizeTo` не
  сработали); корректность брейкпоинта `sm:` (640px, тот же паттерн, что уже
  используется в `AuthLayout`/`RegisterPage`) подтверждена через сами классы
  и `getComputedStyle`, а не визуально на конкретной ширине.

---

## 2026-06-27 — Диагностика «app-look» на проде: причина = застрявший SW, не код; + полный аудит

- **Жалоба:** на `women-aid.vercel.app/patient` сайт всё ещё выглядит как
  «мобильное приложение посередине», хотя в коммите `9273af9` это уже
  исправлено (PatientLayout переписан на full-width + sidebar). По инструкции
  сначала диагностика деплоя, без правок layout.
- **Фаза 0 — деплой актуален, причина в браузере:**
  - `git HEAD == origin/main == 9273af9`; `max-w-[430px]` в коде нет.
  - Пересобрал локально на HEAD → хэши бандлов **идентичны** тому, что
    реально отдаёт прод (`index-C-VcFBKd.js`, `index-DiB-rqDu.css`,
    `HeroScene-BZj3PLqZ.js`). Vite-хэши детерминированы от содержимого ⇒ код
    на проде = HEAD. Живой прод-бандл **не содержит** `max-w-[430px]` и
    **содержит** оба новых маркера layout (`patient-nav-indicator` —
    sidebar, `patient-tab-indicator` — мобильный bottom-nav).
  - HTTP/CDN-кеш исключён: HTML отдаётся с `cache-control: max-age=0,
    must-revalidate` и ссылается на новый бандл.
  - **Корневая причина:** у пользователей, заходивших на старую PWA-версию
    (PWA жил в репо ~06-19…06-21), в браузере остался зарегистрированный
    Workbox service worker. Он раздаёт старую закешированную оболочку
    (старый layout-«телефон») мимо сети и не может самообновиться — фоновая
    проверка `/sw.js` теперь возвращала HTML (rewrite `/(.*)→/index.html`) с
    неверным MIME, поэтому обновление SW проваливалось и старый worker
    оставался активным навсегда. In-app SW-cleanup из `main.tsx` (добавлен
    2026-06-24) для них не срабатывает: застрявший SW не даёт загрузиться
    новому JS, в котором этот cleanup есть.
- **Фикс — self-destroying service worker:** настоящий валидный JS-worker в
  `frontend/public/sw.js` (и `frontend/public/patient-pwa/sw.js` для старого
  vanilla-PWA по его scope). Когда застрявший браузер делает фоновую проверку
  `/sw.js`, он устанавливает этот worker, который снимает регистрацию, чистит
  все Cache Storage и перезагружает открытые вкладки (`clients.navigate`) →
  пользователь сразу получает текущий сайт, без ручной очистки. Для тех, у
  кого SW не было, файл никогда не регистрируется (приложение не вызывает
  `register`) — это no-op. Vercel отдаёт реальные статические файлы до
  rewrites, поэтому `/sw.js` снова отдаёт worker; добавлены заголовки в
  `vercel.json` (`Content-Type: application/javascript`,
  `Cache-Control: no-cache`), чтобы проверка обновления всегда била в сеть.
  **PatientLayout.tsx НЕ трогал** — он уже корректен.
- **Фаза 1 — регрессия:** backend e2e — auth 20, audit 24, consent 20,
  report 23, register 14, data_protection 28 = **129 passed, 0 failed**.
  `tsc -b` чисто, `npm run build` чисто. Один упавший тест
  (`data_protection`) оказался устаревшим ассертом, а не регрессией:
  проверял `triage_label == "STUB_UNAVAILABLE"`, но upload давно делает
  реальный image-quality-гейт (коммит 01901ca) и для фейк-картинки
  детерминированно возвращает `INSUFFICIENT_QUALITY`. Обновил ассерт на
  реальное значение и усилил проверку безопасности (теперь явно проверяет
  отсутствие и `raw_score`, и `confidence` на анонимной строке).
  **Утечки нет:** модель `AnonymizedAssessmentStat` вообще не имеет колонок
  `raw_score`/`confidence` — правило CLAUDE.md цело, это НЕ был P0.
- **Фаза 2 — статический аудит ширины:** `max-w-[..px]` (фикс. px) **нет
  нигде**. Все `max-w-*` — rem-ширины контента с `mx-auto` (читаемая
  колонка), диалоги (Modal/BottomSheet/Toaster) или `AuthLayout max-w-sm`
  (карточка логина — намеренный стандартный паттерн, не баг «телефона»).
- **Фаза 3 — рантайм-проверка (dev-сервер + браузер):** на 1280px `main` =
  1040–1056px без горизонтального скролла на ВСЕХ маршрутах `/patient*` и
  `/clinic`. Формы: неверный пароль → inline «Неверный логин или пароль.»,
  остаётся на /auth; red-flag симптом «кровотечение после полового акта» →
  рекомендация «обратитесь к врачу» + бейдж Red-flag (POST 200). Очередь
  врача рисует все 4 канонических triage_label + модалка ревью с
  raw_score/confidence/model_status (clinic-only) + PDF + форма решения.
  Консоль чистая (0 error/warn) на каждом маршруте. Разделение бандла
  подтверждено: данные `raw_score`/`confidence` рендерятся только в
  lazy-чанке `ClinicQueue`; в основном бандле — лишь инертные строки-лейблы
  заголовков таблицы из i18n-словаря (не данные).
- **Фаза 4 — gap-анализ (не баги, фичи на будущее):** из 16 продуктовых
  эндпоинтов фронт вызывает 13. Без UI: `GET /monitoring/patients/{id}`
  (детали пациентки), `GET /admin/audit-log` (нет admin-экрана),
  `DELETE /monitoring/patients/{id}/data` (право на забвение, admin-only —
  пока осознанно только через API/скрипт). triage_label/model_status —
  без расхождений.
- **Файлы:** `frontend/public/sw.js` (новый),
  `frontend/public/patient-pwa/sw.js` (новый), `vercel.json` (заголовки для
  sw.js), `tests/e2e_data_protection.py` (устаревший ассерт). PatientLayout
  и прод-код layout — не тронуты.
- **Нужно действие пользователя:** закоммитить и запушить эти файлы, чтобы
  Vercel пересобрал и начал отдавать `/sw.js` как настоящий worker — только
  после этого застрявшие браузеры самоисцелятся. Авто-коммит не делал
  (коммит/пуш только по явной просьбе).
