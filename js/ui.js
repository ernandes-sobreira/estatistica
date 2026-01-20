// js/ui.js
export function qs(sel){ return document.querySelector(sel); }
export function setText(sel, txt){ const el = qs(sel); if (el) el.textContent = txt; }
export function showError(msg){ alert(msg); }

export function escapeHTML(str){
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[s]));
}
