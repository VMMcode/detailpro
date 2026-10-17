// форма записи: маска телефона, валидация, отправка (режим — FORM_CONFIG.mode в config.js);
// события на document: detailpro:submit — данные прошли валидацию, detailpro:success — заявка отправлена
(function () {
  'use strict';

  var NS = window.DETAILPRO = window.DETAILPRO || {};

  var MESSAGES = {
    required: 'Заполните это поле',
    name: 'Введите имя',
    phone: 'Введите номер полностью',
    consent: 'Нужно согласие на обработку данных',
    sending: 'Отправляем…',
  };

  var PHONE_LENGTH = 11;
  var DEMO_DELAY = 900;

  // маска телефона +7 (___) ___-__-__

  function digitsOf(value) {
    return value.replace(/\D/g, '');
  }

  // «8…», «+7…», «9…» → всегда 11 цифр с ведущей 7
  function normalize(digits) {
    if (!digits) return '';
    if (digits.charAt(0) === '8') digits = '7' + digits.slice(1);
    else if (digits.charAt(0) !== '7') digits = '7' + digits;
    return digits.slice(0, PHONE_LENGTH);
  }

  function format(d) {
    if (!d) return '';
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length > 4) out += ') ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }

  // позиция каретки сразу после n-й цифры отформатированной строки
  function caretAfterDigit(formatted, n) {
    if (n <= 0) return formatted.indexOf('(') > -1 ? formatted.indexOf('(') + 1 : formatted.length;
    var count = 0;
    for (var i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted.charAt(i))) {
        count++;
        if (count === n) return i + 1;
      }
    }
    return formatted.length;
  }

  function applyMask(input) {
    var raw = input.value;
    var caret = input.selectionStart === null ? raw.length : input.selectionStart;
    var rawDigits = digitsOf(raw);
    var digitsBefore = digitsOf(raw.slice(0, caret)).length;
    var d = normalize(rawDigits);

    // нормализация могла добавить ведущую 7 — сдвигаем счётчик
    if (rawDigits && d.length > rawDigits.length) digitsBefore += d.length - rawDigits.length;

    var formatted = format(d);
    input.value = formatted;

    if (document.activeElement === input) {
      var pos = caretAfterDigit(formatted, Math.min(digitsBefore, d.length));
      input.setSelectionRange(pos, pos);
    }
  }

  function initPhoneMask(input) {
    input.addEventListener('input', function () {
      applyMask(input);
    });

    // backspace по символу маски («)», «-», пробел) удаляет ближайшую цифру слева
    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Backspace') return;
      var pos = input.selectionStart;
      if (pos !== input.selectionEnd || pos === 0) return;
      if (/\d/.test(input.value.charAt(pos - 1))) return;

      event.preventDefault();
      var i = pos - 1;
      while (i > 0 && !/\d/.test(input.value.charAt(i))) i--;
      // дошли до кода страны — очищаем поле
      if (i <= 1) {
        input.value = '';
      } else {
        input.value = input.value.slice(0, i) + input.value.slice(i + 1);
        input.setSelectionRange(i, i);
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  // валидация

  function validate(input) {
    var rule = input.getAttribute('data-validate');
    var message = '';

    if (rule === 'name') {
      var name = input.value.trim();
      if (!name) message = MESSAGES.required;
      else if (name.length < 2) message = MESSAGES.name;
    }

    if (rule === 'phone') {
      var digits = digitsOf(input.value);
      if (digits.length <= 1) message = MESSAGES.required;
      else if (digits.length !== PHONE_LENGTH) message = MESSAGES.phone;
    }

    if (rule === 'consent' && !input.checked) {
      message = MESSAGES.consent;
    }

    setError(input, message);
    return !message;
  }

  function setError(input, message) {
    var field = input.closest('[data-field]');
    field.classList.toggle('form__field--error', Boolean(message));
    field.querySelector('[data-field-error]').textContent = message;
    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  // список услуг: nice-select2 прячет нативный select и рисует рядом div.nice-select
  // с теми же классами — поэтому он выглядит как остальные поля
  function initSelect(select) {
    if (!window.NiceSelect) return;
    window.NiceSelect.bind(select, { searchable: false, placeholder: 'Выберите услугу' });
    select.nextElementSibling.setAttribute('aria-label', select.labels[0].textContent.trim());
  }

  // после программной смены значения сообщаем библиотеке — список перерисуется
  function syncSelect(select) {
    select.dispatchEvent(new Event('change'));
  }

  // отправка: единственная точка, режим берётся из FORM_CONFIG
  function send(form, config) {
    if (config.mode === 'fetch') {
      if (!config.endpoint) {
        return Promise.reject(new Error('FORM_CONFIG.endpoint не задан'));
      }
      var controller = new AbortController();
      var timer = setTimeout(function () {
        controller.abort();
      }, config.timeout);

      return fetch(config.endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      }).then(function (response) {
        clearTimeout(timer);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response;
      }, function (error) {
        clearTimeout(timer);
        throw error;
      });
    }

    // demo: имитация успешной отправки
    return new Promise(function (resolve) {
      setTimeout(resolve, DEMO_DELAY);
    });
  }

  function toObject(form) {
    var data = {};
    new FormData(form).forEach(function (value, key) {
      if (key !== 'website') data[key] = value;
    });
    return data;
  }

  // возвращает сброс формы — им пользуется попап при каждом открытии
  function initBookingForm(form) {
    var config = NS.FORM_CONFIG;
    var submit = form.querySelector('[data-form-submit]');
    var submitLabel = form.querySelector('[data-form-submit-label]');
    var status = form.querySelector('[data-form-status]');
    var alert = form.querySelector('[data-form-alert]');
    var successTitle = form.querySelector('[data-form-success-title]');
    var successText = form.querySelector('[data-form-success-text]');
    var honeypot = form.querySelector('[data-honeypot]');
    var select = form.querySelector('[data-service-select]');
    var fields = Array.from(form.querySelectorAll('[data-validate]'));
    var initialLabel = submitLabel.textContent;

    // служебные поля: UTM-метки и адрес страницы
    function fillMeta() {
      var params = new URLSearchParams(window.location.search);
      form.querySelectorAll('[data-utm]').forEach(function (input) {
        input.value = params.get(input.name) || '';
      });
      form.querySelectorAll('[data-page-url]').forEach(function (input) {
        input.value = window.location.href;
      });
    }

    fillMeta();
    form.querySelectorAll('[data-phone]').forEach(initPhoneMask);
    initSelect(select);

    // ошибка показывается после ухода с поля и снимается при исправлении
    var touched = new Map();
    fields.forEach(function (input) {
      var isCheckbox = input.type === 'checkbox';

      input.addEventListener(isCheckbox ? 'change' : 'input', function () {
        touched.set(input, true);
        if (isCheckbox || input.getAttribute('aria-invalid') === 'true') validate(input);
      });
      if (!isCheckbox) {
        input.addEventListener('blur', function () {
          if (touched.get(input)) validate(input);
        });
      }
    });

    function setState(state) {
      form.classList.toggle('form--loading', state === 'loading');
      form.classList.toggle('form--success', state === 'success');
      form.classList.toggle('form--error', state === 'error');
      submit.disabled = state === 'loading';
      submitLabel.textContent = state === 'loading' ? MESSAGES.sending : initialLabel;
    }

    function onSuccess(data) {
      setState('success');
      status.textContent = successTitle.textContent + '. ' + successText.textContent;
      successTitle.focus();
      if (data) document.dispatchEvent(new CustomEvent('detailpro:success', { detail: data }));
    }

    function onError(error) {
      setState('error');
      status.textContent = alert.textContent.replace(/\s+/g, ' ').trim();
      console.warn('[DETAILPRO] Форма не отправлена:', error);
    }

    form.addEventListener('submit', function (event) {
      var firstInvalid = null;
      fields.forEach(function (input) {
        if (!validate(input) && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        event.preventDefault();
        firstInvalid.focus();
        return;
      }

      // ловушка заполнена — это бот: тихо «успех», ничего не отправляем
      if (honeypot.value) {
        event.preventDefault();
        onSuccess(null);
        return;
      }

      var data = toObject(form);
      document.dispatchEvent(new CustomEvent('detailpro:submit', { detail: data }));

      // native — форма уходит браузером по action
      if (config.mode === 'native') return;

      event.preventDefault();
      setState('loading');
      status.textContent = MESSAGES.sending;

      send(form, config).then(function () {
        onSuccess(data);
      }, onError);
    });

    function reset() {
      form.reset();
      syncSelect(select);
      fillMeta();
      fields.forEach(function (input) {
        touched.set(input, false);
        setError(input, '');
      });
      setState('idle');
      status.textContent = '';
    }

    form.querySelector('[data-form-reset]').addEventListener('click', function () {
      reset();
      fields[0].focus();
    });

    return reset;
  }

  // фолбэк без <dialog>: ссылки «↗» в прайсе подставляют услугу в форму секции
  function initServiceLinks() {
    var select = document.querySelector('[data-service-select]');
    document.querySelectorAll('[data-service-link]').forEach(function (link) {
      link.addEventListener('click', function () {
        select.value = link.getAttribute('data-service-link');
        syncSelect(select);
      });
    });
  }

  // попап: копия формы из секции, id с префиксом — чтобы не было дублей
  function cloneForm(form, slot) {
    var clone = form.cloneNode(true);
    var prefix = 'modal-';
    clone.setAttribute('data-form', 'booking-modal');
    clone.querySelectorAll('[id]').forEach(function (el) {
      el.id = prefix + el.id;
    });
    clone.querySelectorAll('[for]').forEach(function (el) {
      el.setAttribute('for', prefix + el.getAttribute('for'));
    });
    clone.querySelectorAll('[aria-describedby]').forEach(function (el) {
      el.setAttribute('aria-describedby', prefix + el.getAttribute('aria-describedby'));
    });
    slot.appendChild(clone);
    return clone;
  }

  // кнопки «Записаться» открывают попап вместо прокрутки к секции
  function initModal(dialog, modalForm, resetForm) {
    var title = dialog.querySelector('[data-modal-title]');
    var select = modalForm.querySelector('[data-service-select]');
    var nameInput = modalForm.querySelector('[data-validate="name"]');
    var defaultTitle = title.innerHTML;
    var opener = null;

    function open(trigger) {
      var service = trigger.getAttribute('data-service-link');
      opener = trigger;
      resetForm();
      if (service) {
        select.value = service;
        syncSelect(select);
        title.textContent = 'Запись: ' + service;
      } else {
        title.innerHTML = defaultTitle;
      }

      dialog.showModal();
      NS.lockScroll(true);
      // на тачах не открываем клавиатуру сразу, фокус — на крестике
      if (window.matchMedia('(hover: hover)').matches) nameInput.focus();
    }

    function close() {
      dialog.close();
    }

    document.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-booking-open]');
      // ctrl/cmd+клик — обычное поведение ссылки
      if (!trigger || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      open(trigger);
    });

    dialog.querySelector('[data-modal-close]').addEventListener('click', close);

    // клик по подложке приходит на сам <dialog>, а не на его содержимое
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) close();
    });

    dialog.addEventListener('close', function () {
      NS.lockScroll(false);
      if (!opener) return;
      // кнопка из закрытого мобильного меню скрыта — фокус на бургер
      var target = opener.closest('[data-menu]') ? document.querySelector('[data-menu-open]') : opener;
      target.focus({ preventScroll: true });
    });
  }

  NS.initForm = function () {
    var sectionForm = document.querySelector('[data-form="booking"]');
    var dialog = document.querySelector('[data-modal]');

    // без <dialog> остаётся обычный якорь #booking
    if (typeof dialog.showModal !== 'function') {
      initBookingForm(sectionForm);
      initServiceLinks();
      return;
    }

    // клонируем до инициализации, чтобы обработчики навесились на обе формы
    var modalForm = cloneForm(sectionForm, dialog.querySelector('[data-modal-form]'));
    initBookingForm(sectionForm);
    initModal(dialog, modalForm, initBookingForm(modalForm));
  };
})();
