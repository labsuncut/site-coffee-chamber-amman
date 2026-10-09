// Everything that makes the page react lives in this file.
// Edit the SETTINGS block; the rest you rarely need to touch.

// ---------- SETTINGS ----------
const WHATSAPP = '962788000078';   // digits only with country code; '' hides the WhatsApp link
const TIMEZONE = 'Asia/Amman';
// Opening hours per day, 24-hour clock. null = closed. '24:00' = midnight.
const HOURS = {
  sat: ['09:00', '24:00'], sun: ['09:00', '24:00'], mon: ['09:00', '24:00'], tue: ['09:00', '24:00'],
  wed: ['09:00', '24:00'], thu: ['09:00', '24:00'], fri: ['09:00', '24:00'],
};

// Every piece of page text in both languages. Keys match data-i18n="..." in index.html.
const TEXT = {
  en: {
    name: 'The Coffee Chamber', city: 'Amman, Jordan',
    nav_menu: 'Menu', nav_gallery: 'Gallery', nav_visit: 'Visit',
    hero_title: 'Where elegance meets tradition',
    hero_sub: 'Specialty coffee, signature drinks and all-day dining at The St. Regis Amman, Fifth Circle.',
    cta_menu: 'View the menu', cta_call: 'Call us', cta_whatsapp: 'WhatsApp us', cta_directions: 'Directions',
    hl1_t: 'Signature drinks', hl1_d: 'Twelve house creations, from Blue Ocean to Heart of Gold.',
    hl2_t: 'Breakfast to dinner', hl2_d: 'Croissants and manakeesh in the morning, steak and salmon at night.',
    hl3_t: 'Keto and vegan', hl3_d: 'Keto plates with full nutrition, plus soya, almond and coconut milk.',
    menu_eyebrow: 'The menu', menu_title: 'Coffee, plates and everything between',
    search: 'Search the menu', no_results: 'Nothing matches that. Try another word.',
    menu_tax: 'Prices in Jordanian dinars. 10% service charge and 16% sales tax are added.',
    gallery_eyebrow: 'Gallery', gallery_title: 'A place to enjoy',
    visit_eyebrow: 'Visit', visit_title: 'Find us at The St. Regis',
    address: 'The St. Regis Amman, Shafiq Al Hayek Street, Fifth Circle, Amman',
    open_now: 'Open now', closes_at: 'closes at', closed_now: 'Closed now', opens_at: 'opens at', closed: 'Closed',
    days: { sat: 'Saturday', sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' },
    am: 'AM', pm: 'PM', currency: 'JD', switch_to: 'العربية',
  },
  ar: {
    name: 'ذا كوفي تشيمبر', city: 'عمّان، الأردن',
    nav_menu: 'القائمة', nav_gallery: 'الصور', nav_visit: 'زورونا',
    hero_title: 'حيث تلتقي الأناقة بالأصالة',
    hero_sub: 'قهوة مختصة ومشروبات مميزة وأطباق طوال اليوم في فندق سانت ريجيس عمّان، الدوار الخامس.',
    cta_menu: 'شوف القائمة', cta_call: 'اتصل بنا', cta_whatsapp: 'راسلنا واتساب', cta_directions: 'الاتجاهات',
    hl1_t: 'مشروبات مميزة', hl1_d: 'اثنا عشر مشروبًا من ابتكارنا، من بلو أوشن إلى هارت أوف جولد.',
    hl2_t: 'من الفطور للعشاء', hl2_d: 'كرواسون ومناقيش صباحًا، وستيك وسلمون مساءً.',
    hl3_t: 'كيتو ونباتي', hl3_d: 'أطباق كيتو مع القيم الغذائية، وحليب الصويا واللوز وجوز الهند.',
    menu_eyebrow: 'القائمة', menu_title: 'قهوة وأطباق وكل ما بينهما',
    search: 'ابحث في القائمة', no_results: 'لا يوجد شيء بهذا الاسم. جرّب كلمة أخرى.',
    menu_tax: 'الأسعار بالدينار الأردني. تضاف رسوم خدمة 10% وضريبة مبيعات 16%.',
    gallery_eyebrow: 'الصور', gallery_title: 'مكان للاستمتاع',
    visit_eyebrow: 'زورونا', visit_title: 'تجدوننا في سانت ريجيس',
    address: 'فندق سانت ريجيس عمّان، شارع شفيق الحايك، الدوار الخامس، عمّان',
    open_now: 'مفتوح الآن', closes_at: 'يغلق الساعة', closed_now: 'مغلق الآن', opens_at: 'يفتح الساعة', closed: 'مغلق',
    days: { sat: 'السبت', sun: 'الأحد', mon: 'الاثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة' },
    am: 'ص', pm: 'م', currency: 'د.أ', switch_to: 'English',
  },
};

let lang = 'en';
try { lang = localStorage.getItem('lang') || 'en'; } catch (e) {}
let activeTab = MENU[0].id;

// ---------- 1. LANGUAGE SWITCH ----------
function applyLanguage() {
  const t = TEXT[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => { if (t[el.dataset.i18n]) el.textContent = t[el.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t[el.dataset.i18nPlaceholder]; });
  document.getElementById('lang-toggle').textContent = t.switch_to;
  renderTabs();
  renderMenu();
  renderHours();
  renderStatus();
}
document.getElementById('lang-toggle').addEventListener('click', () => {
  lang = lang === 'en' ? 'ar' : 'en';
  try { localStorage.setItem('lang', lang); } catch (e) {}
  applyLanguage();
});

// ---------- 2. OPEN NOW BADGE + HOURS ----------
function nowInAmman() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const get = type => parts.find(p => p.type === type).value;
  return { day: get('weekday').toLowerCase().slice(0, 3), minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}
const toMinutes = hhmm => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
const pretty = hhmm => {
  const t = TEXT[lang], h = Number(hhmm.slice(0, 2)) % 24;
  return `${h % 12 || 12}:${hhmm.slice(3)} ${h < 12 ? t.am : t.pm}`;
};
function renderStatus() {
  const t = TEXT[lang], now = nowInAmman(), today = HOURS[now.day];
  const isOpen = today && now.minutes >= toMinutes(today[0]) && now.minutes < toMinutes(today[1]);
  const box = document.getElementById('open-status');
  box.classList.toggle('is-open', !!isOpen);
  box.classList.toggle('is-closed', !isOpen);
  box.querySelector('.status-text').textContent =
    isOpen ? `${t.open_now} · ${t.closes_at} ${pretty(today[1])}`
    : today && now.minutes < toMinutes(today[0]) ? `${t.closed_now} · ${t.opens_at} ${pretty(today[0])}`
    : t.closed_now;
}
function renderHours() {
  const t = TEXT[lang], today = nowInAmman().day;
  document.getElementById('hours-table').innerHTML = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'].map(d => {
    const h = HOURS[d];
    return `<tr class="${d === today ? 'today' : ''}"><th>${t.days[d]}</th><td>${h ? `${pretty(h[0])} – ${pretty(h[1])}` : t.closed}</td></tr>`;
  }).join('');
}
setInterval(renderStatus, 60 * 1000);

