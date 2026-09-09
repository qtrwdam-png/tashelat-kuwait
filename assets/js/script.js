const menuToggle = document.querySelector(".menu-toggle");
const navbar = document.querySelector(".navbar");
const navItems = document.querySelectorAll(".nav-item.has-dropdown");
const footerColumns = document.querySelectorAll(".footer-column");
const heroSlider = document.querySelector(".hero-slider");
const heroDots = document.querySelector(".hero-dots");
const langToggle = document.querySelector(".lang-toggle");
const i18nNodes = document.querySelectorAll("[data-i18n]");
const aboutImage = document.querySelector(".why-media img");
const loanTiles = document.querySelectorAll(".loan-tile");
const headerNavLinks = document.querySelectorAll(".site-header .nav-links a");
const footerLinks = document.querySelectorAll(".site-footer a");
const offerCards = document.querySelectorAll(".offer-card");

const translations = {
  ar: {
    "nav.about": "نبذة عن الشركة",
    "nav.services": "خدمات الشركة",
    "nav.news": "الأخبار والمعلومات المالية",
    "nav.contact": "إتصل بنا",
    "nav.careers": "انضم الى فريقنا",
    "ui.langToggle": "English",
    "ui.home": "الرئيسية",
    "ui.more": "عرض المزيد",
    "ui.applyNow": "قدم قرضك الان",
    "calculator.title": "احسب قرضك",
    "about.title": "لماذا تختارنا ؟",
    "about.copy":
      "مرحباً بكم في شركة التسهيلات، حيث رضاك هو أولويتنا. اكتشف لماذا اختيارنا هو القرار الأفضل لتوفير جميع احتياجاتك الائتمانية.",
    "about.readMore": "قدم على قرضك الآن",
    "about.history": "نبذة تاريخية",
    "about.viceChair": "كلمة نائب رئيس مجلس الإدارة",
    "about.board": "أعضاء مجلس الإدارة",
    "about.team": "الفريق الإداري",
    "about.governance": "حوكمة الشركات",
    "about.aml": "مكافحة غسل الأموال وتمويل الإرهاب",
    "about.protection": "دليل حماية العملاء",
    "offers.label": "لماذا شركة التسهيلات",
    "offers.repayment": "فترة سداد لغاية 7 سنين",
    "offers.noGuarantor": "لا يتطلب كفيل",
    "offers.noMinimumSalary": "من دون حد أدنى على الراتب",
    "loan.cash": "قرض نقدي",
    "loan.auto": "قرض سيارة",
    "loan.housing": "قرض شركات",
    "loan.education": "قرض تعليمي",
    "loan.marine": "معدات بحرية",
    "loan.furniture": "قرض أثاث",
    "loan.electrical": "أجهزة كهربائية",
    "loan.commercial": "قرض تجاري",
    "news.reports": "تقارير مالية",
    "news.meetings": "نتائج الاجتماع",
    "contact.complaints": "شكاوي العملاء",
    "contact.branches": "فروعنا",
    "contact.faq": "الأسئلة المشهورة",
    "careers.form": "نموذج التوظيف",
    "contact.title": "اتصل بنا",
    "social.title": "تواصل معنا",
    "store.title": "حمل التطبيق",
    copyright: "جميع الحقوق محفوظة لشركة التسهيلات التجارية © 2026",
  },
  en: {
    "nav.about": "About the Company",
    "nav.services": "Company Services",
    "nav.news": "News & Financial Information",
    "nav.contact": "Contact Us",
    "nav.careers": "Join Our Team",
    "ui.langToggle": "العربية",
    "ui.home": "Home",
    "ui.more": "Learn More",
    "ui.applyNow": "Apply for your loan now",
    "calculator.title": "Calculate Your Loan",
    "about.title": "Why Choose Us?",
    "about.copy":
      "Welcome to Facilities Company, where your satisfaction comes first. Discover why choosing us is the best decision for all your financing needs.",
    "about.readMore": "Apply for your loan now",
    "about.history": "Company History",
    "about.viceChair": "Vice Chairman's Message",
    "about.board": "Board Members",
    "about.team": "Management Team",
    "about.governance": "Corporate Governance",
    "about.aml": "AML & Counter Terrorist Financing",
    "about.protection": "Customer Protection Guide",
    "offers.label": "Why Facilities Company?",
    "offers.repayment": "Repayment up to 7 years",
    "offers.noGuarantor": "No guarantor required",
    "offers.noMinimumSalary": "No minimum salary required",
    "loan.cash": "Cash Loan",
    "loan.auto": "Car Loan",
    "loan.housing": "Housing Loan",
    "loan.education": "Education Loan",
    "loan.marine": "Marine Equipment",
    "loan.furniture": "Furniture Loan",
    "loan.electrical": "Electrical Appliances",
    "loan.commercial": "Commercial Loan",
    "news.reports": "Financial Reports",
    "news.meetings": "Meeting Results",
    "contact.complaints": "Customer Complaints",
    "contact.branches": "Our Branches",
    "contact.faq": "Popular Questions",
    "careers.form": "Application Form",
    "contact.title": "Contact Us",
    "social.title": "Follow Us",
    "store.title": "Download the App",
    copyright: "All rights reserved to Commercial Facilities Company © 2026",
  },
};

