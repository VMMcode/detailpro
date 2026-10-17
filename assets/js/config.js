// настройки сайта и общие помощники; подключение формы — см. README, «как подключить форму»
(function () {
  'use strict';

  var NS = window.DETAILPRO = window.DETAILPRO || {};

  NS.FORM_CONFIG = {
    mode: 'demo',     // 'demo' — имитация успеха без отправки (по умолчанию)
                      // 'fetch' — POST FormData на endpoint
                      // 'native' — не перехватываем, форма уходит браузером по action (для CMS/PHP)
    endpoint: '',     // URL вебхука / обработчика
    timeout: 10000,   // мс, после — показываем ошибку
  };

  // «включение фар» в hero: кадры frame-001…080, первый — фары выключены (он же hero-car.webp);
  // count: 0 — анимация выключена, длина прокрутки — токен --hero-scroll
  NS.HERO_SEQUENCE = {
    path: 'assets/img/hero-sequence/frame-{n}.webp',
    count: 80,
    digits: 3,       // frame-001 → 3 цифры в номере
  };

  // сдвиг следа протектора: px ленты на 1px прокрутки; рисунок — токены --tread-*
  NS.TREAD_SPEED = 0.25;

  // прокрутка, после которой у шапки появляется блюр
  NS.HEADER_THRESHOLD = 40;

  NS.reducedMotion = function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  // 1 → «01»
  NS.pad = function (n) {
    return String(n).padStart(2, '0');
  };

  // не чаще раза за кадр — для обработчиков scroll и resize
  NS.throttle = function (fn) {
    var ticking = false;
    return function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        fn();
      });
    };
  };

  // блокировка прокрутки (меню, лайтбокс, попап) с компенсацией ширины скроллбара
  NS.lockScroll = function (lock) {
    var body = document.body;
    if (lock) {
      body.style.setProperty('--scrollbar-comp', window.innerWidth - document.documentElement.clientWidth + 'px');
    } else {
      body.style.removeProperty('--scrollbar-comp');
    }
    body.classList.toggle('page--locked', lock);
  };
})();
