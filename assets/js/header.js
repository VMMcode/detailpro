// шапка: блюр при скролле, активный пункт, мобильное меню
(function () {
  'use strict';

  var NS = window.DETAILPRO = window.DETAILPRO || {};

  function initScrollState(header) {
    function update() {
      header.classList.toggle('header--scrolled', window.scrollY > NS.HEADER_THRESHOLD);
    }

    window.addEventListener('scroll', NS.throttle(update), { passive: true });
    update();
  }

  // подсветка пункта меню по секции в центре экрана
  function initActiveLinks() {
    if (!('IntersectionObserver' in window)) return;

    var links = Array.from(document.querySelectorAll('[data-nav-link]'));
    var sections = [];
    links.forEach(function (link) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target && sections.indexOf(target) === -1) sections.push(target);
    });

    var visible = new Set();

    function render() {
      // активна первая по порядку видимая секция
      var active = sections.find(function (section) {
        return visible.has(section.id);
      });
      links.forEach(function (link) {
        var isActive = Boolean(active) && link.getAttribute('href') === '#' + active.id;
        link.classList.toggle(link.getAttribute('data-nav-link') + '--active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visible.add(entry.target.id);
        } else {
          visible.delete(entry.target.id);
        }
      });
      render();
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  // полноэкранное меню до 1024px
  function initMenu() {
    var menu = document.querySelector('[data-menu]');
    var openButton = document.querySelector('[data-menu-open]');
    var closeButton = menu.querySelector('[data-menu-close]');
    var isOpen = false;

    function onKeydown(event) {
      if (event.key === 'Escape') {
        close(true);
        return;
      }
      // ловушка фокуса внутри меню
      if (event.key !== 'Tab') return;
      var focusable = menu.querySelectorAll('a[href], button:not([disabled])');
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function open() {
      isOpen = true;
      menu.classList.add('menu--open');
      openButton.setAttribute('aria-expanded', 'true');
      NS.lockScroll(true);
      document.addEventListener('keydown', onKeydown);
      closeButton.focus({ preventScroll: true });
    }

    function close(returnFocus) {
      if (!isOpen) return;
      isOpen = false;
      menu.classList.remove('menu--open');
      openButton.setAttribute('aria-expanded', 'false');
      NS.lockScroll(false);
      document.removeEventListener('keydown', onKeydown);
      if (returnFocus) openButton.focus({ preventScroll: true });
    }

    openButton.addEventListener('click', open);
    closeButton.addEventListener('click', function () {
      close(true);
    });

    // переход по якорю закрывает меню: скролл разблокируется до перехода
    menu.querySelectorAll('[data-menu-link]').forEach(function (link) {
      link.addEventListener('click', function () {
        close(false);
      });
    });

    // на десктопе меню нет
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (event) {
      if (event.matches) close(false);
    });
  }

  NS.initHeader = function () {
    initScrollState(document.querySelector('[data-header]'));
    initActiveLinks();
    initMenu();
  };
})();
