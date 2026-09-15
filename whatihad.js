document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('.carousel-track');
  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  const previous = carousel.querySelector('.carousel-previous');
  const next = carousel.querySelector('.carousel-next');
  const dots = [...carousel.querySelectorAll('.carousel-dots button')];
  let currentSlide = 0;

  function renderSlide(index) {
    currentSlide = (index + slides.length) % slides.length;
    track.style.transform = `translateX(${-currentSlide * 100}%)`;
    dots.forEach((dot, dotIndex) => {
      const isCurrent = dotIndex === currentSlide;
      dot.classList.toggle('active', isCurrent);
      dot.setAttribute('aria-current', isCurrent ? 'true' : 'false');
    });
  }

  previous.addEventListener('click', () => renderSlide(currentSlide - 1));
  next.addEventListener('click', () => renderSlide(currentSlide + 1));
  dots.forEach((dot, index) => dot.addEventListener('click', () => renderSlide(index)));
  renderSlide(0);
});
