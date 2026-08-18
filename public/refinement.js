(() => {
  const progressId = 'ast-reading-progress';

  if (document.getElementById(progressId)) {
    return;
  }

  const progress = document.createElement('div');
  progress.id = progressId;
  progress.className = 'ast-reading-progress';
  progress.setAttribute('aria-hidden', 'true');

  const bar = document.createElement('span');
  bar.className = 'ast-reading-progress__bar';
  progress.append(bar);
  document.body.prepend(progress);

  let frame = 0;

  const updateProgress = () => {
    const root = document.documentElement;
    const scrollTop = window.scrollY || root.scrollTop || 0;
    const scrollable = Math.max(root.scrollHeight - window.innerHeight, 0);
    const ratio = scrollable > 0 ? Math.min(1, Math.max(0, scrollTop / scrollable)) : 0;

    bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    frame = 0;
  };

  const scheduleUpdate = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(updateProgress);
    }
  };

  window.addEventListener('scroll', scheduleUpdate, {passive: true});
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('orientationchange', scheduleUpdate);
  updateProgress();
})();
