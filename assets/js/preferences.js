/* ============================================================================
   My CZ — account tabs + preference centre.
   Everything is client-side. State persists in localStorage under CZ_DEMO_KEY.

   The data-purpose-id attribute on every control is the hook you would map to
   a real purpose / collection point if this were wired to a consent platform.
   ========================================================================= */
(function () {
  'use strict';

  var STORE_KEY = 'cz-demo-preferences';

  /* ---------------------------------------------------------------- tabs -- */

  var nav = document.getElementById('accountNav');
  if (!nav) { return; }

  var tabs = Array.prototype.slice.call(nav.querySelectorAll('[data-panel]'));

  function showPanel(name, updateHash) {
    var found = false;
    tabs.forEach(function (tab) {
      var isTarget = tab.dataset.panel === name;
      if (isTarget) { found = true; }
      tab.setAttribute('aria-selected', String(isTarget));
      var panel = document.getElementById('panel-' + tab.dataset.panel);
      if (panel) {
        panel.classList.toggle('is-active', isTarget);
        panel.hidden = !isTarget;
      }
    });
    if (found && updateHash) {
      history.replaceState(null, '', '#' + name);
    }
    return found;
  }

  nav.addEventListener('click', function (event) {
    var tab = event.target.closest('[data-panel]');
    if (!tab) { return; }
    showPanel(tab.dataset.panel, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Keyboard support for the tab list.
  nav.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' &&
        event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') { return; }
    var current = tabs.indexOf(document.activeElement);
    if (current === -1) { return; }
    event.preventDefault();
    var step = (event.key === 'ArrowDown' || event.key === 'ArrowRight') ? 1 : -1;
    var next = tabs[(current + step + tabs.length) % tabs.length];
    next.focus();
    showPanel(next.dataset.panel, true);
  });

  // Deep link: mijn-cz.html#privacy opens straight into the preference centre.
  // An unknown hash falls back to the overview rather than leaving a blank page.
  if (window.location.hash) {
    if (!showPanel(window.location.hash.slice(1), false)) {
      showPanel('overview', false);
    }
  }

  /* ------------------------------------------------------------- controls -- */

  var privacyPanel = document.getElementById('panel-privacy');
  var controls = Array.prototype.slice.call(
    privacyPanel.querySelectorAll('[data-purpose-id]')
  );

  function readState() {
    var state = { toggles: {}, frequency: null };
    controls.forEach(function (input) {
      if (input.type === 'radio') {
        if (input.checked) { state.frequency = input.value; }
      } else {
        state.toggles[input.dataset.purposeId] = input.checked;
      }
    });
    return state;
  }

  function applyState(state) {
    if (!state) { return; }
    controls.forEach(function (input) {
      if (input.disabled) { return; }
      if (input.type === 'radio') {
        input.checked = input.value === state.frequency;
      } else if (Object.prototype.hasOwnProperty.call(state.toggles, input.dataset.purposeId)) {
        input.checked = state.toggles[input.dataset.purposeId];
      }
    });
  }

  function labelFor(input) {
    var row = input.closest('.pref-row');
    if (row) { return row.querySelector('strong').textContent.trim(); }
    var chip = input.nextElementSibling;
    if (chip) { return chip.textContent.trim(); }
    return input.dataset.purposeId;
  }

  var saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORE_KEY));
  } catch (error) {
    saved = null;
  }
  applyState(saved);
  var lastSaved = saved || readState();

  /* ----------------------------------------------------------------- toast -- */

  var toast = document.getElementById('toast');
  var toastTimer;

  function say(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2800);
  }

  /* ------------------------------------------------------- consent history -- */

  var historyBody = document.querySelector('#consentHistory tbody');

  function today() {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  function logChange(purpose, action) {
    var row = document.createElement('tr');
    [today(), purpose, action, 'NL-PRIV-4.2', 'My CZ'].forEach(function (value) {
      var cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
    historyBody.insertBefore(row, historyBody.firstChild);
  }

  function logDiff(before, after) {
    var changes = 0;

    controls.forEach(function (input) {
      if (input.disabled || input.type === 'radio') { return; }
      var id = input.dataset.purposeId;
      if (before.toggles[id] !== after.toggles[id]) {
        logChange(labelFor(input), after.toggles[id] ? 'Opted in' : 'Opted out');
        changes += 1;
      }
    });

    if (before.frequency !== after.frequency) {
      var wording = {
        all: 'Changed to everything',
        monthly: 'Changed to monthly summary',
        essential: 'Changed to essential only'
      };
      logChange('Contact frequency', wording[after.frequency] || 'Changed');
      changes += 1;
    }

    return changes;
  }

  /* --------------------------------------------------------------- actions -- */

  document.getElementById('savePrefs').addEventListener('click', function () {
    var current = readState();
    var changes = logDiff(lastSaved, current);
    localStorage.setItem(STORE_KEY, JSON.stringify(current));
    lastSaved = current;
    say(changes === 0
      ? 'Nothing changed'
      : changes === 1 ? '1 preference saved' : changes + ' preferences saved');
  });

  document.getElementById('resetPrefs').addEventListener('click', function () {
    applyState(lastSaved);
    say('Back to your last saved preferences');
  });

  document.getElementById('withdrawAll').addEventListener('click', function () {
    controls.forEach(function (input) {
      if (input.disabled) { return; }
      if (input.type === 'radio') {
        input.checked = input.value === 'essential';
      } else {
        input.checked = false;
      }
    });
    var current = readState();
    logDiff(lastSaved, current);
    localStorage.setItem(STORE_KEY, JSON.stringify(current));
    lastSaved = current;
    say('All optional consent withdrawn');
  });

  /* --------------------------------------------------------- data requests -- */

  var wording = {
    access: 'Request received. Your data file will be emailed within one month.',
    correct: 'Request received. A colleague will contact you about the correction.',
    erase: 'Request received. We will check which data we are allowed to delete.'
  };

  privacyPanel.addEventListener('click', function (event) {
    var button = event.target.closest('[data-request]');
    if (!button) { return; }
    say(wording[button.dataset.request]);
  });
})();
