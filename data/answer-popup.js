// answer-popup.js — External script for answer-popup.html (MV3 CSP requires no inline scripts)
const params = new URLSearchParams(window.location.search);
const raw = params.get('a') || '?';
const el = document.getElementById('ans');
el.textContent = raw;
// If answer text is long, use smaller font
if (raw.length > 4) el.classList.add('long');
// Auto-close after 8 seconds
setTimeout(() => window.close(), 8000);
