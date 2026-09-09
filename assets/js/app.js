/* ============================================================================
   CZ app mock-up — screen routing, tab bar, theme, preference state.
   Pure client-side; shares the same data-purpose-id hooks as the website.
   ========================================================================= */
(function () {
  'use strict';

  var STORE_KEY = 'cz-demo-app-preferences';

  var phone    = document.getElementById('phone');
  var viewport = document.getElementById('viewport');
  var tabbar   = document.getElementById('tabbar');
  var toastEl  = document.getElementById('appToast');

  var screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));
  var tabs    = Array.prototype.slice.call(tabbar.querySelectorAll('[data-go]'));

  /* --------------------------------------------------------------- router -- */

  function go(name) {
    var target = document.getElementById('screen-' + name);
    if (!target) { return; }

    screens.forEach(function (screen) {
      screen.classList.toggle('is-active', screen === target);
    });

    // The login screen has no chrome.
    tabbar.classList.toggle('is-hidden', name === 'login');

    // Privacy is pushed from Profile, so Profile stays the selected tab.
    var tabName = name === 'privacy' ? 'profile' : name;
    tabs.forEach(function (tab) {
      tab.setAttribute('aria-selected', String(tab.dataset.go === tabName));
    });

    viewport.scrollTop = 0;
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-go]');
    if (!trigger) { return; }
    go(trigger.dataset.go);
  });

  /* ---------------------------------------------------------------- toast -- */

  var toastTimer;
  function say(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2600);
  }

  /* ---------------------------------------------------------------- theme -- */

  var themeButton = document.getElementById('toggleTheme');
  var themeState  = document.getElementById('themeState');

  function setTheme(mode) {
    phone.dataset.theme = mode;
    themeButton.textContent = mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    if (themeState) { themeState.textContent = mode === 'dark' ? 'Dark' : 'Light'; }
  }

  function flipTheme() {
    setTheme(phone.dataset.theme === 'dark' ? 'light' : 'dark');
  }

  themeButton.addEventListener('click', flipTheme);
  var themeRow = document.getElementById('themeRow');
  if (themeRow) { themeRow.addEventListener('click', flipTheme); }

  /* ---------------------------------------------------------- stage shortcuts */

  document.getElementById('goPrivacy').addEventListener('click', function () { go('privacy'); });
  document.getElementById('goLogin').addEventListener('click', function () { go('login'); });

  /* ------------------------------------------------------------ preferences -- */

  var privacyScreen = document.getElementById('screen-privacy');
  var controls = Array.prototype.slice.call(privacyScreen.querySelectorAll('[data-purpose-id]'));

  function readState() {
    var state = {};
    controls.forEach(function (input) { state[input.dataset.purposeId] = input.checked; });
    return state;
  }

  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved) {
      controls.forEach(function (input) {
        if (input.disabled) { return; }
        if (Object.prototype.hasOwnProperty.call(saved, input.dataset.purposeId)) {
          input.checked = saved[input.dataset.purposeId];
        }
      });
    }
  } catch (error) { /* first run, or storage blocked — start from the defaults */ }

  document.getElementById('appSave').addEventListener('click', function () {
    localStorage.setItem(STORE_KEY, JSON.stringify(readState()));
    say('Preferences saved');
  });

  document.getElementById('appWithdraw').addEventListener('click', function () {
    controls.forEach(function (input) {
      if (!input.disabled) { input.checked = false; }
    });
    localStorage.setItem(STORE_KEY, JSON.stringify(readState()));
    say('All optional consent withdrawn');
  });

  privacyScreen.addEventListener('click', function (event) {
    var button = event.target.closest('[data-request]');
    if (!button) { return; }
    say(button.dataset.request === 'access'
      ? 'Request received — we will email your data file.'
      : 'Request received — we will check what we may delete.');
  });

  /* --------------------------------------------------------------- claims -- */

  var newClaim = document.getElementById('newClaim');
  if (newClaim) {
    newClaim.addEventListener('click', function () {
      say('Camera would open here in the real app.');
    });
  }

  setTheme('light');
  go('login');
})();
