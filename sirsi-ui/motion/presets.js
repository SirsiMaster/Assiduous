// Motion One presets (vanilla JS)
export function pageFade(target = document.body, options = {}) {
  return window.motionOne?.animate(target, { opacity: [0, 1] }, { duration: 0.5, easing: 'ease-out', ...options });
}

export function sectionSlideUp(el, i = 0, options = {}) {
  return window.motionOne?.animate(el, { y: [16, 0], opacity: [0, 1] }, { duration: 0.45, delay: Math.min(i * 0.05, 0.3), easing: 'ease-out', fill: 'forwards', ...options });
}

export function cardHoverLift(el, options = {}) {
  el.addEventListener('mouseenter', () => window.motionOne?.animate(el, { y: -4 }, { duration: 0.2, ...options }));
  el.addEventListener('mouseleave', () => window.motionOne?.animate(el, { y: 0 }, { duration: 0.2, ...options }));
}

