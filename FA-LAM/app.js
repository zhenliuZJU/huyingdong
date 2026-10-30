'use strict';

const tabs = [...document.querySelectorAll('[data-result]')];
function activateTab(tab, focus = false) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', event => {
    let target;
    if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') target = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = tabs.length - 1;
    if (target !== undefined) {
      event.preventDefault();
      activateTab(tabs[target], true);
    }
  });
});

const video = document.getElementById('demo-video');
const videoStatus = document.getElementById('video-status');
const chapters = [...document.querySelectorAll('[data-time]')];
let pendingTime = null;
function seekAndPlay(time) {
  video.currentTime = time;
  video.play().catch(() => {
    videoStatus.textContent = 'Chapter selected. Press the video play button to continue.';
  });
}
chapters.forEach(button => button.addEventListener('click', () => {
  const time = Number(button.dataset.time);
  videoStatus.textContent = `Selected chapter: ${button.textContent.trim()}`;
  if (video.readyState >= 1) seekAndPlay(time);
  else {
    pendingTime = time;
    video.load();
  }
}));
video.addEventListener('loadedmetadata', () => {
  if (pendingTime !== null) {
    seekAndPlay(pendingTime);
    pendingTime = null;
  }
});
video.addEventListener('timeupdate', () => {
  let current = null;
  chapters.forEach(button => {
    if (video.currentTime >= Number(button.dataset.time)) current = button;
  });
  chapters.forEach(button => {
    button.classList.toggle('active', button === current);
    if (button === current) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
});
video.addEventListener('error', () => {
  videoStatus.textContent = 'Unable to load the video. Keep the video folder with this page and use a browser that supports MP4.';
});

const clipVideos = [...document.querySelectorAll('.clip-video')];
clipVideos.forEach(clip => {
  const start = Number(clip.dataset.start);
  const end = Number(clip.dataset.end);
  clip.addEventListener('loadedmetadata', () => { clip.currentTime = start; });
  clip.addEventListener('play', () => {
    if (clip.currentTime < start || clip.currentTime >= end - 0.05) clip.currentTime = start;
  });
  clip.addEventListener('timeupdate', () => {
    if (clip.currentTime >= end - 0.05 && !clip.paused) {
      clip.pause();
      clip.currentTime = start;
    }
  });
});
const allVideos = [video, ...clipVideos];
allVideos.forEach(player => {
  player.addEventListener('play', () => {
    allVideos.forEach(other => { if (other !== player) other.pause(); });
  });
});
if ('IntersectionObserver' in window) {
  const clipObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.preload = 'metadata';
      entry.target.load();
      clipObserver.unobserve(entry.target);
    });
  }, { rootMargin: '350px 0px' });
  clipVideos.forEach(clip => clipObserver.observe(clip));
}

const dialog = document.getElementById('image-dialog');
const dialogImage = document.getElementById('dialog-image');
const caption = document.getElementById('image-caption');
let previousOverflow = '';
let imageTrigger = null;
document.querySelectorAll('.zoom-image').forEach(button => {
  button.addEventListener('click', () => {
    const image = button.querySelector('img');
    dialogImage.src = image.src;
    dialogImage.alt = image.alt;
    caption.textContent = image.alt;
    imageTrigger = button;
    previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  });
});
document.getElementById('close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.style.overflow = previousOverflow;
  imageTrigger?.focus({ preventScroll: true });
});

const copyButton = document.getElementById('copy-bibtex');
const citationStatus = document.getElementById('citation-status');
const citationCode = document.getElementById('bibtex-code');
copyButton.addEventListener('click', async () => {
  const text = citationCode.textContent.trim();
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    copyButton.textContent = 'Copied!';
    citationStatus.textContent = 'BibTeX copied to your clipboard.';
    window.setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(citationCode);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    citationStatus.textContent = 'Citation selected. Press Ctrl+C (Windows) or Command+C (macOS) to copy.';
  }
});

const researchMenu = document.querySelector('.research-menu');
document.addEventListener('click', event => {
  if (!researchMenu.contains(event.target)) researchMenu.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && researchMenu.open) {
    researchMenu.open = false;
    researchMenu.querySelector('summary').focus();
  }
});
