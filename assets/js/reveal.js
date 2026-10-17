// появление при скролле и счётчики цифр:
// data-reveal="модификатор" — какой класс добавить (по умолчанию reveal--visible), data-reveal-delay="N" — задержка в шагах
(function () {
  'use strict';

  var NS = window.DETAILPRO = window.DETAILPRO || {};

  function canObserve() {
    return 'IntersectionObserver' in window && !NS.reducedMotion();
  }

  NS.initReveal = function () {
    // задержки — для всех, включая строки заголовков внутри наблюдаемого H2
    document.querySelectorAll('[data-reveal-delay]').forEach(function (el) {
      el.style.setProperty('--reveal-delay', el.getAttribute('data-reveal-delay'));
    });

    var items = Array.from(document.querySelectorAll('[data-reveal]'));

    function show(el) {
      el.classList.add(el.getAttribute('data-reveal') || 'reveal--visible');
    }

    if (!canObserve()) {
      items.forEach(show);
      return;
    }

    // карточки слайдера появляются вместе с треком, иначе те, что за правым краем, остались бы скрытыми до свайпа
    var groups = new Map();

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var group = groups.get(entry.target);
        if (group) {
          group.forEach(show);
        } else {
          show(entry.target);
        }
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    items.forEach(function (el) {
      // скрытые через display: none (миниатюры на мобилке) — показываем сразу
      if (!el.getClientRects().length) {
        show(el);
        return;
      }
      var track = el.closest('[data-slider-track]');
      if (track && track !== el) {
        if (!groups.has(track)) {
          groups.set(track, []);
          observer.observe(track);
        }
        groups.get(track).push(el);
        return;
      }
      observer.observe(el);
    });
  };

  // 2500 → «2 500» (неразрывный пробел), 4.9 → «4,9»
  function formatNumber(n, decimals) {
    var parts = n.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join(',');
  }

  // знаков после точки в data-count: «4.9» → 1
  function decimalsOf(el) {
    return (el.getAttribute('data-count').split('.')[1] || '').length;
  }

  NS.initCounters = function () {
    if (!canObserve()) return;

    var DURATION = 1600;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = decimalsOf(el);
      var start = null;

      function frame(time) {
        if (start === null) start = time;
        var progress = Math.min((time - start) / DURATION, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = formatNumber(target * eased, decimals);
        if (progress < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    document.querySelectorAll('[data-count]').forEach(function (el) {
      el.textContent = formatNumber(0, decimalsOf(el));
      observer.observe(el);
    });
  };
})();
