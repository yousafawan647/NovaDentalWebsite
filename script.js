/* =====================================================
   NOVA DENTAL STUDIO: script.js
   1 Settings · 2 Helpers · 3 Navbar · 4 Scroll reveal
   5 Counters · 6 Testimonial slider · 7 Booking form
   8 WhatsApp links · 9 Start everything
   ===================================================== */
'use strict';

/* ---------- 1. SETTINGS (edit these!) ---------- */
const CONFIG = {
  // Use the international format with NO "+" and NO spaces. This is a fake demo number.
  whatsappNumber: '923000000000',
  clinicName: 'Nova Dental Studio',
  autoplayMs: 6000          // testimonial slider speed in milliseconds
};

/* ---------- 2. HELPERS ---------- */
const qs  = (selector, parent = document) => parent.querySelector(selector);
const qsa = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 3. NAVBAR ---------- */
function initNavbar() {
  const navbar = qs('#navbar');
  const toggle = qs('#nav-toggle');
  const menu = qs('#nav-menu');
  if (!navbar || !toggle || !menu) return;

  // Add a shadow once the page scrolls
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Open / close the mobile menu
  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
  qsa('a', menu).forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', (e) => { if (!navbar.contains(e.target)) setOpen(false); });

  // Highlight the nav link of the section currently on screen
  const links = qsa('.nav-link');
  const sections = links.map((l) => qs(l.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => observer.observe(s));
  }
}

/* ---------- 4. SCROLL REVEAL ANIMATION ---------- */
function initReveal() {
  const items = qsa('.reveal');
  if (!items.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('visible');
      obs.unobserve(el);

      // Once the reveal is finished, remove the helper classes so that
      // hover effects on cards are not slowed down by the reveal delay.
      const delay = parseInt(el.dataset.delay || '0', 10);
      setTimeout(() => {
        el.classList.remove('reveal', 'visible');
        el.style.transitionDelay = '';
      }, delay + 1000);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  items.forEach((el) => {
    if (el.dataset.delay) el.style.transitionDelay = el.dataset.delay + 'ms';
    observer.observe(el);
  });
}

/* ---------- 5. NUMBER COUNTERS ---------- */
function initCounters() {
  const counters = qsa('.counter');
  if (!counters.length) return;

  const format = (value, decimals) =>
    decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US');

  const run = (el) => {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';

    if (prefersReducedMotion) {
      el.textContent = format(target, decimals) + suffix;
      return;
    }

    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);        // starts fast, ends slow
      el.textContent = format(target * eased, decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) { counters.forEach(run); return; }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { run(entry.target); obs.unobserve(entry.target); }
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => observer.observe(c));
}

/* ---------- 6. TESTIMONIAL SLIDER ---------- */
function initCarousel() {
  const carousel = qs('#carousel');
  const track = qs('#carousel-track');
  const prev = qs('#prev');
  const next = qs('#next');
  const dotsWrap = qs('#dots');
  if (!carousel || !track || !prev || !next || !dotsWrap) return;

  const cards = qsa('.t-card', track);
  let index = 0;
  let perView = getPerView();
  let timer = null;

  // These breakpoints must match the CSS (700px and 1024px)
  function getPerView() {
    const w = window.innerWidth;
    return w >= 1024 ? 3 : w >= 700 ? 2 : 1;
  }
  const maxIndex = () => Math.max(0, cards.length - perView);

  function buildDots() {
    dotsWrap.innerHTML = '';
    for (let i = 0; i <= maxIndex(); i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot';
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      dot.addEventListener('click', () => { goTo(i); restart(); });
      dotsWrap.appendChild(dot);
    }
  }

  function update() {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = cards[0].offsetWidth + gap;
    track.style.transform = 'translateX(' + (-index * step) + 'px)';
    qsa('.dot', dotsWrap).forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
    prev.disabled = index === 0;
    next.disabled = index >= maxIndex();
  }

  function goTo(i) {
    index = Math.min(Math.max(i, 0), maxIndex());
    update();
  }
  const advance = () => goTo(index >= maxIndex() ? 0 : index + 1);

  function start() {
    if (prefersReducedMotion) return;
    stop();
    timer = setInterval(advance, CONFIG.autoplayMs);
  }
  function stop() { clearInterval(timer); }
  function restart() { stop(); start(); }

  prev.addEventListener('click', () => { goTo(index - 1); restart(); });
  next.addEventListener('click', () => { goTo(index + 1); restart(); });

  // Pause while the visitor is hovering or focusing inside the slider
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', start);

  // Swipe on touch screens
  let touchStartX = 0;
  carousel.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; stop(); }, { passive: true });
  carousel.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) goTo(dx < 0 ? index + 1 : index - 1);
    start();
  }, { passive: true });

  // Rebuild when the screen size changes
  window.addEventListener('resize', () => {
    const newPerView = getPerView();
    if (newPerView !== perView) { perView = newPerView; index = Math.min(index, maxIndex()); buildDots(); }
    update();
  });

  buildDots();
  update();
  start();
}

