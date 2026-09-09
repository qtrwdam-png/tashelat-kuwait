// إعدادات تيليجرام أصبحت تُدار خلف الكواليس داخل Netlify Function.
// التوكن و chatId لا يظهران في كود الواجهة إطلاقًا — يقرأهما الخادم من ملفه السري.
window.TELEGRAM_CONFIG = window.TELEGRAM_CONFIG || {};
