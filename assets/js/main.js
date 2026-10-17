// строки услуг и запуск всех модулей
(function () {
  'use strict';

  var NS = window.DETAILPRO = window.DETAILPRO || {};

  // строки прайса: активное состояние по наведению и по фокусу с клавиатуры
  NS.initServices = function () {
    var canHover = window.matchMedia('(hover: hover)').matches;

    document.querySelectorAll('[data-service-row]').forEach(function (row) {
      function onEnter() { row.classList.add('services__row--active'); }
      function onLeave() { row.classList.remove('services__row--active'); }

      if (canHover) {
        row.addEventListener('mouseenter', onEnter);
        row.addEventListener('mouseleave', onLeave);
      }
      row.addEventListener('focusin', onEnter);
      row.addEventListener('focusout', onLeave);
    });
  };

  [
    'initHeader',
    'initHero',
    'initServices',
    'initTread',
    'initReveal',
    'initCounters',
    'initSliders',
    'initLightbox',
    'initCompare',
    'initFaq',
    'initForm',
  ].forEach(function (name) {
    // сбой одного модуля не должен ломать остальные
    if (typeof NS[name] !== 'function') return;
    try {
      NS[name]();
    } catch (error) {
      console.error('[DETAILPRO] ' + name + ':', error);
    }
  });

  NS.ready = true;
})();
