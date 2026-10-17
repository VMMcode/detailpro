// faq: открыт один пункт, первый — сразу; без JS все ответы видны (скрытие включает faq--enhanced)
(function () {
  'use strict';

  var NS = window.DETAILPRO = window.DETAILPRO || {};

  NS.initFaq = function () {
    document.querySelectorAll('[data-faq]').forEach(function (root) {
      var items = Array.from(root.querySelectorAll('[data-faq-item]'));

      function trigger(item) {
        return item.querySelector('[data-faq-trigger]');
      }

      function setOpen(item, open) {
        item.classList.toggle('faq__item--open', open);
        trigger(item).setAttribute('aria-expanded', String(open));
      }

      items.forEach(function (item, i) {
        setOpen(item, i === 0);
        trigger(item).addEventListener('click', function () {
          var willOpen = trigger(item).getAttribute('aria-expanded') !== 'true';
          items.forEach(function (other) {
            setOpen(other, other === item && willOpen);
          });
        });
      });

      root.classList.add('faq--enhanced');
    });
  };
})();
