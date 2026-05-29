(function () {
  const slides = document.querySelectorAll('.slide');
  const dots = document.getElementById('navDots');
  const btn = document.getElementById('btnPlay');
  const timer = document.getElementById('timer-display');
  let playing = false;
  let timerInterval = null;
  let slideInterval = null;
  let currentSlide = 0;
  let seconds = 0;

  /* Build dot navigation */
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'nav-dot';
    dot.dataset.index = i;
    dot.addEventListener('click', () => goToSlide(i));
    dots.appendChild(dot);
  });

  function updateDots() {
    const allDots = dots.querySelectorAll('.nav-dot');
    let active = 0;
    let closest = Infinity;
    slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const dist = Math.abs(rect.top);
      if (dist < closest) { closest = dist; active = i; }
    });
    currentSlide = active;
    allDots.forEach((dot, i) => {
      dot.className = 'nav-dot';
      if (i < active) dot.classList.add('done');
      if (i === active) dot.classList.add('active');
    });
  }

  function goToSlide(index) {
    if (index < 0 || index >= slides.length) return;
    slides[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* Scroll observer */
  const observer = new IntersectionObserver(
    () => { updateDots(); },
    { rootMargin: '-40% 0px -40% 0px' }
  );
  slides.forEach(s => observer.observe(s));

  /* Timer display */
  function formatTime(s) {
    const m = String(Math.floor(s / 60));
    const sec = String(s % 60).padStart(2, '0');
    return m + ':' + sec;
  }

  /* Auto-play presentation */
  function startPresentation() {
    if (playing) return;
    playing = true;
    seconds = 0;
    currentSlide = 0;
    btn.disabled = true;
    btn.textContent = '\u25B6 Playing...';
    timer.textContent = '0:00';

    goToSlide(0);

    timerInterval = setInterval(() => {
      seconds++;
      timer.textContent = formatTime(seconds);
    }, 1000);

    let i = 0;
    slideInterval = setInterval(() => {
      i++;
      if (i >= slides.length) {
        stopPresentation();
        return;
      }
      goToSlide(i);
    }, 6000);
  }

  function stopPresentation() {
    clearInterval(timerInterval);
    clearInterval(slideInterval);
    timerInterval = null;
    slideInterval = null;
    playing = false;
    btn.disabled = false;
    btn.textContent = '\u25B6 Replay Presentation';
    updateDots();
  }

  btn.addEventListener('click', startPresentation);

  /* Manual dot click stops auto-play */
  dots.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-dot') && playing) {
      stopPresentation();
    }
  });

  updateDots();
})();
