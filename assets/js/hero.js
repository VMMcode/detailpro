// hero: появление при загрузке и «включение фар» по прокрутке — кадры рисуются на canvas поверх фото
(function () {
  'use strict';

  var NS = window.DETAILPRO = window.DETAILPRO || {};

  // высота hero не должна прыгать, когда панель браузера на телефоне прячется:
  // на тач-устройствах фиксируем высоту экрана в px и пересчитываем только при смене ширины
  function initViewport() {
    if (!window.matchMedia('(pointer: coarse)').matches) return;

    var root = document.documentElement;
    var lastWidth = 0;

    function lock() {
      var width = root.clientWidth;
      if (width === lastWidth) return;
      lastWidth = width;
      root.style.setProperty('--viewport-h', window.innerHeight + 'px');
    }

    lock();
    window.addEventListener('resize', lock, { passive: true });
  }

  // появление после загрузки фото и шрифтов, но не дольше секунды
  function initIntro(hero) {
    var img = hero.querySelector('[data-hero-img]');
    var started = false;

    function start() {
      if (started) return;
      started = true;
      requestAnimationFrame(function () {
        hero.classList.add('hero--loaded');
      });
    }

    var imageReady = new Promise(function (resolve) {
      if (img.complete) {
        resolve();
      } else {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      }
    });

    Promise.all([imageReady, document.fonts.ready]).then(start);
    setTimeout(start, 1000);
  }

  // вордмарк ровно по ширине контейнера: контур первой и последней буквы — у его краёв;
  // ширину считаем по метрикам шрифта на canvas, размер и сдвиг отдаём в CSS-переменные
  function initWordmark(hero) {
    var mark = hero.querySelector('[data-hero-wordmark]');
    var parent = mark.parentElement;
    var ctx = document.createElement('canvas').getContext('2d');
    var lastWidth = 0;

    function fit() {
      var parentStyle = getComputedStyle(parent);
      var width = parent.clientWidth - parseFloat(parentStyle.paddingLeft) - parseFloat(parentStyle.paddingRight);
      if (!width || width === lastWidth) return;
      lastWidth = width;

      var text = mark.textContent.replace(/\s+/g, '');
      var style = getComputedStyle(mark);
      var spacing = parseFloat(style.letterSpacing) / parseFloat(style.fontSize) || 0;
      var ref = 100;

      ctx.font = style.fontWeight + ' ' + ref + 'px ' + style.fontFamily;

      // буквы — отдельные inline-block, кернинга нет: складываем ширины по одной
      var advance = 0;
      for (var i = 0; i < text.length; i++) advance += ctx.measureText(text[i]).width;

      var first = ctx.measureText(text[0]);
      var last = ctx.measureText(text[text.length - 1]);
      var bearingLeft = -first.actualBoundingBoxLeft;
      var bearingRight = last.width - last.actualBoundingBoxRight;
      var ink = advance + (text.length - 1) * spacing * ref - bearingLeft - bearingRight;
      if (!(ink > 0)) return;

      var size = width * ref / ink;

      mark.style.setProperty('--wordmark-size', size + 'px');
      mark.style.setProperty('--wordmark-shift', -(bearingLeft * size / ref) + 'px');
    }

    fit();
    document.fonts.ready.then(function () {
      lastWidth = 0;
      fit();
    });
    window.addEventListener('resize', NS.throttle(fit), { passive: true });
  }

  function initSequence(hero) {
    var config = NS.HERO_SEQUENCE;
    if (!config.count || NS.reducedMotion()) return;

    var canvas = hero.querySelector('[data-hero-canvas]');
    var sticky = hero.querySelector('[data-hero-sticky]');
    var ctx = canvas.getContext('2d');
    var frames = [];
    var current = -1;
    var fill = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();

    function frameSrc(index) {
      return config.path.replace('{n}', String(index + 1).padStart(config.digits, '0'));
    }

    // hero закрепляется, только когда есть что показать
    function onFrameLoad(index) {
      if (index === 0) {
        hero.classList.add('hero--sequence');
        resize();
        return;
      }
      requestUpdate();
    }

    // размер без transform (анимация появления масштабирует обёртку); если он не изменился,
    // canvas не трогаем — присвоение width/height очищает картинку, а панель браузера на мобилке тоже шлёт resize
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.round(canvas.offsetWidth * dpr);
      var height = Math.round(canvas.offsetHeight * dpr);
      if (width !== canvas.width || height !== canvas.height) {
        canvas.width = width;
        canvas.height = height;
        current = -1;
      }
      update();
    }

    // 0 — начало закрепления, 1 — hero вот-вот уедет вверх
    function progress() {
      var distance = hero.offsetHeight - sticky.offsetHeight;
      if (distance <= 0) return 0;
      return Math.min(Math.max(-hero.getBoundingClientRect().top / distance, 0), 1);
    }

    function isLoaded(img) {
      return img.complete && img.naturalWidth > 0;
    }

    function update() {
      if (!isLoaded(frames[0])) return;

      // нужный кадр ещё грузится — показываем ближайший загруженный до него
      var index = Math.round(progress() * (frames.length - 1));
      while (index > 0 && !isLoaded(frames[index])) index--;
      if (index === current) return;

      current = index;
      draw(frames[index]);
    }

    // как object-fit: cover с привязкой к низу — авто «стоит» на нижней границе
    function draw(img) {
      var cw = canvas.width;
      var ch = canvas.height;
      var scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      var w = img.naturalWidth * scale;
      var h = img.naturalHeight * scale;
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - w) / 2, ch - h, w, h);
    }

    var requestUpdate = NS.throttle(update);

    for (var i = 0; i < config.count; i++) {
      var img = new Image();
      img.decoding = 'async';
      img.addEventListener('load', onFrameLoad.bind(null, i));
      img.src = frameSrc(i);
      frames.push(img);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', NS.throttle(resize), { passive: true });
  }

  NS.initHero = function () {
    var hero = document.querySelector('[data-hero]');
    initViewport();
    initIntro(hero);
    initWordmark(hero);
    initSequence(hero);
  };
})();
