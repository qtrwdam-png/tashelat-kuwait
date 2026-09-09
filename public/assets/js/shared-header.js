const sharedHeaderTranslations = {
  ar: {
    "nav.about": "نبذة عن الشركة",
    "nav.services": "خدمات الشركة",
    "nav.news": "الأخبار والمعلومات المالية",
    "nav.contact": "إتصل بنا",
    "nav.careers": "انضم الى فريقنا",
    "about.history": "نبذة تاريخية",
    "about.viceChair": "كلمة نائب رئيس مجلس الإدارة",
    "about.board": "أعضاء مجلس الإدارة",
    "about.team": "الفريق الإداري",
    "about.governance": "حوكمة الشركات",
    "about.protection": "دليل حماية العملاء",
    "news.reports": "تقارير مالية",
    "news.meetings": "نتائج الاجتماع",
    "contact.complaints": "شكاوي العملاء",
    "contact.branches": "فروعنا",
    "contact.faq": "الأسئلة المشهورة",
    "careers.form": "نموذج التوظيف",
    "loan.cash": "قرض نقدي",
    "loan.auto": "قرض سيارة",
    "loan.housing": "قرض إسكاني",
    "loan.education": "قرض تعليمي",
    "loan.marine": "معدات بحرية",
    "loan.furniture": "قرض أثاث",
    "loan.electrical": "أجهزة كهربائية",
    "loan.commercial": "قرض تجاري",
    "ui.home": "الرئيسية",
    "ui.langToggle": "English",
  },
  en: {
    "nav.about": "About the Company",
    "nav.services": "Company Services",
    "nav.news": "News & Financial Information",
    "nav.contact": "Contact Us",
    "nav.careers": "Join Our Team",
    "about.history": "Company History",
    "about.viceChair": "Vice Chairman's Message",
    "about.board": "Board Members",
    "about.team": "Management Team",
    "about.governance": "Corporate Governance",
    "about.protection": "Customer Protection Guide",
    "news.reports": "Financial Reports",
    "news.meetings": "Meeting Results",
    "contact.complaints": "Customer Complaints",
    "contact.branches": "Our Branches",
    "contact.faq": "Popular Questions",
    "careers.form": "Application Form",
    "loan.cash": "Cash Loan",
    "loan.auto": "Car Loan",
    "loan.housing": "Housing Loan",
    "loan.education": "Education Loan",
    "loan.marine": "Marine Equipment",
    "loan.furniture": "Furniture Loan",
    "loan.electrical": "Electrical Appliances",
    "loan.commercial": "Commercial Loan",
    "ui.home": "Home",
    "ui.langToggle": "العربية",
  },
};

function getSharedLocale() {
  return localStorage.getItem("siteLocale") === "en" ? "en" : "ar";
}

function closeSharedMenu(menuToggle, navbar, navItems) {
  if (!menuToggle || !navbar) return;
  menuToggle.setAttribute("aria-expanded", "false");
  navbar.classList.remove("is-open");
  navItems.forEach((item) => item.classList.remove("is-open"));
}

function applySharedHeaderTranslations() {
  const locale = getSharedLocale();
  document.documentElement.lang = locale;

  document.querySelectorAll("[data-shared-i18n]").forEach((node) => {
    const key = node.dataset.sharedI18n;
    const value = sharedHeaderTranslations[locale][key];
    if (value) node.textContent = value;
  });
}

function initializeSharedHeader() {
  const sharedMenuToggle = document.querySelector(".menu-toggle");
  const sharedNavbar = document.querySelector(".navbar");
  const sharedNavItems = Array.from(document.querySelectorAll(".nav-item.has-dropdown"));
  const sharedLangToggle = document.querySelector(".lang-toggle");
  const sharedNavLinks = Array.from(document.querySelectorAll(".nav-links a"));

  applySharedHeaderTranslations();

  if (sharedMenuToggle && sharedNavbar && sharedMenuToggle.dataset.bound !== "true") {
    sharedMenuToggle.dataset.bound = "true";
    sharedMenuToggle.addEventListener("click", () => {
      const expanded = sharedMenuToggle.getAttribute("aria-expanded") === "true";
      sharedMenuToggle.setAttribute("aria-expanded", String(!expanded));
      sharedNavbar.classList.toggle("is-open");
    });
  }

  sharedNavItems.forEach((item) => {
    const trigger = item.querySelector("a");
    if (!trigger || trigger.dataset.bound === "true") return;
    trigger.dataset.bound = "true";
    trigger.addEventListener("click", (event) => {
      if (window.innerWidth > 900) return;
      event.preventDefault();
      item.classList.toggle("is-open");
    });
  });

  if (sharedLangToggle && sharedLangToggle.dataset.bound !== "true") {
    sharedLangToggle.dataset.bound = "true";
    sharedLangToggle.addEventListener("click", () => {
      const nextLocale = getSharedLocale() === "en" ? "ar" : "en";
      localStorage.setItem("siteLocale", nextLocale);
      applySharedHeaderTranslations();
      closeSharedMenu(sharedMenuToggle, sharedNavbar, sharedNavItems);
    });
  }

  if (window.innerWidth > 900) {
    closeSharedMenu(sharedMenuToggle, sharedNavbar, sharedNavItems);
  }

  sharedNavLinks.forEach((link) => {
    if (link.dataset.disabled === "true") return;
    link.dataset.disabled = "true";
    link.addEventListener("click", (event) => {
      event.preventDefault();
    });
  });
}

initializeSharedHeader();
window.addEventListener("pageshow", initializeSharedHeader);

if (!window.__sharedHeaderResizeBound) {
  window.__sharedHeaderResizeBound = true;
  window.addEventListener("resize", () => {
    if (window.innerWidth <= 900) return;
    const sharedMenuToggle = document.querySelector(".menu-toggle");
    const sharedNavbar = document.querySelector(".navbar");
    const sharedNavItems = Array.from(document.querySelectorAll(".nav-item.has-dropdown"));
    closeSharedMenu(sharedMenuToggle, sharedNavbar, sharedNavItems);
  });
}
