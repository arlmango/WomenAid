/* Patient PWA logic — static, cacheable by the service worker.
 *
 * Scope is deliberately narrow: patient login + a (demo) patient cabinet, the
 * safety messaging, and PWA install/offline handling. The clinician queue lives
 * in the separate desktop frontend (../) and is NOT reachable from here.
 *
 * i18n note (mirrors ../index.html): only UI chrome is translated. The
 * disclaimer and the model-status warning are intentionally NOT in the
 * dictionary and stay Russian-only — clinical/safety wording is not machine-
 * translated without native-speaker review (see CLAUDE.md). KZ strings are a
 * best-effort draft.
 */
(function () {
  'use strict';

  var TRANSLATIONS = {
    ru: {
      appSub: 'Личный кабинет пациентки. Демо. Не является постановкой диагноза.',
      offlineBanner: 'Нет соединения. Доступен только интерфейс кабинета; ' +
        'медицинские данные офлайн не сохраняются и недоступны.',
      healthTitle: 'Статус сервера',
      healthChecking: 'проверяем…',
      healthErr: 'сервер недоступен (подождите первый старт — идёт обучение модели)',
      loginTitle: 'Вход',
      usernameLabel: 'Логин',
      passwordLabel: 'Пароль',
      loginButton: 'Войти',
      loginButtonBusy: 'Вход…',
      logoutButton: 'Выйти',
      welcomeLabel: 'Вы вошли как',
      cabinetTitle: 'Ваш кабинет',
      cabinetStubText: 'Это демонстрационный кабинет пациентки. Разделы со ' +
        'скринингом, симптомами и результатами пока не реализованы.',
      clinicianNotice: 'Это кабинет пациентки. Кабинет врача — отдельное ' +
        'десктоп-приложение.',
      clinicianLink: 'Перейти в кабинет врача',
      installTitle: 'Установить приложение',
      installText: 'Добавьте кабинет на домашний экран телефона, чтобы ' +
        'открывать его как обычное приложение.',
      installButton: 'Добавить на домашний экран',
      iosStep1: 'Нажмите кнопку «Поделиться» в Safari.',
      iosStep2: 'Выберите «На экран Домой».',
      iosStep3: 'Подтвердите — «Добавить».',
      demoAccessTitle: 'Демо-доступ',
      demoPatientLabel: 'Пароль демо-пациенток:',
      modelStatusTitle: 'Статус модели',
      loginErrorInvalid: 'Неверный логин или пароль.',
      loginErrorNetwork: 'Не удалось подключиться к серверу. Проверьте, что backend запущен.',
      loginErrorServer: 'Сервер вернул ошибку входа.'
    },
    kz: {
      // Best-effort UI-chrome draft, not reviewed by a native speaker.
      appSub: 'Пациенттің жеке кабинеті. Демо. Диагноз қою емес.',
      offlineBanner: 'Байланыс жоқ. Тек кабинет интерфейсі қолжетімді; ' +
        'медициналық деректер офлайн сақталмайды және қолжетімсіз.',
      healthTitle: 'Сервер күйі',
      healthChecking: 'тексеріп жатырмыз…',
      healthErr: 'сервер қолжетімсіз (бірінші іске қосылуды күтіңіз — модель оқытылып жатыр)',
      loginTitle: 'Кіру',
      usernameLabel: 'Пайдаланушы аты',
      passwordLabel: 'Құпия сөз',
      loginButton: 'Кіру',
      loginButtonBusy: 'Кіріп жатыр…',
      logoutButton: 'Шығу',
      welcomeLabel: 'Сіз мына атпен кірдіңіз:',
      cabinetTitle: 'Сіздің кабинетіңіз',
      cabinetStubText: 'Бұл пациенттің демо-кабинеті. Скрининг, симптомдар және ' +
        'нәтижелер бөлімдері әзірге іске асырылмаған.',
      clinicianNotice: 'Бұл пациент кабинеті. Дәрігер кабинеті — бөлек ' +
        'десктоп-қосымша.',
      clinicianLink: 'Дәрігер кабинетіне өту',
      installTitle: 'Қосымшаны орнату',
      installText: 'Кабинетті телефонның негізгі экранына қосып, оны әдеттегі ' +
        'қосымша ретінде ашыңыз.',
      installButton: 'Негізгі экранға қосу',
      iosStep1: 'Safari-де «Бөлісу» түймесін басыңыз.',
      iosStep2: '«Негізгі экранға» таңдаңыз.',
      iosStep3: 'Растаңыз — «Қосу».',
      demoAccessTitle: 'Демо-қатынас',
      demoPatientLabel: 'Демо-пациенттердің құпия сөзі:',
      modelStatusTitle: 'Модель күйі',
      loginErrorInvalid: 'Логин немесе құпия сөз қате.',
      loginErrorNetwork: 'Серверге қосылу мүмкін болмады. Backend іске қосылғанын тексеріңіз.',
      loginErrorServer: 'Сервер кіру кезінде қате қайтарды.'
    }
  };

  var currentLang = localStorage.getItem('womenaid_lang') || 'ru';

  function $(id) { return document.getElementById(id); }

  function t(key) {
    return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) ||
      TRANSLATIONS.ru[key] || key;
  }

  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem('womenaid_lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    $('lang-ru').classList.toggle('active', lang === 'ru');
    $('lang-kz').classList.toggle('active', lang === 'kz');
    var healthEl = $('health');
    if (healthEl.dataset.state === 'err') healthEl.textContent = t('healthErr');
  }

  // --- health check (never cached by the service worker) ---
  async function checkHealth() {
    var el = $('health');
    try {
      var res = await fetch('/health', { cache: 'no-store' });
      if (!res.ok) throw new Error('bad status');
      var data = await res.json();
      el.textContent = 'OK — ' + JSON.stringify(data);
      el.className = 'ok';
      delete el.dataset.state;
    } catch (err) {
      el.textContent = t('healthErr');
      el.className = 'err';
      el.dataset.state = 'err';
    }
  }

  // --- session helpers (token in sessionStorage: never persisted to disk) ---
  function decodeJwt(token) {
    try {
      var payload = token.split('.')[1];
      var json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      var claims = JSON.parse(json);
      if (claims.exp && Date.now() / 1000 > claims.exp) return null;
      return claims;
    } catch (err) {
      return null;
    }
  }

  function getSession() {
    var token = sessionStorage.getItem('womenaid_token');
    if (!token) return null;
    var claims = decodeJwt(token);
    if (!claims) { sessionStorage.removeItem('womenaid_token'); return null; }
    return { token: token, username: claims.sub, role: claims.role, patientId: claims.patient_id };
  }

  function showLoginError(message) {
    var el = $('login-error');
    el.textContent = message;
    el.hidden = false;
  }
  function clearLoginError() {
    var el = $('login-error');
    el.hidden = true;
    el.textContent = '';
  }
  function setLoginBusy(busy) {
    var btn = $('login-submit');
    btn.disabled = busy;
    btn.textContent = busy ? t('loginButtonBusy') : t('loginButton');
  }

  function renderSession(session) {
    $('login-card').hidden = true;
    $('session-card').hidden = false;
    $('session-user').textContent = session.username;

    var isPatient = session.role === 'patient';
    $('patient-card').hidden = !isPatient;
    $('clinician-card').hidden = isPatient;
  }

  function renderLoggedOut() {
    $('login-card').hidden = false;
    $('session-card').hidden = true;
    $('patient-card').hidden = true;
    $('clinician-card').hidden = true;
  }

  function doLogout() {
    sessionStorage.removeItem('womenaid_token');
    renderLoggedOut();
  }

  async function handleLogin(e) {
    e.preventDefault();
    clearLoginError();
    setLoginBusy(true);
    try {
      var body = new URLSearchParams({
        username: $('login-username').value,
        password: $('login-password').value
      });
      var res;
      try {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body,
          cache: 'no-store'
        });
      } catch (networkErr) {
        throw new Error(t('loginErrorNetwork'));
      }
      if (res.status === 401) throw new Error(t('loginErrorInvalid'));
      if (!res.ok) throw new Error(t('loginErrorServer'));
      var data = await res.json();
      sessionStorage.setItem('womenaid_token', data.access_token);
      var session = getSession();
      if (!session) throw new Error(t('loginErrorServer'));
      $('login-username').value = '';
      $('login-password').value = '';
      renderSession(session);
    } catch (err) {
      showLoginError(err.message);
    } finally {
      setLoginBusy(false);
    }
  }

  // --- offline banner ---
  function updateOnlineState() {
    $('offline-banner').hidden = navigator.onLine;
  }

  // --- install / add-to-home-screen ---
  var deferredPrompt = null;

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }
  function isIos() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
  }

  function setupInstall() {
    var card = $('install-card');
    if (isStandalone()) { card.hidden = true; return; }   // already installed

    // Android/desktop Chrome: capture the prompt, reveal a real install button.
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      card.hidden = false;
      $('install-btn').hidden = false;
    });
    $('install-btn').addEventListener('click', async function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      $('install-btn').hidden = true;
    });
    window.addEventListener('appinstalled', function () { card.hidden = true; });

    // iOS Safari has no install prompt API — show manual steps instead.
    if (isIos()) {
      card.hidden = false;
      $('ios-steps').hidden = false;
    }
  }

  // --- service worker (caches the static shell only; see sw.js) ---
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (err) {
        // Non-fatal: app still works online without the SW.
        console.warn('SW registration failed:', err);
      });
    });
  }

  // --- wire up ---
  $('lang-ru').addEventListener('click', function () { applyLang('ru'); });
  $('lang-kz').addEventListener('click', function () { applyLang('kz'); });
  $('logout-btn').addEventListener('click', doLogout);
  $('login-form').addEventListener('submit', handleLogin);
  window.addEventListener('online', updateOnlineState);
  window.addEventListener('offline', updateOnlineState);

  registerServiceWorker();
  applyLang(currentLang);
  updateOnlineState();
  setupInstall();
  checkHealth();
  var existing = getSession();
  if (existing) renderSession(existing); else renderLoggedOut();
})();
