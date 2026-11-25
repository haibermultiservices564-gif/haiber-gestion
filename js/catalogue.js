/* ============================================================
   HaiBer Gestion — Catalogue partagé avec le site web
   Source unique : catalogue.json publié sur GitHub Pages.
   Repli automatique sur la copie locale pour un usage hors ligne.
   ============================================================ */
(function (global) {
  'use strict';

  const SITE = 'https://haibermultiservices564-gif.github.io/haiber-site/';
  const SOURCES = [
    { url: SITE + 'catalogue.json', source: 'Site web HaiBer (en direct)', api: false },
    { url: 'https://api.github.com/repos/haibermultiservices564-gif/haiber-site/contents/catalogue.json', source: 'GitHub HaiBer (en direct)', api: true }
  ];
  const LOCAL = 'assets/catalogue.json';
  const CACHE_KEY = 'hb_catalog_cache_v1';
  let memory = null;

  function fromCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.data && parsed.data.products ? parsed : null;
    } catch (e) { return null; }
  }

  function saveCache(data, source) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, source, at: Date.now() })); } catch (e) { /* quota */ }
  }

  async function getJSON(url) {
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 6000) : null;
    try {
      const res = await fetch(url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const raw = await res.text();
      try { return JSON.parse(raw); } catch (e) {
        const obj = JSON.parse(raw);
        if (obj.content) {
          const bin = atob(obj.content.replace(/\s/g, ''));
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          return JSON.parse(new TextDecoder('utf-8').decode(bytes));
        }
        throw e;
      }
    } finally { if (timer) clearTimeout(timer); }
  }

  async function load() {
    if (memory) return memory;
    for (const s of SOURCES) {
      try {
        const data = await getJSON(s.url);
        if (data && Array.isArray(data.products) && data.products.length) {
          memory = { data, source: s.source, live: true, site: SITE };
          saveCache(data, s.source);
          return memory;
        }
      } catch (e) { /* essaie la source suivante */ }
    }
    const cached = fromCache();
    if (cached) { memory = { ...cached, live: false, site: SITE }; return memory; }
    try {
      const data = await getJSON(LOCAL);
      memory = { data, source: 'Copie locale (hors ligne)', live: false, site: SITE };
      return memory;
    } catch (e) {
      return { data: { products: [], categories: [], packs: [], meta: {} }, source: 'Indisponible', live: false, site: SITE };
    }
  }

  function invalidate() { memory = null; try { localStorage.removeItem(CACHE_KEY); } catch (e) {} }

  global.HBCatalogue = { load, invalidate, SITE };
})(window);
