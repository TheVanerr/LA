/**
 * LoveApp — Sweet romantic parçacık efektleri
 */

const RAIN_ITEMS = ['💕', '💗', '✨', '🩷', '💖', '♥'];
const CONFETTI_COLORS = ['#e899a8', '#f5c6d0', '#fce4de', '#e8dff5', '#fad9c8', '#fff0f3'];
const CONFETTI_EMOJI = ['💕', '💗', '✨', '💖'];

function startSoftRain(container, count = 14) {
  if (!container) return;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'rain-particle';
    el.textContent = RAIN_ITEMS[Math.floor(Math.random() * RAIN_ITEMS.length)];
    el.style.left = `${Math.random() * 100}%`;
    el.style.animationDuration = `${7 + Math.random() * 7}s`;
    el.style.animationDelay = `${Math.random() * 6}s`;
    el.style.fontSize = `${0.85 + Math.random() * 0.9}rem`;
    container.appendChild(el);
  }
}

function burstConfetti(count = 55) {
  for (let i = 0; i < count; i++) {
    const isEmoji = Math.random() > 0.5;
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    if (isEmoji) {
      piece.textContent = CONFETTI_EMOJI[Math.floor(Math.random() * CONFETTI_EMOJI.length)];
      piece.style.fontSize = `${0.9 + Math.random() * 0.6}rem`;
      piece.style.background = 'transparent';
      piece.style.width = 'auto';
      piece.style.height = 'auto';
    } else {
      piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      piece.style.width = `${6 + Math.random() * 7}px`;
      piece.style.height = `${6 + Math.random() * 7}px`;
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    }

    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    document.body.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

function makeButtonRunAway(button, container) {
  if (!button || !container) return;

  button.addEventListener('mouseover', () => {
    const rect = container.getBoundingClientRect();
    const btnRect = button.getBoundingClientRect();
    const maxX = rect.width - btnRect.width - 16;
    const maxY = rect.height - btnRect.height - 16;
    button.style.position = 'absolute';
    button.style.left = `${Math.max(8, Math.random() * maxX)}px`;
    button.style.top = `${Math.max(8, Math.random() * maxY)}px`;
    button.style.transition = 'all 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
  });
}

function typeWriter(element, text, speed = 50) {
  return new Promise((resolve) => {
    let i = 0;
    element.textContent = '';
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else resolve();
    }
    type();
  });
}
