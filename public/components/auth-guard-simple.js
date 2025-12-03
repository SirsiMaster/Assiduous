/**
 * DEPRECATED: auth-guard-simple.js
 * ---------------------------------
 * This file now delegates entirely to the canonical auth-guard.js implementation.
 * All new pages MUST include /components/auth-guard.js directly.
 */

(function() {
  'use strict';

  // If the canonical guard is already loaded, just exit.
  if (window.authGuard) {
    console.warn('[AuthGuardSimple] Deprecated shim loaded. Use auth-guard.js instead.');
    return;
  }

  // Dynamically load the canonical guard, then expose window.authGuard.
  var script = document.createElement('script');
  script.src = '/components/auth-guard.js';
  script.onload = function() {
    if (!window.authGuard) {
      console.error('[AuthGuardSimple] auth-guard.js loaded but window.authGuard is missing');
      return;
    }
    console.warn('[AuthGuardSimple] Delegating to canonical auth-guard.js');
  };
  script.onerror = function() {
    console.error('[AuthGuardSimple] Failed to load canonical auth-guard.js');
  };
  document.head.appendChild(script);
})();
