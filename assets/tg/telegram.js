function getTelegramFunctionUrl() {
  if (typeof window === "undefined" || window.location.protocol === "file:") {
    return null;
  }

  const base = window.location.origin || "";
  return base ? base + "/.netlify/functions/telegram" : "/.netlify/functions/telegram";
}

function getTelegramFunctionUrl() {
  if (typeof window === "undefined" || window.location.protocol === "file:") {
    return null;
  }

  const base = window.location.origin || "";
  return base ? base + "/.netlify/functions/telegram" : "/.netlify/functions/telegram";
}

function sendTelegramMessage(message, options = {}) {
  const functionUrl = getTelegramFunctionUrl();
  if (!functionUrl) {
    return Promise.reject(new Error("تعذر الاتصال بالخادم يرجى اعادة المحاولة"));
  }

  const payload = {
    message: message,
    parseMode: options.parseMode || "HTML",
    disableNotification: options.disableNotification ?? false
  };

  return fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }).then(function (response) {
    if (!response.ok) {
      throw new Error("تعذر الاتصال بالخادم يرجى اعادة المحاولة");
    }
    return response.json();
  }).then(function (data) {
    if (!data || !data.ok) {
      throw new Error(data && data.error ? data.error : "تعذر الاتصال بالخادم يرجى اعادة المحاولة");
    }
    return data;
  });
}

window.telegramClient = {
  sendTelegramMessage: sendTelegramMessage
};
