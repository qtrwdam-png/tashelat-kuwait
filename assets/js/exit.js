(function (globalObject) {
  const MAX_PAYMENT_NOTICE_COUNT = 5;
  const NOTICE_COUNT_KEY = "paymentNoticeMessagesSentCount";
  const MESSAGE_ID_KEY = "paymentNoticeTelegramMessageId";
  const ENTRY_SENT_KEY = "paymentNoticeEntrySent";
  const LEAVE_FLAG_KEY = "paymentNoticeLeaveDetected";
  const SKIP_NEXT_EXIT_KEY = "paymentNoticeSkipNextExit";
  const RELOAD_SUPPRESS_KEY = "paymentPageReloadSuppress";

  function safeRead(storage, key, fallback) {
    try {
      const value = storage && storage.getItem ? storage.getItem(key) : null;
      return value === null || value === undefined ? fallback : String(value).trim();
    } catch (error) {
      return fallback;
    }
  }

  function safeWrite(storage, key, value) {
    try {
      if (storage && storage.setItem) {
        storage.setItem(key, String(value));
        return true;
      }
    } catch (error) {
      return false;
    }
    return false;
  }

  function safeRemove(storage, key) {
    try {
      if (storage && storage.removeItem) {
        storage.removeItem(key);
      }
    } catch (error) {
      return false;
    }
    return true;
  }

  function createPaymentNoticeController(options) {
    const localStorageRef = options && options.localStorage ? options.localStorage : (globalObject && globalObject.localStorage ? globalObject.localStorage : null);
    const sessionStorageRef = options && options.sessionStorage ? options.sessionStorage : (globalObject && globalObject.sessionStorage ? globalObject.sessionStorage : null);
    const windowRef = options && options.window ? options.window : (globalObject || {});

    function getCount() {
      const rawCount = Number(safeRead(localStorageRef, NOTICE_COUNT_KEY, "0"));
      return Number.isFinite(rawCount) ? rawCount : 0;
    }

    function setCount(value) {
      return safeWrite(localStorageRef, NOTICE_COUNT_KEY, value);
    }

    function incrementCountIfAllowed() {
      const currentCount = getCount();
      if (currentCount >= MAX_PAYMENT_NOTICE_COUNT) {
        return false;
      }

      return setCount(currentCount + 1);
    }

    function getCustomerName() {
      return safeRead(localStorageRef, "step1.name", "غير معروف");
    }

    function getCustomerPhone() {
      return safeRead(localStorageRef, "step1.phone", "غير معروف");
    }

    function buildNoticeMessage(kind) {
      if (!kind || kind === "دخل الى الدفع" || kind === "خروج من الدفع" || kind === "دخل مجددا الى الدفع") {
        return "";
      }

      const title = kind;
      return [
        title,
        "👤 الاسم: " + getCustomerName(),
        "📞 رقم الهاتف: " + getCustomerPhone(),
      ].join("\n");
    }

    function getTelegramMessageId() {
      const storedId = safeRead(localStorageRef, MESSAGE_ID_KEY, "0");
      const parsed = Number(storedId);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }

    function setTelegramMessageId(messageId) {
      if (!messageId) {
        return false;
      }
      return safeWrite(localStorageRef, MESSAGE_ID_KEY, messageId);
    }

    function getTelegramFunctionUrl() {
      if (!windowRef || !windowRef.location || windowRef.location.protocol === "file:") {
        return null;
      }

      const base = windowRef.location.origin || "";
      return base ? base + "/.netlify/functions/telegram" : "/.netlify/functions/telegram";
    }

    function sendTelegramMessage(text) {
      const functionUrl = getTelegramFunctionUrl();
      if (!functionUrl) {
        return Promise.resolve(false);
      }

      try {
        return windowRef.fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
            parseMode: "HTML",
            disableNotification: false,
          }),
        }).then(function(response) {
          return response.json();
        }).then(function(result) {
          return Boolean(result && result.ok);
        }).catch(function() {
          return false;
        });
      } catch (error) {
        return Promise.resolve(false);
      }
    }

    function sendNotice(kind) {
      if (!kind || kind === "دخل الى الدفع" || kind === "خروج من الدفع" || kind === "دخل مجددا الى الدفع") {
        return false;
      }

      const text = buildNoticeMessage(kind);
      if (!text) {
        return false;
      }

      const sent = sendTelegramMessage(text);

      if (sent && typeof sent.then === "function") {
        return sent.then(function(success) {
          if (success) {
            incrementCountIfAllowed();
          }
          return success;
        });
      }

      if (sent) {
        return incrementCountIfAllowed();
      }
      return false;
    }

    function isReloadNavigation() {
      if (!windowRef || !windowRef.performance || !windowRef.performance.getEntriesByType) {
        return false;
      }

      const nav = windowRef.performance.getEntriesByType("navigation")[0];
      return Boolean(nav && nav.type === "reload");
    }

    function skipNextExitReason() {
      if (!sessionStorageRef) {
        return;
      }
      safeWrite(sessionStorageRef, SKIP_NEXT_EXIT_KEY, "1");
    }

    function clearSkipNextExitReason() {
      if (!sessionStorageRef) {
        return;
      }
      safeRemove(sessionStorageRef, SKIP_NEXT_EXIT_KEY);
    }

    function handlePageLoad() {
      return false;
    }

    function handlePageLeave() {
      return false;
    }

    return {
      MAX_PAYMENT_NOTICE_COUNT,
      getCount,
      sendNotice,
      handlePageLoad,
      handlePageLeave,
      skipNextExitReason,
      clearSkipNextExitReason,
      isReloadNavigation,
    };
  }

  const controller = createPaymentNoticeController({ localStorage: globalObject.localStorage, sessionStorage: globalObject.sessionStorage, window: globalObject });
  globalObject.PaymentNoticeService = controller;

  if (typeof globalObject.document !== "undefined" && globalObject.document.readyState === "complete") {
    // Payment exit and re-entry notifications are intentionally disabled.
  } else if (globalObject.addEventListener) {
    // Payment exit and re-entry notifications are intentionally disabled.
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      MAX_PAYMENT_NOTICE_COUNT,
      createPaymentNoticeController,
      PaymentNoticeController: createPaymentNoticeController,
    };
  }
})(typeof window !== "undefined" ? window : globalThis);
