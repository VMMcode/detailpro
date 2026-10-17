// слайдер на scroll-snap: [data-slider] > [data-slider-track] > [data-slider-item],
// кнопки [data-slider-prev] / [data-slider-next], счётчик [data-slider-counter]
(function () {
  'use strict';

  var NS = window.DETAILPRO = window.DETAILPRO || {};

  function initSlider(root) {
    var track = root.querySelector('[data-slider-track]');
    var items = Array.from(track.querySelectorAll('[data-slider-item]'));
    var prev = root.querySelector('[data-slider-prev]');
    var next = root.querySelector('[data-slider-next]');
    var counter = root.querySelector('[data-slider-counter]');
    var current = -1;

    function go(direction) {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({
        left: direction * (items[0].getBoundingClientRect().width + gap),
        behavior: NS.reducedMotion() ? 'auto' : 'smooth',
      });
    }

    // текущий слайд — тот, чей левый край ближе всего к началу трека
    function findCurrent(max) {
      if (track.scrollLeft >= max - 1) return items.length - 1;
      var origin = track.getBoundingClientRect().left + (parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0);
      var best = 0;
      var bestDistance = Infinity;
      items.forEach(function (item, i) {
        var distance = Math.abs(item.getBoundingClientRect().left - origin);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      return best;
    }

    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var scrollable = max > 1;

      prev.disabled = !scrollable || track.scrollLeft <= 1;
      next.disabled = !scrollable || track.scrollLeft >= max - 1;

      // трек фокусируемый, только когда реально прокручивается (стрелки клавиатуры)
      if (scrollable) {
        track.setAttribute('tabindex', '0');
      } else {
        track.removeAttribute('tabindex');
      }

      var index = scrollable ? findCurrent(max) : 0;
      if (index !== current) {
        current = index;
        counter.textContent = NS.pad(index + 1) + ' / ' + NS.pad(items.length);
      }
    }

    var onChange = NS.throttle(update);

    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    track.addEventListener('scroll', onChange, { passive: true });
    window.addEventListener('resize', onChange);

    update();
  }

  NS.initSliders = function () {
    document.querySelectorAll('[data-slider]').forEach(initSlider);
  };
})();
