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
