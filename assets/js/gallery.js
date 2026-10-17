// галерея: лайтбокс на <dialog> и слайдер «до/после»; без JS ссылки карточек просто открывают фото
(function () {
  'use strict';

  var NS = window.DETAILPRO = window.DETAILPRO || {};
  var SWIPE_MIN = 50;

  NS.initLightbox = function () {
    var dialog = document.querySelector('[data-lightbox]');
    if (typeof dialog.showModal !== 'function') return;

    var links = Array.from(document.querySelectorAll('[data-lightbox-item]'));
    var img = dialog.querySelector('[data-lightbox-img]');
    var caption = dialog.querySelector('[data-lightbox-caption]');
    var counter = dialog.querySelector('[data-lightbox-counter]');
    var backdrop = dialog.querySelector('[data-lightbox-backdrop]');
    var index = 0;
    var opener = null;
    var startX = null;

    function show(i) {
      index = (i + links.length) % links.length;
      var link = links[index];
      var text = link.getAttribute('data-caption');
      img.width = parseInt(link.getAttribute('data-width'), 10);
      img.height = parseInt(link.getAttribute('data-height'), 10);
      img.src = link.getAttribute('href');
      img.alt = text;
      caption.textContent = text;
      counter.textContent = NS.pad(index + 1) + ' / ' + NS.pad(links.length);
    }

    function open(i, link) {
      opener = link;
      show(i);
      dialog.showModal();
      NS.lockScroll(true);
      // перерисовка перед модификатором — чтобы сработал transition
      void dialog.offsetWidth;
      dialog.classList.add('lightbox--open');
    }

    function close() {
      dialog.close();
    }

    links.forEach(function (link, i) {
      link.addEventListener('click', function (event) {
        // ctrl/cmd+клик — открыть фото в новой вкладке, как обычную ссылку
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        open(i, link);
      });
    });

    dialog.addEventListener('close', function () {
      dialog.classList.remove('lightbox--open');
      NS.lockScroll(false);
      if (opener) opener.focus({ preventScroll: true });
    });

    dialog.querySelector('[data-lightbox-close]').addEventListener('click', close);
    dialog.querySelector('[data-lightbox-prev]').addEventListener('click', function () { show(index - 1); });
    dialog.querySelector('[data-lightbox-next]').addEventListener('click', function () { show(index + 1); });

    // клик по фону закрывает
    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) close();
    });

    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') show(index - 1);
      if (event.key === 'ArrowRight') show(index + 1);
    });

    // свайп на тач-устройствах
    backdrop.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'mouse') startX = event.clientX;
    });
    backdrop.addEventListener('pointerup', function (event) {
      if (startX === null) return;
      var dx = event.clientX - startX;
      startX = null;
      if (Math.abs(dx) < SWIPE_MIN) return;
      show(dx < 0 ? index + 1 : index - 1);
    });
    backdrop.addEventListener('pointercancel', function () {
      startX = null;
    });
  };

  // блок «до/после» необязательный: если его убрать из разметки, модуль просто ничего не найдёт
  NS.initCompare = function () {
    document.querySelectorAll('[data-compare]').forEach(function (root) {
      var frame = root.querySelector('[data-compare-frame]');
      var range = root.querySelector('[data-compare-range]');
      var dragging = false;

      function set(value) {
        var v = Math.max(0, Math.min(100, value));
        range.value = String(Math.round(v));
        frame.style.setProperty('--split', v + '%');
      }

      function fromPointer(event) {
        var rect = frame.getBoundingClientRect();
        return (event.clientX - rect.left) / rect.width * 100;
      }

      // клавиатура и нативный ввод
      range.addEventListener('input', function () {
        set(parseFloat(range.value));
      });

      // перетаскивание по всему кадру: на iOS range не двигается тапом по дорожке
      frame.addEventListener('pointerdown', function (event) {
        dragging = true;
        frame.setPointerCapture(event.pointerId);
        root.classList.add('compare--drag');
        set(fromPointer(event));
      });
      frame.addEventListener('pointermove', function (event) {
        if (dragging) set(fromPointer(event));
      });
      ['pointerup', 'pointercancel'].forEach(function (type) {
        frame.addEventListener(type, function () {
          dragging = false;
          root.classList.remove('compare--drag');
        });
      });

      // видимый фокус на ручке только при управлении с клавиатуры
      range.addEventListener('focus', function () {
        root.classList.toggle('compare--focus', range.matches(':focus-visible'));
      });
      range.addEventListener('blur', function () {
        root.classList.remove('compare--focus');
      });

      set(parseFloat(range.value));
    });
  };
})();