/* ---------- 7. BOOKING FORM ---------- */
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function parseISODate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function initBooking() {
  const form = qs('#booking-form');
  if (!form) return;

  const success = qs('#form-success');
  const summary = qs('#success-summary');
  const waButton = qs('#whatsapp-confirm');
  const againButton = qs('#book-another');
  const dateInput = qs('#date');
  const serviceSelect = qs('#service');

  // Block past dates in the date picker
  dateInput.min = todayISO();

  // One validation rule per field. Return '' if OK, or an error message.
  const rules = {
    name(value) {
      const v = value.trim();
      if (v.length < 2) return 'Please enter your full name.';
      if (!/^[\p{L}\s.'-]+$/u.test(v)) return 'Names can only contain letters and spaces.';
      return '';
    },
    phone(value) {
      const v = value.trim();
      const digits = v.replace(/\D/g, '');
      if (!v) return 'Please enter your phone number.';
      if (!/^[+\d\s()-]+$/.test(v) || digits.length < 10 || digits.length > 13) {
        return 'Enter a valid phone number (10–13 digits).';
      }
      return '';
    },
    service(value) {
      return value ? '' : 'Please choose a service.';
    },
    date(value) {
      if (!value) return 'Please choose a preferred date.';
      const chosen = parseISODate(value);
      const today = parseISODate(todayISO());
      if (chosen < today) return 'Please choose today or a future date.';
      if (chosen.getDay() === 0) return 'We are closed on Sundays. Please pick another day.';
      return '';
    }
  };

  function validateField(id) {
    const input = qs('#' + id);
    const message = rules[id](input.value);
    const wrapper = input.closest('.field');
    qs('#' + id + '-error').textContent = message;
    wrapper.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  // Check a field when the visitor leaves it, and clear errors as they fix them
  Object.keys(rules).forEach((id) => {
    const input = qs('#' + id);
    input.addEventListener('blur', () => validateField(id));
    input.addEventListener('input', () => { if (input.closest('.field').classList.contains('has-error')) validateField(id); });
    input.addEventListener('change', () => validateField(id));
  });

  function addSummaryRow(label, value) {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value;         // textContent keeps user text safe
    row.append(dt, dd);
    summary.appendChild(row);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const results = Object.keys(rules).map((id) => ({ id, ok: validateField(id) }));
    const firstInvalid = results.find((r) => !r.ok);
    if (firstInvalid) { qs('#' + firstInvalid.id).focus(); return; }

    const name = qs('#name').value.trim();
    const phone = qs('#phone').value.trim();
    const service = serviceSelect.options[serviceSelect.selectedIndex].text;
    const prettyDate = parseISODate(dateInput.value).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const notes = qs('#notes').value.trim();

    summary.innerHTML = '';
    addSummaryRow('Name', name);
    addSummaryRow('Phone', phone);
    addSummaryRow('Service', service);
    addSummaryRow('Preferred date', prettyDate);

    const message =
      'Hello ' + CONFIG.clinicName + ', I would like to book an appointment.\n' +
      'Name: ' + name + '\n' +
      'Phone: ' + phone + '\n' +
      'Service: ' + service + '\n' +
      'Preferred date: ' + prettyDate +
      (notes ? '\nNotes: ' + notes : '');
    waButton.href = 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(message);

    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
  });

  function resetForm() {
    form.reset();
    qsa('.field', form).forEach((f) => f.classList.remove('has-error'));
    qsa('.error', form).forEach((e) => { e.textContent = ''; });
    success.hidden = true;
    form.hidden = false;
  }
  againButton.addEventListener('click', resetForm);

  // Clicking "Book this service" on a card pre-selects it in the form
  qsa('[data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      if (!success.hidden) resetForm();
      serviceSelect.value = link.dataset.service;
      validateField('service');
    });
  });
}

/* ---------- 8. WHATSAPP LINKS ---------- */
function initWhatsApp() {
  qsa('[data-whatsapp]').forEach((link) => {
    const text = link.dataset.message || 'Hello ' + CONFIG.clinicName + ', I would like to know more about your services.';
    link.href = 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(text);
  });
}

/* ---------- 9. START EVERYTHING ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initReveal();
  initCounters();
  initCarousel();
  initBooking();
  initWhatsApp();

  const year = qs('#year');
  if (year) year.textContent = new Date().getFullYear();
});