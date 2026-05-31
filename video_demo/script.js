document.addEventListener('DOMContentLoaded', () => {
  const scenes = document.querySelectorAll('.scene');
  const dots = document.querySelectorAll('.scene-dot');
  const progressBar = document.querySelector('.progress-bar');
  const prevBtn = document.getElementById('prevScene');
  const nextBtn = document.getElementById('nextScene');
  let currentScene = 0;
  let isPlaying = true;

  function updateScene(index) {
    scenes.forEach((s, i) => {
      s.classList.toggle('active', i === index);
      if (i === index) {
        setTimeout(() => s.classList.add('visible'), 100);
      } else {
        s.classList.remove('visible');
      }
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    currentScene = index;
    updateProgress();
  }

  function updateProgress() {
    const pct = ((currentScene + 1) / scenes.length) * 100;
    if (progressBar) progressBar.style.width = `${pct}%`;
  }

  function nextScene() {
    if (currentScene < scenes.length - 1) {
      updateScene(currentScene + 1);
    }
  }

  function prevScene() {
    if (currentScene > 0) {
      updateScene(currentScene - 1);
    }
  }

  // Dot nav
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.scene);
      updateScene(idx);
    });
  });

  // Prev/Next buttons
  if (prevBtn) prevBtn.addEventListener('click', prevScene);
  if (nextBtn) nextBtn.addEventListener('click', nextScene);

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextScene(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prevScene(); }
    if (e.key === 'r' || e.key === 'R') { updateScene(0); }
  });

  // Auto-play demo video when scene 5 becomes visible
  const demoVideo = document.getElementById('demoVideo');
  if (demoVideo) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          demoVideo.play().catch(() => {});
        }
      });
    }, { threshold: 0.5 });
    observer.observe(document.querySelector('.scene-demo'));
  }

  // Touch swipe
  let touchStartX = 0;
  document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
  document.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) nextScene();
      else prevScene();
    }
  });

  // Intersection Observer for auto-trigger animations on scroll
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Array.from(scenes).indexOf(entry.target);
          currentScene = idx;
          dots.forEach((d, i) => d.classList.toggle('active', i === idx));
          updateProgress();
        }
      });
    }, { threshold: 0.5 });
    scenes.forEach((s) => observer.observe(s));
  }

  // Init
  updateScene(0);
});
