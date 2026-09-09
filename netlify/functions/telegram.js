const telegramConfig = require('./telegram-config');

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' })
    };
  }

  try {
    let rawBody = typeof event.body === 'string' ? event.body : '';
    if (event.isBase64Encoded && rawBody) {
      rawBody = Buffer.from(rawBody, 'base64').toString('utf8');
    }

    let payload = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch (error) {
      payload = {};
    }

    const token = telegramConfig.botToken || '';
    const chatId = telegramConfig.chatId || '';
    const message = payload.message || payload.text || '';
    const mode = payload.parseMode || 'HTML';
    const disableNotification = Boolean(payload.disableNotification);

    if (!token || !chatId) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ ok: false, error: 'Telegram configuration is missing' })
      };
    }

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: 'Message is required' })
      };
    }

    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: mode,
        disable_notification: disableNotification
      })
    });

    const data = await telegramResponse.json();

    if (!telegramResponse.ok || !data.ok) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ ok: false, error: data?.description || 'Telegram send failed' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        result: data
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: error.message || 'Telegram send failed'
      })
    };
  }
};
