/* CZ demo — shared site behaviour. No dependencies, runs entirely in-browser. */
(function () {
  'use strict';

  /* ---- Mobile menu (shows the whole nav row on small screens) ---- */
  var navToggle = document.getElementById('navToggle');
  var headerNav = document.getElementById('headerNav');
  if (navToggle && headerNav) {
    navToggle.addEventListener('click', function () {
      var open = headerNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---- Mega menu ---- */
  var mainNav = document.getElementById('mainNav');
  if (mainNav) {
    var triggers = Array.prototype.slice.call(mainNav.querySelectorAll('button[aria-controls]'));

    function closeAll(except) {
      triggers.forEach(function (trigger) {
        if (trigger === except) { return; }
        trigger.setAttribute('aria-expanded', 'false');
        document.getElementById(trigger.getAttribute('aria-controls')).classList.remove('is-open');
      });
    }

    triggers.forEach(function (trigger) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      trigger.addEventListener('click', function () {
        var open = trigger.getAttribute('aria-expanded') === 'true';
        closeAll(trigger);
        trigger.setAttribute('aria-expanded', String(!open));
        panel.classList.toggle('is-open', !open);
      });
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('#mainNav')) { closeAll(null); }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { closeAll(null); }
    });
  }

  /* ---- Search drawer ---- */
  var searchToggle = document.getElementById('searchToggle');
  var searchDrawer = document.getElementById('searchDrawer');
  if (searchToggle && searchDrawer) {
    searchToggle.addEventListener('click', function () {
      var open = searchDrawer.classList.toggle('is-open');
      searchToggle.setAttribute('aria-expanded', String(open));
      if (open) {
        var input = searchDrawer.querySelector('input');
        if (input) { input.focus(); }
      }
    });
  }

  /* ---- FAQ accordion ---- */
  var faq = document.getElementById('faq-list');
  if (faq) {
    faq.addEventListener('click', function (event) {
      var button = event.target.closest('.faq__q');
      if (!button) { return; }
      var answer = button.parentElement.nextElementSibling;
      var open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      answer.classList.toggle('is-open', !open);
    });
  }
})();
