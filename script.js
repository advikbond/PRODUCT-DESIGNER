const homeScrollKey = 'advik-home-scroll-position';
const savedHomeScroll = sessionStorage.getItem(homeScrollKey);
const navigationEntry = performance.getEntriesByType('navigation')[0];
const isReturningToHome = navigationEntry?.type === 'back_forward' && savedHomeScroll !== null;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

if (window.location.pathname.endsWith('/index.html')) {
  history.replaceState(history.state, '', `/${window.location.search}${window.location.hash}`);
}

function scrollToHomePosition() {
  window.scrollTo({ top: Number(sessionStorage.getItem(homeScrollKey) || 0), left: 0, behavior: 'instant' });
}

if (isReturningToHome) scrollToHomePosition();
else if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

window.addEventListener('pageshow', (event) => {
  if (event.persisted && sessionStorage.getItem(homeScrollKey) !== null) scrollToHomePosition();
  else if (!event.persisted && !isReturningToHome && !window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
});

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('is-ready');

  const hashTarget = window.location.hash && document.querySelector(window.location.hash);
  if (hashTarget) {
    requestAnimationFrame(() => hashTarget.scrollIntoView({ block: 'start' }));
  }

  const skills = document.querySelector('.skills');
  if (skills && !document.querySelector('.skills-secondary')) {
    const tools = [...skills.querySelectorAll('.ticker-group .tool')];
    const splitAt = Math.ceil(tools.length / 2);
    tools.forEach((tool, index) => {
      const halfClass = index < splitAt ? 'ticker-top' : 'ticker-bottom';
      tool.classList.add(halfClass);
      tool.nextElementSibling?.classList.add(halfClass);
    });
    const secondarySkills = skills.cloneNode(true);
    secondarySkills.classList.add('skills-secondary');
    secondarySkills.setAttribute('aria-hidden', 'true');
    skills.insertAdjacentElement('afterend', secondarySkills);
  }

  function initializeTicker(ticker, direction = 1) {
    const group = ticker.querySelector('.ticker-group');
    const copy = group.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    ticker.replaceChildren(group, copy);
    ticker.querySelectorAll('img').forEach((image) => { image.draggable = false; });
    ticker.addEventListener('dragstart', (event) => event.preventDefault());

    let offset = 0;
    let lastFrame = performance.now();
    let isDragging = false;
    let startX = 0;
    let startOffset = 0;
    const speed = 32;
    function groupWidth() { return group.getBoundingClientRect().width + parseFloat(getComputedStyle(ticker).gap); }
    function normalizeOffset() {
      const width = groupWidth();
      if (width) offset = ((offset % width) + width) % width;
    }
    function animate(now) {
      if (!isDragging) { offset += direction * speed * ((now - lastFrame) / 1000); normalizeOffset(); }
      ticker.style.transform = `translate3d(${-offset}px, 0, 0)`;
      lastFrame = now;
      requestAnimationFrame(animate);
    }
    ticker.addEventListener('pointerdown', (event) => { isDragging = true; startX = event.clientX; startOffset = offset; ticker.classList.add('is-dragging'); ticker.setPointerCapture(event.pointerId); });
    ticker.addEventListener('pointermove', (event) => { if (!isDragging) return; offset = startOffset - (event.clientX - startX); normalizeOffset(); });
    function endDrag() { isDragging = false; ticker.classList.remove('is-dragging'); }
    ticker.addEventListener('pointerup', endDrag);
    ticker.addEventListener('pointercancel', endDrag);
    requestAnimationFrame(animate);
  }

  document.querySelectorAll('.ticker').forEach((ticker) => initializeTicker(ticker, ticker.closest('.skills-secondary') ? -1 : 1));

  const hero = document.querySelector('.hero');
  const trailImages = [
    { src: 'public/assets/memory-baby.png', caption: 'Dreams begin early' },
    { src: 'public/assets/memory-beach.png', caption: 'Exploring. Growing.' },
    { src: 'public/assets/memory-trophy.png', caption: 'Moments of hard work' },
    { src: 'public/assets/memory-portrait.png', caption: 'Becoming Who I Am' },
  ];
  const activeTrailPhotos = [];
  let previousTrailPoint;
  let trailImageIndex = 0;

  function createTrailPhoto(event) {
    if (event.pointerType && event.pointerType !== 'mouse') return;

    const bounds = hero.getBoundingClientRect();
    const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    const minimumDistance = window.matchMedia('(max-width: 850px)').matches ? 42 : 68;
    if (previousTrailPoint && Math.hypot(point.x - previousTrailPoint.x, point.y - previousTrailPoint.y) < minimumDistance) return;

    previousTrailPoint = point;
    const trailImage = trailImages[trailImageIndex % trailImages.length];
    const photo = document.createElement('figure');
    photo.className = 'cursor-trail-photo';
    photo.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.src = trailImage.src;
    image.alt = '';
    const caption = document.createElement('figcaption');
    caption.textContent = trailImage.caption;
    photo.append(image, caption);
    photo.style.left = `${point.x}px`;
    photo.style.top = `${point.y}px`;
    photo.style.setProperty('--rotation', `${[-8, 5, -3, 7][trailImageIndex % 4]}deg`);
    trailImageIndex += 1;
    hero.append(photo);
    activeTrailPhotos.push(photo);

    if (activeTrailPhotos.length > 10) activeTrailPhotos.shift().remove();
    photo.addEventListener('animationend', () => {
      photo.remove();
      const photoPosition = activeTrailPhotos.indexOf(photo);
      if (photoPosition !== -1) activeTrailPhotos.splice(photoPosition, 1);
    }, { once: true });
  }

  hero.addEventListener('pointerenter', (event) => {
    const bounds = hero.getBoundingClientRect();
    previousTrailPoint = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  });
  hero.addEventListener('pointermove', createTrailPhoto);
  hero.addEventListener('pointerleave', () => { previousTrailPoint = undefined; });

  document.querySelectorAll('.project-card[data-card-url]').forEach((card) => {
    function saveHomePosition() {
      sessionStorage.setItem(homeScrollKey, String(window.scrollY));
    }

    function openProjectCard() {
      const { cardUrl, cardTarget } = card.dataset;
      if (cardTarget === '_blank') window.open(cardUrl, '_blank', 'noopener,noreferrer');
      else {
        saveHomePosition();
        window.location.href = cardUrl;
      }
    }

    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button, .project-tags')) return;
      openProjectCard();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProjectCard();
      }
    });
  });

  document.querySelectorAll('.project-link:not([target="_blank"])').forEach((link) => {
    link.addEventListener('click', () => sessionStorage.setItem(homeScrollKey, String(window.scrollY)));
  });

  const projectCards = [...document.querySelectorAll('.project-card')];
  const mobileCards = window.matchMedia('(max-width: 850px)');
  let cardObserver;

  function updateMobileCardHighlight() {
    cardObserver?.disconnect();
    projectCards.forEach((card) => card.classList.remove('is-in-view'));
    if (!mobileCards.matches) return;

    cardObserver = new IntersectionObserver((entries) => {
      const centredCard = entries.find((entry) => entry.isIntersecting)?.target;
      if (!centredCard) return;
      projectCards.forEach((card) => card.classList.toggle('is-in-view', card === centredCard));
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    projectCards.forEach((card) => cardObserver.observe(card));
  }

  mobileCards.addEventListener('change', updateMobileCardHighlight);
  updateMobileCardHighlight();

  const headerLinks = [...document.querySelectorAll('.site-header nav a')];
  const navSections = headerLinks
    .map((link) => ({ link, section: link.hash ? document.querySelector(link.hash) : null }))
    .filter(({ section }) => section);
  let isHeaderNavigationScrolling = false;
  let scrollSettleTimer;
  let scrollSafetyTimer;

  function setActiveNavLink(activeLink) {
    headerLinks.forEach((link) => {
      const isActive = link === activeLink;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function updateActiveNavLink() {
    if (isHeaderNavigationScrolling) return;
    const scrollPosition = window.scrollY + document.querySelector('.site-header').offsetHeight + 24;
    let active = navSections[0]?.link;
    navSections.forEach(({ link, section }) => {
      if (section.offsetTop <= scrollPosition) active = link;
    });
    if (!active) return;
    setActiveNavLink(active);
    if (active.hash && window.location.hash !== active.hash) {
      history.replaceState(history.state, '', `/${window.location.search}${active.hash}`);
    }
  }

  function stopHeaderNavigationScroll() {
    isHeaderNavigationScrolling = false;
    clearTimeout(scrollSettleTimer);
    clearTimeout(scrollSafetyTimer);
    updateActiveNavLink();
  }

  headerLinks.filter((link) => link.hash).forEach((link) => {
    link.addEventListener('click', () => {
      isHeaderNavigationScrolling = true;
      setActiveNavLink(link);
      clearTimeout(scrollSettleTimer);
      clearTimeout(scrollSafetyTimer);
      scrollSafetyTimer = window.setTimeout(stopHeaderNavigationScroll, 1200);
    });
  });

  window.addEventListener('scroll', () => {
    if (!isHeaderNavigationScrolling) {
      updateActiveNavLink();
      return;
    }
    clearTimeout(scrollSettleTimer);
    scrollSettleTimer = window.setTimeout(stopHeaderNavigationScroll, 150);
  }, { passive: true });
  window.addEventListener('wheel', stopHeaderNavigationScroll, { passive: true });
  window.addEventListener('touchstart', stopHeaderNavigationScroll, { passive: true });
  window.addEventListener('resize', updateActiveNavLink);
  updateActiveNavLink();

});
