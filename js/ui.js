/* ============================================================
   HaiBer Gestion — UI helpers
   ============================================================ */
(function (global) {
  'use strict';

  const UI = {
    esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); },
    fcfa(n) { return Math.round(n || 0).toLocaleString('fr-FR') + ' FCFA'; },
    num(n) { return Math.round(n || 0).toLocaleString('fr-FR'); },
    date(s) { if (!s) return '—'; const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString('fr-FR'); },
    logo(cls) { return Store.logoImg(cls); },

    toast(msg, err) {
      const root = document.getElementById('toast-root');
      const el = document.createElement('div');
      el.className = 'toast' + (err ? ' err' : '');
      el.textContent = msg;
      root.appendChild(el);
      setTimeout(() => el.remove(), 2800);
    },

    modal(title, bodyHtml, footHtml) {
      const root = document.getElementById('modal-root');
      root.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head"><h2>${this.esc(title)}</h2><button class="icon-btn" id="modal-close" aria-label="Fermer">✕</button></div>
        <div class="modal-body">${bodyHtml}</div>
        ${footHtml ? '<div class="modal-foot">' + footHtml + '</div>' : ''}
      </div></div>`;
      const close = () => { root.innerHTML = ''; };
      document.getElementById('modal-close').onclick = close;
      root.querySelector('.modal-backdrop').onclick = (e) => { if (e.target.classList.contains('modal-backdrop')) close(); };
      return { close, root };
    },

    confirm(title, msg, onYes) {
      const m = this.modal(title, `<p>${this.esc(msg)}</p>`, `<button class="btn ghost" id="cancel">Annuler</button><button class="btn danger" id="yes">Confirmer</button>`);
      m.root.querySelector('#cancel').onclick = m.close;
      m.root.querySelector('#yes').onclick = () => { m.close(); onYes(); };
    },

    statusChip(step, delivered) {
      if (delivered) return '<span class="chip ok">Livrée · signée</span>';
      const steps = Store.steps;
      const cls = step >= 5 ? 'ok' : step >= 3 ? '' : 'warn';
      return `<span class="chip ${cls}">${this.esc(steps[step] || 'Étape ' + step)}</span>`;
    },

    steps(step) {
      const steps = Store.steps;
      return `<div class="steps">${steps.map((_, i) => `<i class="${i < step ? 'done' : i === step ? 'current' : ''}"></i>`).join('')}</div><div class="small muted">${steps[step] || ''}</div>`;
    },

    empty(title, text, icon) {
      return `<div class="empty"><div class="big">${icon || '◌'}</div><h3>${this.esc(title)}</h3><p>${this.esc(text)}</p></div>`;
    },

    table(headers, rows) {
      if (!rows.length) return this.empty('Aucune donnée', 'Les éléments ajoutés apparaîtront ici.');
      return `<div class="table-wrap"><table><thead><tr>${headers.map(h => `<th class="${h.num ? 'num' : ''}">${this.esc(h && h.label !== undefined ? h.label : h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
    }
  };

  global.UI = UI;
})(window);