const sliderImages = [
  { src: "./assets/images/slider/1.jpg", arAlt: "الشريحة الرئيسية", enAlt: "Main slide" },
  { src: "./assets/images/slider/2.jpeg", arAlt: "الشريحة الثانية", enAlt: "Second slide" },
  { src: "./assets/images/slider/3.jpeg", arAlt: "الشريحة الثالثة", enAlt: "Third slide" },
  { src: "./assets/images/slider/4.jpeg", arAlt: "الشريحة الرابعة", enAlt: "Fourth slide" },
  { src: "./assets/images/slider/5.jpeg", arAlt: "الشريحة الخامسة", enAlt: "Fifth slide" },
  { src: "./assets/images/slider/6.jpeg", arAlt: "الشريحة السادسة", enAlt: "Sixth slide" },
  { src: "./assets/images/slider/7.jpeg", arAlt: "الشريحة السابعة", enAlt: "Seventh slide" },
];

const storedLocale = localStorage.getItem("siteLocale");
let currentLocale = storedLocale === "en" ? "en" : "ar";

if (menuToggle && navbar) {
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    navbar.classList.toggle("is-open");
  });
}

navItems.forEach((item) => {
  const trigger = item.querySelector("a");

  trigger?.addEventListener("click", (event) => {
    if (window.innerWidth > 900) return;

    event.preventDefault();
    item.classList.toggle("is-open");
  });
});

function syncFooterAccordion() {
  const mobile = window.innerWidth <= 640;

  footerColumns.forEach((column) => {
    column.open = !mobile;
  });
}

function renderHero(locale = currentLocale) {
  if (!heroSlider || !heroDots) return;

  const slidesMarkup = sliderImages
    .map(
      (slide, index) => `
        <article class="hero-slide${index === 0 ? " is-active" : ""}">
          <a href="./step1.html">
            <img
              src="${slide.src}"
              alt="${locale === "en" ? slide.enAlt : slide.arAlt}"
              ${index === 0 ? "" : 'loading="lazy"'}
              decoding="async"
            />
          </a>
        </article>
      `,
    )
    .join("");

  const dotsMarkup = sliderImages
    .map(
      (_, index) => `
        <button
          class="dot${index === 0 ? " is-active" : ""}"
          type="button"
          aria-label="${locale === "en" ? `Slide ${index + 1}` : `الشريحة ${index + 1}`}"
        ></button>
      `,
    )
    .join("");

  heroSlider.innerHTML = slidesMarkup;
  heroDots.innerHTML = dotsMarkup;
}

function applyTranslations(locale) {
  i18nNodes.forEach((node) => {
    const key = node.dataset.i18n;
    const value = translations[locale][key];
    if (value) node.textContent = value;
  });

  if (aboutImage) {
    aboutImage.src =
      locale === "en" ? "./assets/images/section1-cover-en.png" : "./assets/images/section1-cover-ar.png";
  }

  document.documentElement.lang = locale;
  localStorage.setItem("siteLocale", locale);
}

renderHero();
applyTranslations(currentLocale);

let slides = document.querySelectorAll(".hero-slide");
let dots = document.querySelectorAll(".dot");
let currentSlide = 0;

function showSlide(index) {
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === index);
  });

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === index);
  });

  currentSlide = index;
}

function bindDots() {
  dots = document.querySelectorAll(".dot");
  slides = document.querySelectorAll(".hero-slide");

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => showSlide(index));
  });
}

bindDots();

headerNavLinks.forEach((link) => {
  if (link.dataset.disabled === "true") return;
  link.dataset.disabled = "true";
  link.addEventListener("click", (event) => {
    event.preventDefault();
  });
});

footerLinks.forEach((link) => {
  if (link.dataset.disabled === "true") return;
  link.dataset.disabled = "true";
  link.addEventListener("click", (event) => {
    event.preventDefault();
  });
});

loanTiles.forEach((tile) => {
  tile.addEventListener("click", () => {
    const href = tile.dataset.href || "./step1new.html";
    const loanType = tile.dataset.loanType || "general";
    localStorage.setItem("selectedLoanType", loanType);
    window.location.href = href;
  });
});

offerCards.forEach((card) => {
  card.addEventListener("click", () => {
    const href = card.dataset.href || "./step1new.html";
    window.location.href = href;
  });
});

langToggle?.addEventListener("click", () => {
  currentLocale = currentLocale === "ar" ? "en" : "ar";
  applyTranslations(currentLocale);
  renderHero(currentLocale);
  currentSlide = 0;
  bindDots();
  showSlide(currentSlide);

  if (window.innerWidth <= 900 && navbar?.classList.contains("is-open")) {
    navbar.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }
});

if (slides.length > 1) {
  setInterval(() => {
    const next = (currentSlide + 1) % slides.length;
    showSlide(next);
  }, 4500);
}

syncFooterAccordion();
window.addEventListener("resize", syncFooterAccordion);