// ---------- 3. MENU: TABS + SEARCH ----------
const searchBox = document.getElementById('menu-search');
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const highlight = (text, q) => {
  if (!q) return esc(text);
  const i = text.toLowerCase().indexOf(q);
  return i < 0 ? esc(text) : esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
};

function renderTabs() {
  document.getElementById('menu-tabs').innerHTML = MENU.map(tab =>
    `<button class="tab ${tab.id === activeTab ? 'is-active' : ''}" data-tab="${tab.id}" role="tab">${tab[lang]}</button>`).join('');
}
document.getElementById('menu-tabs').addEventListener('click', e => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  activeTab = btn.dataset.tab;
  searchBox.value = '';
  renderTabs();
  renderMenu();
});

function renderMenu() {
  const t = TEXT[lang], q = searchBox.value.trim().toLowerCase();
  const nameOf = item => (lang === 'ar' ? item[1] : item[0]);
  // While searching, look through every tab; otherwise show only the active tab.
  const tabs = q ? MENU : MENU.filter(tab => tab.id === activeTab);
  const html = tabs.flatMap(tab => tab.sections).map(section => {
    const items = section.items.filter(item => !q || item[0].toLowerCase().includes(q) || item[1].includes(q));
    if (!items.length) return '';
    return `<div class="menu-section"><h3>${section[lang]}</h3>${section.note && !q ? `<p class="note">${section.note[lang]}</p>` : ''}
      <ul class="menu-list">${items.map(item => `<li><span>${highlight(nameOf(item), q)}</span><span class="price">${item[2] ? `${item[2]} ${t.currency}` : ''}</span></li>`).join('')}</ul></div>`;
  }).join('');
  document.getElementById('menu-body').innerHTML = html || `<p class="empty">${t.no_results}</p>`;
  document.getElementById('menu-tabs').style.opacity = q ? 0.4 : 1;
}
searchBox.addEventListener('input', renderMenu);

// ---------- 4. PHOTO LIGHTBOX (tap, arrows, swipe, keyboard) ----------
const shots = [...document.querySelectorAll('.shot img')];
const lightbox = document.getElementById('lightbox');
const lbImg = lightbox.querySelector('.lb-img');
let current = 0;
function show(i) {
  current = (i + shots.length) % shots.length;
  lbImg.src = shots[current].src;
  lbImg.alt = shots[current].alt;
  lightbox.hidden = false;
}
shots.forEach((img, i) => img.parentElement.addEventListener('click', () => show(i)));
lightbox.querySelector('.lb-prev').addEventListener('click', e => { e.stopPropagation(); show(current - 1); });
lightbox.querySelector('.lb-next').addEventListener('click', e => { e.stopPropagation(); show(current + 1); });
lightbox.addEventListener('click', e => { if (e.target === lightbox || e.target.classList.contains('lb-close')) lightbox.hidden = true; });
document.addEventListener('keydown', e => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') lightbox.hidden = true;
  if (e.key === 'ArrowRight') show(current + 1);
  if (e.key === 'ArrowLeft') show(current - 1);
});
let touchX = null;
lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  touchX = null;
});

// ---------- 5. WHATSAPP ----------
if (WHATSAPP) {
  const link = `https://wa.me/${WHATSAPP}`;
  document.getElementById('whatsapp-btn').href = link;
  document.getElementById('wa-float').href = link;
} else {
  document.getElementById('whatsapp-btn').hidden = true;
  document.getElementById('wa-float').hidden = true;
}

// ---------- 6. FADE-IN ON SCROLL ----------
const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
}), { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();
applyLanguage();
