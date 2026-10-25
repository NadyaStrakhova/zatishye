/* Buildless static site: all paths are relative for GitHub project Pages. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var menuButton = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');
  function closeMenu() {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
  menuButton.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
  nav.querySelectorAll('a').forEach(function (anchor) {
    anchor.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', function (event) {
    if (!event.target.closest('.site-header')) closeMenu();
  });

  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px 40px 0px', threshold: 0.03 });
    document.querySelectorAll('.reveal').forEach(function (element) {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add('pending-reveal');
        revealObserver.observe(element);
      }
    });
  }

  var audioElements = Array.from(document.querySelectorAll('audio'));
  var video = document.querySelector('video');
  function pauseOthers(current) {
    audioElements.forEach(function (audio) {
      if (audio !== current) audio.pause();
    });
    if (video && video !== current) video.pause();
  }
  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    var whole = Math.max(0, Math.floor(seconds));
    return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
  }
  document.querySelectorAll('[data-player]').forEach(function (card) {
    var audio = card.querySelector('audio');
    var button = card.querySelector('.play-button');
    var label = card.querySelector('.play-label');
    var seek = card.querySelector('.seek');
    var current = card.querySelector('.current-time');
    var duration = card.querySelector('.duration');
    var error = card.querySelector('.media-error');
    var playLabel = label.textContent;
    var seeking = false;
    card.classList.add('media-ready');
    function showError() {
      error.hidden = false;
      error.textContent = 'Не удалось загрузить запись. Попробуйте открыть или скачать MP3 по ссылке ниже.';
      button.disabled = false;
    }
    function updateButton() {
      var playing = !audio.paused && !audio.ended;
      button.setAttribute('aria-pressed', String(playing));
      label.textContent = playing ? 'Пауза' : playLabel;
      button.setAttribute('aria-label', (playing ? 'Пауза: ' : 'Слушать: ') + card.querySelector('h3').textContent);
    }
    button.addEventListener('click', function () {
      error.hidden = true;
      if (!audio.paused) {
        audio.pause();
        return;
      }
      pauseOthers(audio);
      var playRequest = audio.play();
      if (playRequest && playRequest.catch) playRequest.catch(showError);
    });
    audio.addEventListener('play', function () { pauseOthers(audio); updateButton(); });
    audio.addEventListener('pause', updateButton);
    audio.addEventListener('ended', function () { seek.value = '0'; updateButton(); });
    audio.addEventListener('error', showError);
    audio.addEventListener('loadedmetadata', function () { duration.textContent = formatTime(audio.duration); });
    audio.addEventListener('timeupdate', function () {
      if (seeking) return;
      current.textContent = formatTime(audio.currentTime);
      if (audio.duration > 0) seek.value = String(Math.round(audio.currentTime / audio.duration * 1000));
    });
    seek.addEventListener('input', function () {
      seeking = true;
      if (audio.duration > 0) current.textContent = formatTime(Number(seek.value) / 1000 * audio.duration);
    });
    seek.addEventListener('change', function () {
      if (audio.duration > 0) audio.currentTime = Number(seek.value) / 1000 * audio.duration;
      seeking = false;
    });
  });
  if (video) video.addEventListener('play', function () { pauseOthers(video); });

  var dialog = document.getElementById('image-viewer');
  var viewerImage = document.getElementById('viewer-image');
  var viewerCaption = document.getElementById('viewer-caption');
  var previousFocus = null;
  document.querySelectorAll('[data-image]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      if (!dialog.showModal) {
        window.open(trigger.dataset.image, '_blank', 'noopener');
        return;
      }
      previousFocus = trigger;
      viewerImage.src = trigger.dataset.image;
      viewerImage.alt = trigger.dataset.caption;
      viewerCaption.textContent = trigger.dataset.caption;
      document.getElementById('viewer-original').href = trigger.dataset.image;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      var scroller = dialog.querySelector('.viewer-scroll');
      scroller.scrollTop = 0;
      scroller.scrollLeft = 0;
    });
  });
  document.getElementById('viewer-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('close', function () {
    document.body.style.overflow = '';
    if (previousFocus) previousFocus.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog || event.target.classList.contains('viewer-scroll')) dialog.close();
  });

  var shareButton = document.querySelector('.share-button');
  var shareStatus = document.getElementById('share-status');
  shareButton.addEventListener('click', async function () {
    if (location.protocol === 'file:') {
      shareStatus.textContent = 'Поделиться ссылкой можно после публикации сайта.';
      return;
    }
    var url = location.href.split('#')[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Затишье — перформанс', text: 'Данные, звук, движение и вода.', url: url });
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        shareStatus.textContent = 'Ссылка скопирована.';
      } else {
        shareStatus.textContent = 'Ссылка на проект: ' + url;
      }
    } catch (error) {
      if (error.name !== 'AbortError') shareStatus.textContent = 'Ссылка на проект: ' + url;
    }
  });

  var progress = document.querySelector('.reading-progress');
  var film = document.querySelector('.scene-scroll');
  var frameNodes = Array.from(document.querySelectorAll('.scene-image'));
  var counter = document.querySelector('.scene-counter');
  var sceneDescription = document.querySelector('.scene-description');
  var sceneText = [
    'Спокойное движение. Пустая чаша.',
    'Расчёты расходятся. Чаша наполняется.',
    'Вода приходит независимо от партитур.'
  ];
  var navAnchors = Array.from(nav.querySelectorAll('a'));
  var targets = navAnchors.map(function (anchor) { return document.querySelector(anchor.getAttribute('href')); });
  var ticking = false;
  function updateScroll() {
    var denominator = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (denominator > 0 ? window.scrollY / denominator : 0) + ')';
    if (film && !reduceMotion) {
      var filmRect = film.getBoundingClientRect();
      var headerHeight = document.querySelector('.site-header').offsetHeight;
      var stickyHeight = film.querySelector('.scene-sticky').offsetHeight;
      var travel = Math.max(1, film.offsetHeight - stickyHeight);
      var normalized = Math.min(1, Math.max(0, (headerHeight - filmRect.top) / travel));
      var position = normalized * 2;
      frameNodes.forEach(function (frame, index) {
        frame.style.opacity = String(index === 0 ? 1 : Math.min(1, Math.max(0, position - index + 1)));
      });
      var currentScene = Math.min(2, Math.round(position));
      counter.textContent = '0' + (currentScene + 1) + ' / 03';
      sceneDescription.textContent = sceneText[currentScene];
    }
    var active = -1;
    var closestTop = -Infinity;
    targets.forEach(function (target, index) {
      if (!target) return;
      var top = target.getBoundingClientRect().top;
      if (top <= window.innerHeight * 0.4 && top > closestTop) {
        active = index;
        closestTop = top;
      }
    });
    navAnchors.forEach(function (anchor, index) {
      if (index === active) anchor.setAttribute('aria-current', 'location');
      else anchor.removeAttribute('aria-current');
    });
    ticking = false;
  }
  function requestUpdate() {
    if (!ticking) { requestAnimationFrame(updateScroll); ticking = true; }
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  window.addEventListener('load', requestUpdate);
  updateScroll();
})();
