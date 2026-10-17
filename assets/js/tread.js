// след протектора: «ёлочка» из шашек разной длины (SVG-фрагмент) и лёгкий сдвиг ленты при прокрутке
(function () {
  'use strict';

  var NS = window.DETAILPRO = window.DETAILPRO || {};

  function px(styles, name) {
    return parseFloat(styles.getPropertyValue(name)) || 0;
  }

  // шаги шашек случайной длины (как pitch sequencing у настоящих шин), в сумме ровно tile — стык бесшовный
  function pitches(tile, min, max) {
    var list = [];
    var sum = 0;
    var count = Math.max(1, Math.round(tile / ((min + max) / 2)));
    for (var i = 0; i < count; i++) {
      var p = min + Math.random() * (max - min);
      list.push(p);
      sum += p;
    }
    return list.map(function (p) { return p * tile / sum; });
  }

  // фрагмент шириной --tread-tile: наклонные шашки с центральной канавкой, верх и низ зеркальны
  function buildPattern(styles) {
    var tile = px(styles, '--tread-tile');
    var h = px(styles, '--tread-h');
    var thickness = px(styles, '--tread-block');
    var center = px(styles, '--tread-center');
    var slant = px(styles, '--tread-slant');
    var min = px(styles, '--tread-pitch-min');
    var max = px(styles, '--tread-pitch-max');
    var color = styles.getPropertyValue('--color-line-strong').trim();
    if (!tile || !h || !min || !max) return '';

    var top = (h - center) / 2;  // низ верхней шашки
    var bottom = top + center;   // верх нижней шашки
    var paths = '';

    function r(n) {
      return n.toFixed(1);
    }

    function block(x, w) {
      paths +=
        'M' + r(x) + ' 0H' + r(x + w) + 'L' + r(x + w + slant) + ' ' + r(top) + 'H' + r(x + slant) + 'Z' +
        'M' + r(x + slant) + ' ' + r(bottom) + 'H' + r(x + w + slant) + 'L' + r(x + w) + ' ' + r(h) + 'H' + r(x) + 'Z';
    }

    var x = 0;
    pitches(tile, min, max).forEach(function (p) {
      var w = Math.min(thickness, p);
      block(x, w);
      // шашка, вылезшая за край фрагмента, дорисовывается слева — для бесшовного повтора
      if (x + w + slant > tile) block(x - tile, w);
      x += p;
    });

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + tile + '" height="' + h +
      '" preserveAspectRatio="none"><path fill="' + color + '" d="' + paths + '"/></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  NS.initTread = function () {
    var styles = getComputedStyle(document.documentElement);
    var tile = px(styles, '--tread-tile');
    var strips = [];

    document.querySelectorAll('[data-tread]').forEach(function (tread, i) {
      // через один след зеркальный: «ёлочка» и прокрутка в обратную сторону
      if (i % 2 === 0) tread.classList.add('tread--reverse');
      var strip = tread.querySelector('[data-tread-strip]');
      // у каждого разделителя свой рисунок
      var pattern = buildPattern(styles);
      if (pattern) strip.style.setProperty('--tread-pattern', pattern);
      strips.push(strip);
    });

    if (NS.reducedMotion() || !tile) return;

    // сдвигаем только видимые ленты
    var visible = new Set();

    function update() {
      var shift = (window.scrollY * NS.TREAD_SPEED) % tile;
      visible.forEach(function (strip) {
        strip.style.setProperty('--tread-shift', shift.toFixed(1) + 'px');
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visible.add(entry.target);
        } else {
          visible.delete(entry.target);
        }
      });
      update();
    });
    strips.forEach(function (strip) {
      observer.observe(strip);
    });

    window.addEventListener('scroll', NS.throttle(update), { passive: true });
    update();
  };
})();
