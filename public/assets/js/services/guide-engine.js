(function (global) {
  'use strict';

  // Lightweight in-page guide / tour engine for Assiduous.
  //
  // Usage:
  //   1. Include this script on a page.
  //   2. Register a guide:
  //        AssiduousGuide.register('client-microflip', {
  //          title: 'Micro-Flip Calculator walkthrough',
  //          steps: [
  //            { id: 'purchase', selector: '#purchasePrice', title: 'Purchase price', body: 'Enter the price you expect to pay.' },
  //            ...
  //          ]
  //        });
  //   3. Start from a button click:
  //        AssiduousGuide.start('client-microflip');

  var guides = {};
  var active = null;

  function createOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'assiduous-guide-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(15,23,42,0.4)';
    overlay.style.zIndex = '9998';
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease';
    document.body.appendChild(overlay);
    requestAnimationFrame(function () {
      overlay.style.opacity = '1';
    });
    return overlay;
  }

  function createTooltip() {
    var box = document.createElement('div');
    box.id = 'assiduous-guide-tooltip';
    box.style.position = 'fixed';
    box.style.maxWidth = '320px';
    box.style.padding = '12px 14px';
    box.style.background = 'white';
    box.style.borderRadius = '10px';
    box.style.border = '1px solid rgba(148,163,184,0.6)';
    box.style.boxShadow = '0 18px 40px rgba(15,23,42,0.35)';
    box.style.fontSize = '13px';
    box.style.color = '#0f172a';
    box.style.zIndex = '9999';

    box.innerHTML = [
      '<div id="assiduous-guide-title" style="font-weight:600;font-size:14px;margin-bottom:4px;"></div>',
      '<div id="assiduous-guide-body" style="font-size:13px;line-height:1.4;margin-bottom:8px;"></div>',
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">',
      '  <div id="assiduous-guide-step-label" style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;"></div>',
      '  <div style="display:flex;gap:4px;">',
      '    <button id="assiduous-guide-prev" style="font-size:11px;padding:4px 8px;border-radius:999px;border:1px solid #cbd5f5;background:white;cursor:pointer;">Back</button>',
      '    <button id="assiduous-guide-next" style="font-size:11px;padding:4px 12px;border-radius:999px;border:none;background:#2563eb;color:white;cursor:pointer;">Next</button>',
      '    <button id="assiduous-guide-skip" style="font-size:11px;padding:4px 6px;border-radius:999px;border:none;background:transparent;color:#64748b;cursor:pointer;">Skip</button>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(box);
    return box;
  }

  function highlightElement(el) {
    if (!el) return;
    el.classList.add('assiduous-guide-highlight');
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }

  function clearHighlight() {
    var prev = document.querySelectorAll('.assiduous-guide-highlight');
    prev.forEach(function (node) { node.classList.remove('assiduous-guide-highlight'); });
  }

  function positionTooltip(box, el) {
    if (!box || !el) return;
    var rect = el.getBoundingClientRect();
    var top = rect.bottom + 12;
    var left = rect.left;
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    if (left + box.offsetWidth > viewportWidth - 16) {
      left = viewportWidth - box.offsetWidth - 16;
    }
    if (left < 16) left = 16;

    if (top + box.offsetHeight > window.innerHeight - 16) {
      top = Math.max(16, rect.top - box.offsetHeight - 12);
    }

    box.style.top = top + 'px';
    box.style.left = left + 'px';
  }

  function renderStep() {
    if (!active) return;
    var guide = active.guide;
    var stepIndex = active.index;
    var step = guide.steps[stepIndex];
    var overlay = active.overlay || createOverlay();
    active.overlay = overlay;
    var tooltip = active.tooltip || createTooltip();
    active.tooltip = tooltip;

    clearHighlight();

    var target = step.selector ? document.querySelector(step.selector) : null;
    if (!target) {
      // If selector is missing, just place tooltip bottom-right.
      tooltip.style.top = 'auto';
      tooltip.style.bottom = '24px';
      tooltip.style.left = '24px';
    } else {
      highlightElement(target);
      positionTooltip(tooltip, target);
    }

    var titleEl = document.getElementById('assiduous-guide-title');
    var bodyEl = document.getElementById('assiduous-guide-body');
    var labelEl = document.getElementById('assiduous-guide-step-label');

    if (titleEl) titleEl.textContent = step.title || guide.title || 'Guide';
    if (bodyEl) bodyEl.textContent = step.body || '';
    if (labelEl) labelEl.textContent = 'Step ' + (stepIndex + 1) + ' of ' + guide.steps.length;

    var prevBtn = document.getElementById('assiduous-guide-prev');
    var nextBtn = document.getElementById('assiduous-guide-next');
    var skipBtn = document.getElementById('assiduous-guide-skip');

    if (prevBtn) {
      prevBtn.disabled = stepIndex === 0;
      prevBtn.onclick = function () {
        if (active.index > 0) {
          active.index -= 1;
          renderStep();
        }
      };
    }
    if (nextBtn) {
      nextBtn.textContent = stepIndex === guide.steps.length - 1 ? 'Finish' : 'Next';
      nextBtn.onclick = function () {
        if (active.index < guide.steps.length - 1) {
          active.index += 1;
          renderStep();
        } else {
          stop();
        }
      };
    }
    if (skipBtn) {
      skipBtn.onclick = function () { stop(); };
    }
  }

  function stop() {
    if (!active) return;
    clearHighlight();
    if (active.overlay && active.overlay.parentNode) {
      active.overlay.parentNode.removeChild(active.overlay);
    }
    if (active.tooltip && active.tooltip.parentNode) {
      active.tooltip.parentNode.removeChild(active.tooltip);
    }
    active = null;
  }

  function register(key, config) {
    if (!key || !config || !Array.isArray(config.steps)) return;
    guides[key] = {
      title: config.title || '',
      steps: config.steps,
    };
  }

  function start(key) {
    var guide = guides[key];
    if (!guide || !guide.steps.length) return;
    active = {
      guide: guide,
      index: 0,
      overlay: null,
      tooltip: null,
    };
    renderStep();
  }

  // Attach minimal CSS once
  function injectStyles() {
    if (document.getElementById('assiduous-guide-style')) return;
    var style = document.createElement('style');
    style.id = 'assiduous-guide-style';
    style.textContent = '.assiduous-guide-highlight{position:relative;z-index:9999;box-shadow:0 0 0 3px rgba(56,189,248,0.65),0 0 0 9999px rgba(15,23,42,0.25);border-radius:8px;transition:box-shadow 0.2s ease;}';
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }

  global.AssiduousGuide = {
    register: register,
    start: start,
    stop: stop,
  };
})(window);