document.addEventListener('DOMContentLoaded', () => {
  const scenes = document.querySelectorAll('.scene');
  const dots = document.querySelectorAll('.scene-dot');
  const progressBar = document.querySelector('.progress-bar');
  const prevBtn = document.getElementById('prevScene');
  const nextBtn = document.getElementById('nextScene');
  const voiceBtn = document.getElementById('voiceBtn');
  const voiceLabel = document.getElementById('voiceLabel');
  const voiceCaption = document.getElementById('voiceCaption');
  let currentScene = 0;

  const audio = new Audio();
  audio.preload = 'none';
  var captionWords = [];
  var captionTotal = 0;

  function updateScene(index) {
    if (!audio.paused) { audio.pause(); audio.currentTime = 0; }
    resetVoice();

    scenes.forEach(function(s, i) {
      s.classList.toggle('active', i === index);
      if (i === index) {
        setTimeout(function() { s.classList.add('visible'); }, 100);
      } else {
        s.classList.remove('visible');
      }
    });
    dots.forEach(function(d, i) { d.classList.toggle('active', i === index); });
    currentScene = index;
    updateProgress();

    var scene = scenes[index];
    audio.src = 'public/audio/scene-' + String(index + 1).padStart(2, '0') + '.wav';
    audio.load();
    voiceLabel.textContent = 'Play Voice';
    voiceCaption.textContent = '';
    voiceCaption.classList.remove('active');
  }

  function updateProgress() {
    var pct = ((currentScene + 1) / scenes.length) * 100;
    if (progressBar) progressBar.style.width = pct + '%';
  }

  function resetVoice() {
    voiceBtn.classList.remove('playing');
    voiceLabel.textContent = 'Play Voice';
    voiceCaption.classList.remove('active');
    voiceCaption.textContent = '';
    captionWords = [];
    captionTotal = 0;
  }

  function nextScene() {
    if (currentScene < scenes.length - 1) {
      var next = currentScene + 1;
      if (!audio.paused) { audio.pause(); audio.currentTime = 0; }
      resetVoice();
      updateScene(next);
      scenes[next].scrollIntoView({ behavior: 'smooth' });
    }
  }

  function prevScene() {
    if (currentScene > 0) {
      var prev = currentScene - 1;
      if (!audio.paused) { audio.pause(); audio.currentTime = 0; }
      resetVoice();
      updateScene(prev);
      scenes[prev].scrollIntoView({ behavior: 'smooth' });
    }
  }

  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      var idx = parseInt(dot.dataset.scene);
      if (!audio.paused) { audio.pause(); audio.currentTime = 0; }
      resetVoice();
      updateScene(idx);
      scenes[idx].scrollIntoView({ behavior: 'smooth' });
    });
  });

  if (prevBtn) prevBtn.addEventListener('click', prevScene);
  if (nextBtn) nextBtn.addEventListener('click', nextScene);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextScene(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prevScene(); }
    if (e.key === 'r' || e.key === 'R') { updateScene(0); }
  });

  voiceBtn.addEventListener('click', function() {
    // If currently playing the current scene, stop it
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      voiceBtn.classList.remove('playing');
      voiceLabel.textContent = 'Replay Voice';
      voiceCaption.classList.add('active');
      voiceCaption.textContent = scenes[currentScene].dataset.caption || '';
      captionWords = [];
      captionTotal = 0;
      return;
    }

    // Play
    var script = scenes[currentScene].dataset.script || '';
    captionWords = script.split(/\s+/);
    captionTotal = captionWords.length;
    audio.currentTime = 0;
    audio.play().catch(function() {});
    voiceBtn.classList.add('playing');
    voiceLabel.textContent = 'Speaking...';
    voiceCaption.classList.add('active');
    voiceCaption.textContent = '';
  });

  audio.addEventListener('timeupdate', function() {
    if (audio.duration && captionTotal > 0 && !audio.paused) {
      var pct = audio.currentTime / audio.duration;
      var show = Math.min(Math.floor(pct * captionTotal), captionTotal);
      voiceCaption.textContent = captionWords.slice(0, show).join(' ');
    }
  });

  audio.addEventListener('ended', function() {
    voiceBtn.classList.remove('playing');
    voiceLabel.textContent = 'Replay Voice';
    voiceCaption.textContent = scenes[currentScene].dataset.caption || '';
    captionWords = [];
    captionTotal = 0;
  });

  audio.addEventListener('error', function() {
    voiceBtn.classList.remove('playing');
    voiceLabel.textContent = 'Play Voice';
    voiceCaption.classList.remove('active');
    captionWords = [];
    captionTotal = 0;
  });

  var demoVideo = document.getElementById('demoVideo');
  if (demoVideo) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          demoVideo.play()['catch'](function() {});
        }
      });
    }, { threshold: 0.5 });
    observer.observe(document.querySelector('.scene-demo'));
  }

  var touchStartX = 0;
  document.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; });
  document.addEventListener('touchend', function(e) {
    var diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) nextScene();
      else prevScene();
    }
  });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var idx = Array.from(scenes).indexOf(entry.target);
          if (idx !== currentScene) {
            if (!audio.paused) { audio.pause(); audio.currentTime = 0; }
            resetVoice();
          }
          currentScene = idx;
          scenes.forEach(function(s, i) { s.classList.toggle('visible', i === idx); });
          dots.forEach(function(d, i) { d.classList.toggle('active', i === idx); });
          updateProgress();

          var scene = scenes[idx];
          audio.src = 'public/audio/scene-' + String(idx + 1).padStart(2, '0') + '.wav';
          audio.load();
        }
      });
    }, { threshold: 0.5 });
    scenes.forEach(function(s) { observer.observe(s); });
  }

  updateScene(0);
});
