/* ============================================================
   HaiBer Gestion — Application controller
   ============================================================ */
(function (global) {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const SITE_ORDERS_KEY = 'haiber_site_orders_v1';

  function siteOrders() {
    try {
      const v = JSON.parse(localStorage.getItem(SITE_ORDERS_KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  function saveSiteOrders(list) {
    try { localStorage.setItem(SITE_ORDERS_KEY, JSON.stringify(list.slice(0, 100))); } catch (e) {}
  }
  function unreadSiteOrders() { return siteOrders().filter(o => !o.seen); }
  function setSiteOrderSeen(id, seen) {
    const list = siteOrders();
    const item = list.find(o => o.id === id);
    if (!item) return;
    item.seen = !!seen;
    saveSiteOrders(list);
    refreshSiteOrderIndicators();
    if (page === 'site-orders') vSiteOrders();
  }

  function printDoc(title, subtitle, rows, note) {
    const org = Store.org();
    const w = window.open('', '_blank');
    if (!w) { UI.toast('Autorisez les fenêtres pop-up pour imprimer', true); return; }
    w.document.write(`<html><head><meta charset="utf-8"><title>${UI.esc(title)}</title><style>
      body{font:13px sans-serif;color:#0B122F;padding:25px;max-width:700px;margin:auto}
      h1{color:#3A4F9E;font-size:20px;margin:0}h2{color:#E21481;font-size:16px;margin:10px 0}
      table{width:100%;border-collapse:collapse;margin-top:12px}td{padding:7px;border-bottom:1px solid #ddd}
      td:last-child{text-align:right;font-weight:bold}.total{font-size:15px;color:#3A4F9E}
      .foot{margin-top:25px;font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:8px}
      </style></head><body>
      <h1>${UI.esc(org.name)}</h1><div class="small">${UI.esc(org.ifu)} · ${UI.esc(org.rccm)} · ${UI.esc(org.settings.phone)}</div>
      <h2>${UI.esc(title)}</h2><div>${UI.esc(subtitle)}</div>
      <table>${rows.map(r => `<tr><td>${UI.esc(r[0])}</td><td>${UI.esc(r[1])}</td></tr>`).join('')}</table>
      <p>${UI.esc(note || '')}</p>
      <div class="foot">HaiBer — Conception · Packaging · Impression · Multi-média · Résine · ${UI.esc(Store.orgSettings().phone || '')}<br>Conçu par Touch Unique · +226 55 04 15 30</div>
      </body></html>`);
    w.document.close();
    setTimeout(() => { if (typeof w.print === 'function') w.print(); }, 250);
  }

  const NAV = [
    { group: 'Pilotage' },
    { id: 'home', label: 'Accueil', icon: '⌂' },
    { id: 'quotes', label: 'Devis', icon: '₣' },
    { id: 'orders', label: 'Commandes', icon: '▤' },
    { id: 'site-orders', label: 'Commandes du site', icon: '🌐' },
    { id: 'production', label: 'Production', icon: '▣' },
    { id: 'history', label: 'Historique', icon: '⏱' },
    { group: 'Gestion' },
    { id: 'clients', label: 'Clients', icon: '♙' },
    { id: 'invoices', label: 'Factures', icon: '📄' },
    { id: 'payments', label: 'Paiements', icon: '💳' },
    { id: 'cash', label: 'Caisse', icon: '🧾' },
    { id: 'credits', label: 'Créances', icon: '⏳' },
    { id: 'stocks', label: 'Stocks', icon: '📦' },
    { id: 'designs', label: 'Conceptions', icon: '🎨' },
    { id: 'motifs', label: 'Fiches motifs', icon: '◇' },
    { id: 'galerie', label: 'Galerie & motion', icon: '✦' },
    { id: 'catalogue', label: 'Catalogue', icon: '▤' },
    { group: 'Système' },
    { id: 'settings', label: 'Réglages', icon: '⚙' },
    { id: 'about', label: 'À propos', icon: 'ⓘ' }
  ];

  const TITLES = {
    home: ['Accueil', 'Tableau de bord'], quotes: ['Devis', 'Moteur de coûts partagé'],
    orders: ['Commandes', 'Suivi des commandes'],
    'site-orders': ['Commandes du site', 'Demandes reçues depuis la boutique HaiBer'],
    production: ['Production', 'Suivi par poste'],
    history: ['Historique', 'Toutes les productions passées'],
    clients: ['Clients', 'Annuaire client'], invoices: ['Factures', 'Facturation et conformité'],
    payments: ['Paiements', 'Mobile money et virements'], cash: ['Caisse', 'Vente rapide et clôture'],
    credits: ['Créances', 'Impayés, échéances et relances'], stocks: ['Stocks', 'Stocks prédictifs'],
    designs: ['Conceptions', 'Archives des maquettes et fichiers'],
    motifs: ['Fiches motifs', 'Bibliothèque des patrons et motifs atelier'],
    galerie: ['Galerie & motion', 'Visuels HaiBer et motion design'],
    catalogue: ['Catalogue', 'Catalogue officiel HaiBer — synchronisé avec le site web'],
    settings: ['Réglages', 'Règles métier modifiables'], about: ['À propos', 'HaiBer Gestion']
  };

  // Visuels officiels HaiBer intégrés à l'application (fichiers locaux, hors ligne).
  const GALLERY = [
    { file: 'couverture.jpg', caption: 'Couverture HaiBer Multi-Services' },
    { file: 'branding.jpg', caption: 'Branding HaiBer' },
    { file: 'conception.jpg', caption: 'Conception graphique' },
    { file: 'numerique.jpg', caption: 'Impression numérique' },
    { file: 'imprimerie.jpg', caption: 'Imprimerie & sérigraphie' },
    { file: 'resine.jpg', caption: 'Atelier résine' },
    { file: 'offre-services.jpg', caption: 'Offre de services' },
    { file: 'etiquette.jpg', caption: 'Étiquettes & packaging' },
    { file: 'contact-visuel.jpg', caption: 'Visuel de contact' }
  ];

  const ROLES = ['administrateur', 'commercial', 'operateur', 'magasinier', 'comptable', 'livreur', 'client'];
  let currentUser = null;
  let page = 'home';
  let quoteDraft = null;
  let catalogState = null;
  let catalogFilter = 'Tous';
  let catalogQuery = '';
  let selectedOrder = null;

  function login() {
    const users = Store.users(), demo = Store.isDemo();
    $('#login-root').setAttribute('role', 'main');
    $('#login-root').innerHTML = `<div class="login-wrap"><div class="login-card">
      <div class="login-logo">${UI.logo()}</div>
      <h1>HAIBER</h1>
      <p class="slogan">CONCEPTION · PACKAGING · IMPRESSION · MULTI-MÉDIA · RÉSINE</p>
      ${demo ? `
        <span class="chip warn" style="margin-bottom:8px">MODE DÉMONSTRATION</span>
        <label for="email">Identifiant</label>
        <input class="field" id="email" value="${users[0] ? UI.esc(users[0].email) : ''}" autocomplete="off">
        <label for="role">Rôle</label>
        <select class="field" id="role">${ROLES.map(r => `<option>${r}</option>`).join('')}</select>` : `
        <label for="pin">Code d’accès</label>
        <input class="field" id="pin" type="password" inputmode="numeric" maxlength="12" placeholder="Votre code local" autocomplete="off">
        <div class="small muted" style="margin-top:6px">${UI.esc(users[0]?.name || 'Administrateur')} · ${UI.esc(Store.org().name)}</div>`}
      <div class="spacer"></div>
      <button class="btn primary block" id="go">Se connecter</button>
      ${demo ? '<button class="btn teal block" id="setup-start" style="margin-top:8px">⚙ Configurer mon atelier</button>' : ''}
      <div class="login-hint">${demo
        ? 'Données fictives de démonstration. Aucune donnée n’est envoyée.'
        : 'Données de votre atelier, conservées sur cet appareil. Sauvegardez régulièrement via Réglages.'}<br>Support HaiBer : <a href="https://wa.me/22606879710" target="_blank">+226 06 87 97 10</a></div>
    </div></div>`;
    $('#go').onclick = () => {
      if (!demo) {
        if (!Store.verifyPin($('#pin').value)) { UI.toast('Code d’accès incorrect', true); return; }
        currentUser = Store.users()[0];
        startApp();
        return;
      }
      const email = $('#email').value.trim().toLowerCase();
      const role = $('#role').value;
      const u = users.find(x => x.email.toLowerCase() === email) || users.find(x => x.role === role);
      currentUser = u || { id: 'GUEST', name: email || 'Invité', email, role };
      startApp();
    };
    if ($('#setup-start')) $('#setup-start').onclick = setupWizard;
  }

  function setupWizard() {
    const r = Store.rules(), o = Store.org();
    const lines = v => (v || '').split('\n').map(s => s.trim()).filter(Boolean);
    const m = UI.modal('Configuration initiale de l’atelier', `
      <div class="small muted">Les données fictives (clients, commandes, factures, stocks) seront <b>supprimées définitivement</b>. Exportez d’abord une sauvegarde si vous souhaitez les conserver.</div>
      <div class="divider"></div>
      <h3>1. Votre organisation</h3>
      <div class="form-grid">
        <div style="grid-column:1/-1"><label>Nom de l’entreprise</label><input class="field" id="su-name" placeholder="Ex. HaiBer Multi-Services"></div>
        <div><label>IFU</label><input class="field" id="su-ifu" placeholder="Numéro IFU"></div>
        <div><label>RCCM</label><input class="field" id="su-rccm" placeholder="Numéro RCCM"></div>
        <div><label>Téléphone support / WhatsApp HaiBer</label><input class="field" id="su-phone" value="+226 06 87 97 10"></div>
        <div><label>Téléphone secondaire</label><input class="field" id="su-phone2" value="+226 60 28 31 31"></div>
        <div><label>Ville / siège</label><input class="field" id="su-city" value="Cissin, non loin de la boulangerie Wend-Konta, Ouagadougou"></div>
        <div><label>E-mail de contact</label><input class="field" id="su-contact-email" value="haibermultiservices@gmail.com"></div>
        <div><label>Pays</label><input class="field" id="su-country" value="Burkina Faso"></div>
        <div><label>Devise</label><input class="field" id="su-currency" value="FCFA"></div>
        <div><label>TVA (%)</label><input class="field" type="number" id="su-tva" value="${o.settings.tva}"></div>
        <div style="grid-column:1/-1"><label>Tagline</label><input class="field" id="su-tagline" value="Votre communication, notre mission !"></div>
        <div style="grid-column:1/-1"><label>Livraison</label><input class="field" id="su-delivery" value="Partout au Burkina Faso et dans la sous-région, à vos frais"></div>
      </div>
      <div class="divider"></div>
      <h3>2. Administrateur et accès local</h3>
      <div class="form-grid">
        <div><label>Nom de l’administrateur</label><input class="field" id="su-admin" placeholder="Prénom Nom"></div>
        <div><label>E-mail (facultatif)</label><input class="field" id="su-email" placeholder="admin@atelier.bf"></div>
        <div><label>Code d’accès (4 à 12 caractères)</label><input class="field" type="password" id="su-pin" maxlength="12"></div>
        <div><label>Confirmer le code</label><input class="field" type="password" id="su-pin2" maxlength="12"></div>
      </div>
      <div class="divider"></div>
      <h3>3. Vos données de départ</h3>
      <div class="form-grid">
        <div style="grid-column:1/-1"><label>Catalogue caisse — une ligne par article : <b>Nom|prix</b></label><textarea class="field" id="su-catalog" rows="4">${(r.catalog || []).map(c => c.name + '|' + c.price).join('\n')}</textarea></div>
        <div style="grid-column:1/-1"><label>Fournisseurs — un par ligne</label><textarea class="field" id="su-suppliers" rows="3">${(r.suppliers || []).join('\n')}</textarea></div>
        <div><label>Domaine application (si serveur)</label><input class="field" id="su-app" value="${UI.esc(r.domains?.app || '')}"></div>
        <div><label>Domaine API (si serveur)</label><input class="field" id="su-api" value="${UI.esc(r.domains?.api || '')}"></div>
        <div><label>Portail client (si serveur)</label><input class="field" id="su-portal" value="${UI.esc(r.domains?.portal || '')}"></div>
      </div>
      <label class="check" style="margin-top:14px"><input type="checkbox" id="su-ok"> J’ai compris que les données de démonstration seront remplacées.</label>
    `, `<button class="btn ghost" id="su-cancel">Annuler</button><button class="btn primary" id="su-ok-btn">Configurer l’atelier</button>`);
    $('#su-cancel').onclick = m.close;
    $('#su-ok-btn').onclick = () => {
      const name = $('#su-name').value.trim(), admin = $('#su-admin').value.trim();
      const pin = $('#su-pin').value, pin2 = $('#su-pin2').value;
      if (!name || !admin) return UI.toast('Nom de l’entreprise et administrateur requis', true);
      if (pin.length < 4 || pin !== pin2) return UI.toast('Code d’accès invalide ou non confirmé', true);
      if (!$('#su-ok').checked) return UI.toast('Confirmez la suppression des données de démo', true);
      const catalog = lines($('#su-catalog').value).map(l => {
        const parts = l.split('|').map(s => s.trim());
        return { name: parts[0], price: Number(parts[1]) || 0 };
      }).filter(x => x.name);
      Store.applySetup({
        name, ifu: $('#su-ifu').value.trim(), rccm: $('#su-rccm').value.trim(),
        phone: $('#su-phone').value.trim(), phone2: $('#su-phone2').value.trim(),
        email: $('#su-contact-email').value.trim(),
        city: $('#su-city').value.trim(),
        tagline: $('#su-tagline').value.trim(), delivery: $('#su-delivery').value.trim(),
        country: $('#su-country').value.trim(),
        currency: $('#su-currency').value.trim() || 'FCFA', tva: Number($('#su-tva').value) || 0,
        adminName: admin, adminEmail: $('#su-email').value.trim(), pin,
        catalog, suppliers: lines($('#su-suppliers').value),
        paymentMethods: r.paymentMethods,
        domains: { app: $('#su-app').value.trim(), api: $('#su-api').value.trim(), portal: $('#su-portal').value.trim() }
      });
      m.close();
      UI.toast('Atelier configuré — données fictives supprimées');
      login();
    };
  }

  function startApp() {
    $('#login-root').innerHTML = '';
    $('#login-root').removeAttribute('role');
    $('#app-root').classList.remove('hidden');
    renderShell();
    go('home');
  }

  function renderShell() {
    const org = Store.org();
    $('#brand-logo').innerHTML = UI.logo();
    $('#org-badge').innerHTML = `<span class="dot"></span><span>${UI.esc(org.name)}</span>${Store.isDemo() ? '<span class="chip warn" style="margin-left:6px">DÉMO</span>' : ''}`;
    $('#side-nav').innerHTML = NAV.map(n => n.group
      ? `<div class="nav-group">${n.group}</div>`
      : `<button class="nav-item" data-page="${n.id}"><span class="ico">${n.icon}</span>${n.label}${n.id === 'orders' ? `<span class="badge">${Store.orders().length}</span>` : ''}${n.id === 'site-orders' ? `<span class="badge" id="site-orders-badge" style="display:none">0</span>` : ''}</button>`
    ).join('');
    $$('.nav-item').forEach(b => b.onclick = () => { go(b.dataset.page); $('#sidebar').classList.remove('open'); });
    const initials = (currentUser.name || 'U').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
    $('#user-chip').innerHTML = `<div class="avatar">${initials}</div><span>${UI.esc(currentUser.name)}<br><small class="muted">${UI.esc(currentUser.role)}</small></span>`;
    $('#btn-menu').onclick = () => $('#sidebar').classList.toggle('open');
    $('#btn-logout').onclick = () => { currentUser = null; $('#app-root').classList.add('hidden'); login(); };
    $('#btn-theme').onclick = toggleTheme;
    $('#btn-notif').onclick = showNotifications;
    const old = $('#readonly-bar');
    if (old) old.remove();
    if (Store.readOnly()) {
      $('#content').insertAdjacentHTML('beforebegin', `<div id="readonly-bar" class="readonly-bar">⏳ Licence expirée — lecture seule. Vos données sont intactes et exportables depuis Réglages.</div>`);
    }
    $('#ai-fab').classList.remove('hidden');
    $('#ai-fab').onclick = toggleAI;
    refreshSiteOrderIndicators();
  }

  function toggleAI() {
    const panel = $('#ai-panel');
    if (!panel.classList.contains('hidden')) { panel.classList.add('hidden'); return; }
    panel.classList.remove('hidden');
    panel.innerHTML = `<div class="ai-head"><div class="avatar-ai">✦</div><div><b>Assistant HaiBer</b><small>Interroge vos productions passées</small></div><button id="ai-close">✕</button></div>
      <div class="ai-body" id="ai-body"></div>
      <div class="ai-suggest">${Assistant.suggestions.slice(0,4).map(s => `<button data-q="${UI.esc(s)}">${UI.esc(s)}</button>`).join('')}</div>
      <div class="ai-input"><input class="field" id="ai-text" placeholder="Posez votre question…"><button class="btn teal" id="ai-send">Envoyer</button></div>`;
    $('#ai-close').onclick = () => panel.classList.add('hidden');
    const body = $('#ai-body');
    const welcome = Store.aiChats().slice(-8);
    body.innerHTML = `<div class="ai-msg bot">Bonjour ! Je suis l’assistant HaiBer. Je connais vos commandes, devis, factures, stocks et conceptions. Posez-moi une question sur votre activité.${welcome.length ? '\n\nDernière question : ' + UI.esc(welcome[welcome.length-1].q) : ''}</div>`;
    const send = () => {
      const text = $('#ai-text').value.trim();
      if (!text) return;
      appendMsg('me', text);
      $('#ai-text').value = '';
      const r = Assistant.ask(text);
      setTimeout(() => {
        appendMsg('bot', r.answer, r.sources);
        Store.add('aiChats', { id: Store.uid('AI'), orgId: Store.db.activeOrg, q: text, a: r.answer, at: r.at });
      }, 180);
    };
    const appendMsg = (who, text, sources) => {
      const el = document.createElement('div');
      el.className = 'ai-msg ' + who;
      el.innerHTML = UI.esc(text).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
      if (sources && sources.length) {
        const s = document.createElement('div'); s.className = 'src';
        s.textContent = 'Sources : ' + sources.map(x => x.type + ' ' + x.ref).join(' · ');
        el.appendChild(s);
      }
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
    };
    $('#ai-send').onclick = send;
    $('#ai-text').onkeydown = e => { if (e.key === 'Enter') send(); };
    $$('[data-q]', panel).forEach(b => b.onclick = () => { $('#ai-text').value = b.dataset.q; send(); });
  }

  function toggleTheme() {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('hb_theme', root.dataset.theme); } catch (e) {}
  }

  function updateNotif() {
    const low = Store.stocks().filter(s => s.qty <= s.min).length;
    const web = unreadSiteOrders().length;
    $('#notif-dot').style.display = (low || web) ? 'block' : 'none';
  }

  function refreshSiteOrderIndicators() {
    const badge = $('#site-orders-badge');
    const count = unreadSiteOrders().length;
    if (badge) { badge.textContent = count; badge.style.display = count ? 'inline-block' : 'none'; }
    updateNotif();
  }

  function showNotifications() {
    const low = Store.stocks().filter(s => s.qty <= s.min);
    const late = Store.orders().filter(o => o.step < 5).length;
    const web = unreadSiteOrders();
    UI.modal('Notifications', `<div class="stack">
      <div class="card"><h3>${web.length} commande(s) du site à traiter</h3><div class="muted small">${web.length ? 'Ouvrez la section « Commandes du site » pour voir les détails et les coordonnées du client.' : 'Aucune nouvelle demande reçue.'}</div>${web.length ? '<button class="btn primary sm" id="open-web-orders" style="margin-top:8px">Voir les commandes du site</button>' : ''}</div>
      <div class="card"><h3>${late} commande(s) en cours</h3><div class="muted small">Suivez l’avancement dans Production.</div></div>
      <div class="card"><h3>${low.length} stock(s) critique(s)</h3>${low.length ? low.map(s => `<div class="row"><span>${UI.esc(s.name)}</span><span class="chip warn">${s.qty} ${UI.esc(s.unit)} restants</span></div>`).join('') : '<div class="muted small">Aucune alerte.</div>'}</div>
    </div>`, `<button class="btn ghost" id="close">Fermer</button>`);
    $('#close').onclick = () => $('#modal-root').innerHTML = '';
    const open = $('#open-web-orders');
    if (open) open.onclick = () => { $('#modal-root').innerHTML = ''; go('site-orders'); };
  }

  function go(p) {
    page = p;
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === p));
    const t = TITLES[p] || [p, ''];
    $('#page-title').textContent = t[0];
    $('#page-subtitle').textContent = t[1];
    ({ home: vHome, quotes: vQuotes, orders: vOrders, 'site-orders': vSiteOrders, production: vProduction,
       history: vHistory, clients: vClients, invoices: vInvoices, payments: vPayments,
       cash: vCash, credits: vCredits, stocks: vStocks, designs: vDesigns,
       motifs: vMotifs, galerie: vGallery, catalogue: vCatalogue, settings: vSettings, about: vAbout }[p] || vHome)();
  }

  /* ---------- Dashboard ---------- */
  function vHome() {
    const orders = Store.orders(), stocks = Store.stocks(), invoices = Store.invoices();
    const enCours = orders.filter(o => o.step < 5).length;
    const prets = orders.filter(o => o.step === 5).length;
    const low = stocks.filter(s => s.qty <= s.min);
    const ca = invoices.reduce((a, i) => a + (i.ttc || 0), 0);
    const qs = Store.quotes();
    const baseTotal = qs.reduce((a, q) => a + (q.base || 0), 0);
    const htTotal = qs.reduce((a, q) => a + (q.ht || 0), 0);
    const marge = htTotal ? Math.round((htTotal - baseTotal) / htTotal * 100) : 0;
    const aLivrer = orders.filter(o => o.due === Store.today() && !o.delivered);
    const perimes = stocks.filter(s => s.expiry && new Date(s.expiry) <= new Date(Date.now() + 15 * 86400000));
    $('#content').innerHTML = `
      <div class="grid kpi">
        <div class="kpi-card"><b>${enCours}</b><span>Commandes en cours</span></div>
        <div class="kpi-card"><b>${prets}</b><span>Prêtes à livrer</span></div>
        <div class="kpi-card"><b>${low.length}</b><span>Stocks critiques</span></div>
        <div class="kpi-card"><b>${UI.fcfa(ca)}</b><span>Chiffre d’affaires facturé</span></div>
      </div>
      <div class="grid kpi" style="margin-top:10px">
        <div class="kpi-card"><b>${marge} %</b><span>Marge moyenne devis</span></div>
        <div class="kpi-card"><b>${aLivrer.length}</b><span>À livrer aujourd’hui</span></div>
        <div class="kpi-card"><b>${perimes.length}</b><span>Péremptions à surveiller</span></div>
        <div class="kpi-card"><b>${Store.motifs().length}</b><span>Fiches motifs</span></div>
      </div>
      <div class="spacer"></div>
      <div class="grid two">
        <div class="card">
          <div class="card-head"><h3>Accès rapides</h3></div>
          <div class="grid two">
            <button class="btn primary" id="q-new">Nouveau devis</button>
            <button class="btn teal" id="o-new">Nouvelle commande</button>
            <button class="btn ghost" id="go-stock">Voir les stocks</button>
            <button class="btn ghost" id="go-fact">Facturer</button>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Alertes stocks</h3><span class="chip warn">${low.length}</span></div>
          ${low.length ? low.map(s => `<div class="row"><span>${UI.esc(s.alert || s.name)}</span><span class="chip warn">${s.qty} ${UI.esc(s.unit)}</span></div>`).join('') : '<div class="muted small">Tous les stocks sont au-dessus du seuil.</div>'}
          ${perimes.length ? `<div class="divider"></div>${perimes.map(s => `<div class="row"><span>⏳ ${UI.esc(s.name)} — péremption ${UI.date(s.expiry)}</span><span class="chip warn">À vérifier</span></div>`).join('')}` : ''}
        </div>
      </div>
      <div class="section-title">À livrer aujourd’hui</div>
      <div class="card">${aLivrer.length ? UI.table(
        [{label:'Commande'},{label:'Client'},{label:'Métier'},{label:'Étape'}],
        aLivrer.map(o => `<tr><td><b>${UI.esc(o.id)}</b></td><td>${UI.esc(Store.client(o.clientId)?.name || '—')}</td><td>${UI.esc(o.metier || '—')}</td><td>${UI.statusChip(o.step, o.delivered)}</td></tr>`)
      ) : '<div class="muted small">Aucune livraison prévue aujourd’hui.</div>'}</div>
      <div class="section-title">Dernières commandes</div>
      <div class="card">${UI.table(
        [{label:'Commande'},{label:'Client'},{label:'Description'},{label:'Étape'},{label:'Date'}],
        orders.slice(0,6).map(o => `<tr><td><b>${UI.esc(o.id)}</b></td><td>${UI.esc(Store.client(o.clientId)?.name || '—')}</td><td>${UI.esc(o.desc)}</td><td>${UI.statusChip(o.step, o.delivered)}</td><td>${UI.date(o.date)}</td></tr>`)
      )}</div>`;
    $('#q-new').onclick = () => go('quotes');
    $('#o-new').onclick = () => newOrderModal();
    $('#go-stock').onclick = () => go('stocks');
    $('#go-fact').onclick = () => go('invoices');
  }

  /* ---------- Quotes ---------- */
  function quoteForm() {
    const r = Store.rules();
    const d = quoteDraft || {
      module: 'conception',
      designType: 'Logo', hours: 4, revisions: 0, bat: true,
      preflightDpi: 300, preflightBleed: true, preflightColors: 'CMYK',
      batChannel: 'Lien + WhatsApp', versions: 2,
      boxModel: 'Carton 350 g', q: 100, l: 24, wBox: 18, hBox: 8,
      newDie: true, dieTemplate: true, sachet: false, etiquette: false,
      depliant: false, lamination: false, dorure: false, sheetOptim: true,
      printType: 'numerique', w: 3, h: 2, support: 'Bâche 510 g',
      format: 'A4', pages: 1, qNum: 500, supportSer: 'textile',
      colors: 2, positions: 2, detail: 1, bleed: true, grammage: 250,
      mediaType: 'Montage vidéo', mediaHours: 3, durationMin: 3,
      motionStyle: 'Logo animé', motionDuration: 15, motionVersions: 2, motionFormat: 'MP4',
      mediaSubscription: 'Aucun',
      voiceOver: false, subtitles: false,
      resinType: 'Époxy', lRes: 120, wRes: 60, thickness: 1,
      mold: false, motif: '', lot: 'LOT-2401', tempAtelier: 25, pricePiece: 0,
      marge: Store.orgSettings().margeDefaut || 30,
      remise: 0, express: false, depositPct: 30
    };
    quoteDraft = d;
    const clientOpts = Store.clients().map(c => `<option value="${c.id}" ${d.clientId === c.id ? 'selected' : ''}>${UI.esc(c.name)}</option>`).join('');
    const sel = (key, list) => list.map(x => `<option value="${typeof x === 'string' ? x : x.id}" ${d[key] === (typeof x === 'string' ? x : x.id) ? 'selected' : ''}>${UI.esc(typeof x === 'string' ? x : x.label)}</option>`).join('');
    const chk = (key, label) => `<div class="check"><input type="checkbox" data-f="${key}" ${d[key] ? 'checked' : ''}><label>${label}</label></div>`;
    const num = (key, label, step, min) => `<div><label>${label}</label><input class="field" type="number" ${step ? 'step="' + step + '"' : ''} ${min ? 'min="' + min + '"' : ''} data-f="${key}" value="${d[key]}"></div>`;
    const txt = (key, label, ph) => `<div><label>${label}</label><input class="field" data-f="${key}" value="${UI.esc(d[key] || '')}" placeholder="${ph || ''}"></div>`;

    let atelier = '';
    if (d.module === 'conception') {
      atelier = `<div class="form-grid">
        <div><label>Prestation</label><select class="field" data-f="designType">${sel('designType', Object.keys(r.prices.conception))}</select></div>
        ${num('hours', 'Heures estimées', '0.5', '0.5')}
        ${num('revisions', 'Nombre de révisions', '', '0')}
        ${num('preflightDpi', 'Préflight — résolution (dpi)', '', '72')}
        <div><label>Préflight — couleurs</label><select class="field" data-f="preflightColors">${sel('preflightColors', ['CMYK', 'RVB', 'Pantone'])}</select></div>
        <div><label>BAT envoyé par</label><select class="field" data-f="batChannel">${sel('batChannel', ['Lien + WhatsApp', 'WhatsApp', 'E-mail', 'Remise main propre'])}</select></div>
        ${num('versions', 'Versions conservées', '', '1')}
      </div><div class="grid three" style="margin-top:12px">${chk('bat', 'BAT / validation client')}${chk('preflightBleed', 'Fond perdu contrôlé')}</div>`;
    } else if (d.module === 'packaging') {
      atelier = `<div class="form-grid">
        <div><label>Matériau</label><select class="field" data-f="boxModel">${sel('boxModel', Object.keys(r.prices.packaging))}</select></div>
        ${num('l', 'Longueur (cm)', '0.5', '1')}${num('wBox', 'Largeur (cm)', '0.5', '1')}${num('hBox', 'Hauteur (cm)', '0.5', '1')}
        ${num('q', 'Quantité', '', '1')}
      </div><div class="grid three" style="margin-top:12px">
        ${chk('newDie', 'Nouvel outillage de découpe')}${chk('dieTemplate', 'Patron bibliothèque disponible')}${chk('bat', 'BAT en attente')}
        ${chk('sachet', 'Sachet personnalisé')}${chk('etiquette', 'Étiquette')}${chk('depliant', 'Dépliant')}
        ${chk('lamination', 'Pelliculage')}${chk('dorure', 'Dorure')}${chk('sheetOptim', 'Optimisation découpe sur feuille')}
      </div>`;
    } else if (d.module === 'imprimerie') {
      atelier = `<div class="form-grid">
        <div style="grid-column:1/-1"><label>Procédé</label><select class="field" data-f="printType">${sel('printType', Engine.printTypes())}</select></div>
      </div><div class="divider"></div>`;
      if (d.printType === 'numerique') {
        atelier += `<div class="form-grid">
          <div><label>Format</label><select class="field" data-f="format">${sel('format', Object.keys(r.prices.numerique))}</select></div>
          ${num('pages', 'Pages', '', '1')}${num('qNum', 'Exemplaires', '', '1')}${num('grammage', 'Grammage (g)', '', '1')}
        </div><div class="grid three" style="margin-top:12px">
          ${chk('rectoVerso', 'Recto verso')}${chk('binding', 'Dos carré collé')}${chk('cutting', 'Coupe')}
          ${chk('pantone', 'Pantone')}${chk('lamination', 'Pelliculage')}${chk('bleed', 'Fond perdu OK')}${chk('bat', 'BAT en attente')}
        </div>`;
      } else if (d.printType === 'grandformat') {
        atelier += `<div class="form-grid">
          ${num('w', 'Largeur (m)', '0.1', '0.1')}${num('h', 'Hauteur (m)', '0.1', '0.1')}${num('q', 'Quantité', '', '1')}
          <div><label>Support</label><select class="field" data-f="support">${sel('support', Object.keys(r.prices.grandformat))}</select></div>
        </div><div class="grid three" style="margin-top:12px">
          ${chk('eyelets', 'Œillets / 50 cm')}${chk('hem', 'Ourlets')}${chk('lamination', 'Laminage')}${chk('bat', 'BAT en attente')}
        </div>`;
      } else {
        atelier += `<div class="form-grid">
          <div><label>Support</label><select class="field" data-f="supportSer">${sel('supportSer', Object.keys(r.prices.serigraphie))}</select></div>
          ${num('q', 'Quantité', '', '1')}${num('colors', 'Couleurs', '', '1')}${num('positions', 'Emplacements', '', '1')}
          ${num('detail', 'Détail min. (mm)', '0.1', '0.1')}
        </div><div class="grid three" style="margin-top:12px">${chk('bat', 'BAT en attente')}</div>`;
      }
    } else if (d.module === 'multimedia') {
      const isMotion = /motion|anim/i.test(d.mediaType || '');
      atelier = `<div class="form-grid">
        <div><label>Prestation</label><select class="field" data-f="mediaType">${sel('mediaType', Object.keys(r.prices.multimedia))}</select></div>
        ${num('mediaHours', 'Heures de montage', '0.5', '0.5')}${num('durationMin', 'Durée vidéo (min)', '0.5', '0')}
      </div>`;
      if (isMotion) {
        atelier += `<div class="divider"></div><div class="form-grid">
          <div><label>Style d’animation</label><select class="field" data-f="motionStyle">${sel('motionStyle', ['Logo animé','Motion 2D','Motion 3D','Typographie animée'])}</select></div>
          ${num('motionDuration', 'Durée (secondes)', '1', '1')}
          ${num('motionVersions', 'Nombre de versions', '', '1')}
          <div><label>Format de livraison</label><select class="field" data-f="motionFormat">${sel('motionFormat', ['MP4','GIF','HTML5','Toutes'])}</select></div>
        </div>`;
      }
      atelier += `<div class="grid three" style="margin-top:12px">
        ${chk('voiceOver', 'Voix off')}${chk('subtitles', 'Sous-titres')}${chk('bat', 'Validation du montage')}
      </div><div class="form-grid" style="margin-top:10px">
        <div><label>Abonnement mensuel (facultatif)</label><select class="field" data-f="mediaSubscription">${sel('mediaSubscription', Object.keys(r.mediaSubscriptions || {}))}</select></div>
        <div class="small muted" style="align-self:end">Suivi des projets : brief, étapes, fichiers livrés et heures passées.</div>
      </div>`;
    } else {
      const motifs = Store.motifs().map(m => `<option value="${m.id}" ${d.motif === m.id ? 'selected' : ''}>${UI.esc(m.name)}</option>`).join('');
      atelier = `<div class="form-grid">
        <div><label>Résine</label><select class="field" data-f="resinType">${sel('resinType', Object.keys(r.prices.resine))}</select></div>
        ${num('lRes', 'Longueur (cm)', '0.5', '1')}${num('wRes', 'Largeur (cm)', '0.5', '1')}${num('thickness', 'Épaisseur (cm)', '0.1', '0.2')}
        ${num('q', 'Quantité', '', '1')}
        <div><label>Fiche motif</label><select class="field" data-f="motif"><option value="">— Aucune —</option>${motifs}</select></div>
        ${txt('lot', 'Lot de production', 'LOT-2401')}
        ${num('tempAtelier', 'Température atelier (°C)', '', '0')}
        ${num('pricePiece', 'Prix de vente / pièce (FCFA)', '', '0')}
      </div><div class="grid three" style="margin-top:12px">
        ${chk('mold', 'Moule silicone à fabriquer')}
        <div class="small muted" style="align-self:end">Cure : ${r.resineCureH || 24} h · Gaspillage : ${r.resineWaste || 8} % · Catalyseur : ${r.catalystPct || 2} % · Minuteur de cure disponible en Production.</div>
      </div>`;
    }

    return `<div class="card">
      <div class="tabs">${Engine.modules().map(m => `<button class="tab ${d.module === m.id ? 'active' : ''}" data-mod="${m.id}">${m.icon} ${m.label}</button>`).join('')}</div>
      <div class="form-grid" style="margin-top:10px">
        <div><label for="client">Client</label><select class="field" id="client"><option value="">— Client occasionnel —</option>${clientOpts}</select></div>
      </div>
      <div class="divider"></div>
      ${atelier}
      <div class="divider"></div>
      <div class="form-grid">
        ${num('marge', 'Marge (%)', '', '0')}
        ${num('remise', 'Remise (%)', '', '0')}
        ${num('depositPct', 'Acompte à la commande (%)', '', '0')}
        <div class="check" style="align-self:end"><input type="checkbox" data-f="express" ${d.express ? 'checked' : ''}><label>Délai express</label></div>
      </div>
    </div>
    <div class="spacer"></div>
    <div id="quote-result"></div>`;
  }

  function vQuotes() {
    const quotes = Store.quotes();
    $('#content').innerHTML = `<div class="grid two" style="align-items:start">
      <div>${quoteForm()}</div>
      <div>
        <div class="card">
          <div class="card-head"><h3>Devis enregistrés</h3><span class="chip">${quotes.length}</span></div>
          ${UI.table([{label:'N°'},{label:'Client'},{label:'Module'},{label:'Total TTC',num:true},{label:''}],
            quotes.map(q => `<tr><td>${UI.esc(q.id)}</td><td>${UI.esc(Store.client(q.clientId)?.name || 'Occasionnel')}</td><td>${UI.esc(q.module)}</td><td class="num">${UI.fcfa(q.ttc)}</td><td class="num"><button class="btn sm ghost" data-qpdf="${q.id}">PDF</button></td></tr>`))}
        </div>
      </div>
    </div>`;
    $$('.tab').forEach(t => t.onclick = () => { quoteDraft.module = t.dataset.mod; vQuotes(); });
    $$('[data-f]').forEach(el => el.onaddEventListener = null);
    $$('[data-f]').forEach(el => {
      const ev = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, () => {
        const f = el.dataset.f;
        quoteDraft[f] = el.type === 'checkbox' ? el.checked : (el.type === 'number' ? Number(el.value) : el.value);
        calcQuote();
      });
    });
    $('#client').onchange = e => { quoteDraft.clientId = e.target.value; };
    calcQuote();
    $$('[data-qpdf]').forEach(b => b.onclick = () => printQuote(Store.quote(b.dataset.qpdf)));
  }

  function calcQuote() {
    const res = Engine.compute(quoteDraft.module, quoteDraft);
    const warnings = res.warnings.map(w => `<div class="chip warn" style="margin:3px 4px 3px 0">${UI.esc(w)}</div>`).join('');
    $('#quote-result').innerHTML = `<div class="card">
      <div class="card-head"><h2>Détail du calcul</h2><span class="chip ok">Explicable ligne par ligne</span></div>
      <div class="table-wrap"><table><tbody>${res.lines.map(([l, v]) => `<tr><td>${UI.esc(l)}</td><td class="num">${v < 0 ? '− ' + UI.fcfa(-v) : UI.fcfa(v)}</td></tr>`).join('')}
      ${res.deposit ? `<tr><td><b>Acompte à la commande</b></td><td class="num"><b>${UI.fcfa(res.deposit)}</b></td></tr><tr><td><b>Solde à la livraison</b></td><td class="num"><b>${UI.fcfa(res.solde)}</b></td></tr>` : ''}</tbody></table></div>
      ${warnings ? `<div class="divider"></div>${warnings}` : ''}
      <div class="divider"></div>
      <div class="row"><button class="btn ghost" id="q-reset">Réinitialiser</button><div><button class="btn primary" id="q-save">Enregistrer le devis</button></div></div>
    </div>`;
    $('#q-reset').onclick = () => { quoteDraft = null; vQuotes(); };
    $('#q-save').onclick = () => {
      const q = {
        id: Store.nextNumber('quote'), orgId: Store.db.activeOrg,
        clientId: quoteDraft.clientId || null, module: quoteDraft.module,
        params: JSON.parse(JSON.stringify(quoteDraft)), ...res, date: Store.today()
      };
      Store.add('quotes', q);
      UI.toast('Devis ' + q.id + ' enregistré');
      vQuotes();
    };
  }

  function printQuote(q) {
    if (!q) return;
    const org = Store.org();
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>${q.id}</title><style>body{font:14px sans-serif;color:#0B122F;padding:30px}h1{color:#3A4F9E}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:left}td:last-child{text-align:right}.total{font-weight:bold;font-size:16px}</style></head><body>
      <h1>${UI.esc(org.name)}</h1><p>${UI.esc(org.ifu)} · ${UI.esc(org.settings.phone || '')}${org.phone2 ? ' · ' + UI.esc(org.phone2) : ''}<br>Devis ${UI.esc(q.id)} — ${UI.date(q.date)}</p>
      <p>Client : ${UI.esc(Store.client(q.clientId)?.name || 'Client occasionnel')}</p>
      <table>${q.lines.map(([l,v]) => `<tr><td>${UI.esc(l)}</td><td>${UI.fcfa(v)}</td></tr>`).join('')}${q.deposit ? `<tr><td><b>Acompte à la commande</b></td><td><b>${UI.fcfa(q.deposit)}</b></td></tr><tr><td><b>Solde à la livraison</b></td><td><b>${UI.fcfa(q.solde)}</b></td></tr>` : ''}</table>
      <p style="margin-top:30px;font-size:11px;color:#666">Propulsé par HaiBer Gestion · Support : ${UI.esc(org.settings.phone || '')}<br>Conçu par Touch Unique · +226 55 04 15 30</p></body></html>`);
    w.document.close();
    w.print();
  }

  /* ---------- Orders ---------- */
  function newOrderModal() {
    const clients = Store.clients();
    const m = UI.modal('Nouvelle commande', `<div class="form-grid">
      <div><label>Client</label><select class="field" id="no-client">${clients.map(c => `<option value="${c.id}">${UI.esc(c.name)}</option>`).join('')}</select></div>
      <div><label>Description</label><input class="field" id="no-desc" placeholder="Ex. Bâche 3×2 m avec œillets"></div>
    </div>`, `<button class="btn ghost" id="no-cancel">Annuler</button><button class="btn primary" id="no-ok">Créer</button>`);
    $('#no-cancel').onclick = m.close;
    $('#no-ok').onclick = () => {
      const desc = $('#no-desc').value.trim();
      if (!desc) return UI.toast('Description requise', true);
      const o = { id: Store.nextNumber('order'), orgId: Store.db.activeOrg, clientId: $('#no-client').value, desc, step: 0, date: Store.today(), hist: [] };
      Store.add('orders', o);
      m.close(); UI.toast('Commande ' + o.id + ' créée'); go('orders');
    };
  }

  function vOrders() {
    const orders = Store.orders();
    $('#content').innerHTML = `<div class="card-head"><h2>Commandes (${orders.length})</h2><button class="btn primary" id="new-order">+ Nouvelle commande</button></div>
      <div class="card">${UI.table([{label:'N°'},{label:'Client'},{label:'Description'},{label:'Étape'},{label:'Date'},{label:''}],
        orders.map(o => `<tr><td><b>${UI.esc(o.id)}</b></td><td>${UI.esc(Store.client(o.clientId)?.name || '—')}</td><td>${UI.esc(o.desc)}</td><td>${UI.statusChip(o.step, o.delivered)}</td><td>${UI.date(o.date)}</td><td class="num"><button class="btn sm ghost" data-ord="${o.id}">Ouvrir</button></td></tr>`))}
      </div>`;
    $('#new-order').onclick = newOrderModal;
    $$('[data-ord]').forEach(b => b.onclick = () => { selectedOrder = b.dataset.ord; go('production'); });
  }

  /* ---------- Commandes reçues depuis le site web ---------- */
  function vSiteOrders() {
    const list = siteOrders();
    const unread = list.filter(o => !o.seen).length;
    const today = Store.today();
    const todayCount = list.filter(o => String(o.at || '').slice(0, 10) === today).length;
    const cards = list.map(o => {
      const c = o.client || {};
      const ref = o.ref || o.id;
      const items = Array.isArray(o.items) ? o.items : [];
      const details = Array.isArray(o.details) ? o.details : [];
      const phone = String(c.phone || '').replace(/[^\d+]/g, '');
      const wa = phone ? 'https://wa.me/' + phone.replace(/^\+/, '') : '';
      const reply = 'Bonjour ' + (c.name || '') + ', HaiBer a bien reçu votre demande ' + ref + '. Nous vous contacterons très vite.';
      return `<article class="site-order-card${o.seen ? '' : ' is-new'}">
        <div class="site-order-head">
          <div>
            <div class="site-order-ref">${UI.esc(ref)}</div>
            <h3>${UI.esc(o.type || 'Commande du site')}</h3>
            <div class="small muted">${UI.esc(new Date(o.at || Date.now()).toLocaleString('fr-FR'))} · ${UI.esc(o.source || 'Site web')}</div>
          </div>
          ${o.seen ? '<span class="chip">Traité</span>' : '<span class="chip warn">Nouveau</span>'}
        </div>
        <div class="site-order-client">
          <div><b>Nom du client</b><span>${UI.esc(c.name || '—')}</span></div>
          <div><b>Téléphone</b><span>${UI.esc(c.phone || '—')}</span></div>
          <div><b>E-mail</b><span>${UI.esc(c.email || '—')}</span></div>
          <div><b>Référence</b><span>${UI.esc(ref)}</span></div>
        </div>
        ${items.length ? `<table class="site-order-items"><thead><tr><th>Article</th><th>Catégorie</th><th>Qté</th><th>Montant</th></tr></thead><tbody>${items.map(i => `<tr><td>${UI.esc(i.name || '—')}</td><td>${UI.esc(i.cat || '—')}</td><td>${UI.esc(i.qty || 1)}</td><td>${UI.fcfa(i.lineTotal || 0)}</td></tr>`).join('')}</tbody></table>` : ''}
        ${details.length ? `<div class="small">${details.map(d => `<div><b>${UI.esc(d[0])} :</b> ${UI.esc(d[1])}</div>`).join('')}</div>` : ''}
        <div class="row"><b>Total estimé</b><b>${UI.fcfa(o.total || 0)}</b></div>
        <details style="margin-top:8px"><summary class="small">Message complet envoyé par le client</summary><div class="site-order-msg">${UI.esc(o.message || '')}</div></details>
        <div class="site-order-actions">
          ${wa ? `<a class="btn sm primary" href="${wa}?text=${encodeURIComponent(reply)}" target="_blank" rel="noopener">💬 Contacter le client</a>` : ''}
          ${o.seen ? '' : `<button class="btn sm ghost" data-site-read="${UI.esc(o.id)}">Marquer comme traité</button>`}
          <button class="btn sm ghost" data-site-quote="${UI.esc(o.id)}">Créer un devis</button>
          <button class="btn sm ghost" data-site-del="${UI.esc(o.id)}">Supprimer</button>
        </div>
      </article>`;
    }).join('');

    $('#content').innerHTML = `
      <div class="grid kpi">
        <div class="kpi-card"><b>${list.length}</b><span>Demandes reçues du site</span></div>
        <div class="kpi-card"><b>${unread}</b><span>À traiter</span></div>
        <div class="kpi-card"><b>${todayCount}</b><span>Reçues aujourd’hui</span></div>
        <div class="kpi-card"><b>${UI.fcfa(list.reduce((a, o) => a + (o.total || 0), 0))}</b><span>Total estimé</span></div>
      </div>
      <div class="card-head" style="margin-top:14px"><h2>Commandes du site web</h2>
        <div class="row">
          <button class="btn ghost" id="site-refresh">Actualiser</button>
          <button class="btn ghost" id="site-all-read">Tout marquer comme traité</button>
          <a class="btn primary" href="https://haibermultiservices564-gif.github.io/haiber-site/" target="_blank" rel="noopener">Ouvrir le site ↗</a>
        </div>
      </div>
      <div class="small muted">Les demandes envoyées depuis la boutique ou le devis en ligne apparaissent ici automatiquement. Chaque fiche contient la référence, les articles, le montant estimé et les coordonnées du client.</div>
      <div class="site-order-list">${cards || '<div class="card">Aucune commande reçue pour le moment. Envoyez une demande depuis le site web HaiBer pour la voir apparaître ici.</div>'}</div>`;

    $('#site-refresh').onclick = () => { refreshSiteOrderIndicators(); vSiteOrders(); UI.toast('Commandes du site actualisées'); };
    $('#site-all-read').onclick = () => {
      saveSiteOrders(siteOrders().map(o => Object.assign({}, o, { seen: true })));
      refreshSiteOrderIndicators(); vSiteOrders(); UI.toast('Toutes les demandes sont marquées traitées');
    };
    $$('[data-site-read]').forEach(b => b.onclick = () => setSiteOrderSeen(b.dataset.siteRead, true));
    $$('[data-site-del]').forEach(b => b.onclick = () => {
      saveSiteOrders(siteOrders().filter(o => o.id !== b.dataset.siteDel));
      refreshSiteOrderIndicators(); vSiteOrders(); UI.toast('Demande supprimée');
    });
    $$('[data-site-quote]').forEach(b => b.onclick = () => {
      const o = siteOrders().find(x => x.id === b.dataset.siteQuote);
      if (!o) return;
      quoteDraft = {
        module: 'conception', designType: (o.type || 'Commande site') + ' · ' + (o.ref || o.id),
        hours: 2, revisions: 0, bat: true, marge: Store.orgSettings().margeDefaut || 30,
        remise: 0, express: false, depositPct: 30,
        notes: (o.message || '').slice(0, 600)
      };
      go('quotes');
      UI.toast('Demande du site transférée dans le devis');
    });
    refreshSiteOrderIndicators();
  }

  /* ---------- Production ---------- */
  function deliveryModal(o) {
    const m = UI.modal('Livraison — ' + UI.esc(o.id), `
      <p class="small muted">Client : ${UI.esc(Store.client(o.clientId)?.name || '—')} · ${UI.esc(o.desc)}</p>
      <canvas id="sig-canvas" width="520" height="170" style="width:100%;height:170px;border:1px solid var(--line);border-radius:10px;background:#fff;touch-action:none;cursor:crosshair"></canvas>
      <div class="row"><span class="small muted">Signature du client dans le cadre</span><button class="btn sm ghost" id="sig-clear">Effacer</button></div>
      <div style="margin-top:12px"><label>Reçu par</label><input class="field" id="sig-name" placeholder="Nom du réceptionniste"></div>`,
      `<button class="btn ghost" id="sig-cancel">Annuler</button><button class="btn primary" id="sig-ok">Confirmer la livraison</button>`);
    const cv = $('#sig-canvas'), ctx = cv.getContext('2d');
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#3A4F9E';
    let drawing = false, drawn = false;
    const pos = e => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height };
    };
    cv.onpointerdown = e => { drawing = true; drawn = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = e => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    cv.onpointerup = () => { drawing = false; };
    $('#sig-clear').onclick = () => { ctx.clearRect(0, 0, cv.width, cv.height); drawn = false; };
    $('#sig-cancel').onclick = m.close;
    $('#sig-ok').onclick = () => {
      if (!drawn) return UI.toast('Veuillez signer avant de confirmer', true);
      Store.update('orders', o.id, {
        delivered: true, deliveredAt: Store.today(), receivedBy: $('#sig-name').value.trim(),
        signature: cv.toDataURL('image/png')
      });
      Store.log('delivery', o.id);
      m.close(); UI.toast('Livraison enregistrée avec signature'); vProduction();
    };
  }

  function updateCureTimer() {
    if (window.hbCureInterval) { clearInterval(window.hbCureInterval); window.hbCureInterval = null; }
    const el = $('#cure-time'), btn = $('#cure-start');
    if (!el || !btn) return;
    const hours = Store.rules().resineCureH || 24;
    let start = 0;
    try { start = Number(localStorage.getItem('hb_cure_start') || 0); } catch (e) {}
    const render = () => {
      if (!document.body.contains(el)) { clearInterval(window.hbCureInterval); window.hbCureInterval = null; return; }
      if (!start) { el.textContent = 'Aucun cycle en cours'; btn.textContent = '▶ Démarrer la cure'; return; }
      const end = start + hours * 3600000;
      const left = end - Date.now();
      btn.textContent = left > 0 ? '↻ Redémarrer' : '▶ Nouveau cycle';
      if (left <= 0) { el.textContent = 'Cure terminée — démoulage possible'; return; }
      const h = Math.floor(left / 3600000);
      const m = Math.floor((left % 3600000) / 60000);
      const s = Math.floor((left % 60000) / 1000);
      el.textContent = String(h).padStart(2, '0') + ' h ' + String(m).padStart(2, '0') + ' min ' + String(s).padStart(2, '0') + ' s — démoulage à ' + new Date(end).toLocaleString('fr-FR');
    };
    btn.onclick = () => {
      start = Date.now();
      try { localStorage.setItem('hb_cure_start', String(start)); } catch (e) {}
      render();
      UI.toast('Minuteur de cure ' + hours + ' h démarré');
    };
    render();
    window.hbCureInterval = setInterval(render, 1000);
  }

  function vProduction() {
    const orders = Store.orders();
    if (selectedOrder) {
      const o = Store.order(selectedOrder);
      if (!o) { selectedOrder = null; return vProduction(); }
      $('#content').innerHTML = `<button class="btn ghost" id="back-prod">← Retour à la production</button><div class="spacer"></div>
        <div class="grid two" style="align-items:start">
          <div class="card"><div class="card-head"><h2>${UI.esc(o.id)}</h2>${UI.statusChip(o.step, o.delivered)}</div>
            <p>${UI.esc(Store.client(o.clientId)?.name || '—')}</p><p class="muted">${UI.esc(o.desc)}</p>
            ${UI.steps(o.step)}
            <div class="spacer"></div>
            <button class="btn primary block" id="advance" ${o.step >= 5 ? 'disabled' : ''}>${o.step >= 5 ? 'Commande terminée' : 'Valider l’étape suivante'}</button>
            ${o.step >= 5 && !o.delivered ? '<div class="spacer"></div><button class="btn teal block" id="deliver">🚚 Enregistrer la livraison + signature</button>' : ''}
            ${o.delivered ? `<div class="spacer"></div><div class="chip ok">Livrée le ${UI.date(o.deliveredAt)}${o.signature ? ' · signature enregistrée' : ''}</div>` : ''}
          </div>
          <div class="card"><h3>Historique des étapes</h3>${o.hist.length ? o.hist.map(h => `<div class="row"><span>${UI.esc(h.step)}</span><span class="muted small">${UI.esc(h.at)}</span></div>`).join('') : '<p class="muted">Aucune étape validée.</p>'}
            ${o.signature ? `<div class="divider"></div><h3>Signature client</h3><img src="${o.signature}" alt="Signature" style="max-width:100%;background:#fff;border:1px solid var(--line);border-radius:8px">` : ''}
          </div>
        </div>`;
      $('#back-prod').onclick = () => { selectedOrder = null; vProduction(); };
      $('#advance').onclick = () => {
        const steps = Store.steps;
        o.step++; o.hist.unshift({ step: steps[o.step], at: new Date().toLocaleString('fr-FR') });
        Store.update('orders', o.id, { step: o.step, hist: o.hist });
        UI.toast(o.step === 5 ? 'Commande prête — client notifié (simulé)' : 'Étape validée');
        vProduction();
      };
      if ($('#deliver')) $('#deliver').onclick = () => deliveryModal(o);
      return;
    }
    $('#content').innerHTML = `<div class="card-head"><h2>Suivi de production</h2><button class="btn ghost" id="scan">▣ Simuler un scan QR</button></div>
      <div class="card">${UI.table([{label:'N°'},{label:'Client'},{label:'Description'},{label:'Progression'},{label:''}],
        orders.map(o => `<tr><td><b>${UI.esc(o.id)}</b></td><td>${UI.esc(Store.client(o.clientId)?.name || '—')}</td><td>${UI.esc(o.desc)}</td><td style="min-width:140px">${UI.steps(o.step)}</td><td class="num"><button class="btn sm teal" data-open="${o.id}">Ouvrir</button></td></tr>`))}
      </div>
      <div class="spacer"></div>
      <div class="card"><div class="card-head"><h3>Minuteur de cure résine</h3><span class="chip">${Store.rules().resineCureH || 24} h</span></div>
        <p class="muted">Démarrer le chronomètre au coulage : le démoulage n’est autorisé qu’après la cure complète.</p>
        <div class="row"><b id="cure-time">Aucun cycle en cours</b><button class="btn primary" id="cure-start">▶ Démarrer la cure</button></div>
      </div>
      <div class="spacer"></div>
      <div class="card"><h3>Sous-traitance locale</h3><div class="small muted">Fiches partenaires, spécialités et suivi des travaux délégués.</div>
        ${Store.subcontractors().map(x => `<div class="row" style="justify-content:space-between"><span><b>${UI.esc(x.name)}</b> · ${UI.esc(x.specialty || '—')}<br><small class="muted">${UI.esc(x.note || '')}</small></span><a class="btn sm ghost" target="_blank" href="${waLink(x.phone, 'Bonjour ' + x.name + ', suivi d’un travail sous-traité. HaiBer')}">💬 Contacter</a></div>`).join('') || '<div class="small muted">Aucun sous-traitant enregistré.</div>'}
      </div>`;
    $$('[data-open]').forEach(b => b.onclick = () => { selectedOrder = b.dataset.open; vProduction(); });
    updateCureTimer();
    $('#scan').onclick = () => {
      const c = orders.filter(o => o.step < 5);
      if (!c.length) return UI.toast('Toutes les commandes sont prêtes');
      selectedOrder = c[Math.floor(Math.random() * c.length)].id;
      UI.toast('Code QR lu : ' + selectedOrder);
      vProduction();
    };
  }

  /* ---------- History ---------- */
  function vHistory() {
    const orders = Store.orders(), quotes = Store.quotes(), invoices = Store.invoices(), designs = Store.designs();
    const all = [
      ...orders.map(o => ({ date: o.date, type: 'Commande', ref: o.id, label: o.desc, detail: (Store.client(o.clientId)?.name || '—') + ' · ' + (o.delivered ? 'livrée' : 'étape ' + o.step + '/5') })),
      ...quotes.map(q => ({ date: q.date, type: 'Devis', ref: q.id, label: q.module, detail: UI.fcfa(q.ttc) })),
      ...invoices.map(i => ({ date: i.date, type: 'Facture', ref: i.id, label: i.mode, detail: UI.fcfa(i.ttc) })),
      ...designs.map(d => ({ date: d.date, type: 'Conception', ref: d.name, label: d.type, detail: d.note || '' }))
    ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    $('#content').innerHTML = `<div class="grid kpi">
      <div class="kpi-card"><b>${orders.length}</b><span>Commandes</span></div>
      <div class="kpi-card"><b>${quotes.length}</b><span>Devis</span></div>
      <div class="kpi-card"><b>${invoices.length}</b><span>Factures</span></div>
      <div class="kpi-card"><b>${designs.length}</b><span>Conceptions</span></div>
    </div><div class="spacer"></div>
    <div class="card">
      <div class="card-head"><h2>Historique complet</h2><div class="row" style="gap:8px">
        <input class="field" id="hist-search" placeholder="Rechercher (client, n°, mot-clé…)" style="width:240px">
        <select class="field" id="hist-type" style="width:160px"><option value="">Tous les types</option><option>Commande</option><option>Devis</option><option>Facture</option><option>Conception</option></select>
      </div></div>
      <div id="hist-list"></div>
    </div>`;
    const render = () => {
      const term = ($('#hist-search').value || '').toLowerCase();
      const type = $('#hist-type').value;
      const list = all.filter(x => (!type || x.type === type) && (!term || (x.ref + x.label + x.detail).toLowerCase().includes(term)));
      $('#hist-list').innerHTML = UI.table([{label:'Date'},{label:'Type'},{label:'Référence'},{label:'Description'},{label:'Détail'}],
        list.map(x => `<tr><td>${UI.date(x.date)}</td><td><span class="chip">${UI.esc(x.type)}</span></td><td><b>${UI.esc(x.ref)}</b></td><td>${UI.esc(x.label)}</td><td class="muted small">${UI.esc(x.detail)}</td></tr>`));
    };
    $('#hist-search').oninput = render;
    $('#hist-type').onchange = render;
    render();
  }

  /* ---------- Fiches motifs / bibliothèque de boîtes ---------- */
  function vMotifs() {
    const motifs = Store.motifs();
    $('#content').innerHTML = `<div class="card-head"><h2>Fiches motifs (${motifs.length})</h2><button class="btn primary" id="new-motif">+ Nouvelle fiche</button></div>
      <div class="card">${UI.table(
        [{label:'Réf.'},{label:'Nom / description'},{label:'Atelier'},{label:'Couleurs / maillage'},{label:'Écrans / positions'},{label:'Tailles / qté'},{label:'Coût pièce',num:true},{label:'Lot'},{label:''}],
        motifs.map(m => `<tr><td>${UI.esc(m.id)}</td><td><b>${UI.esc(m.name)}</b><br><small class="muted">${UI.esc(m.description || '')}</small></td><td>${UI.esc(m.metier || '—')}</td><td>${m.colors || 0} / ${UI.esc(m.mesh || '—')}</td><td>${m.screens || 0} / ${m.positions || 0}</td><td>${UI.esc(m.sizes || '—')}<br><small class="muted">${m.qty || 0} pièce(s)</small></td><td class="num">${m.costPerPiece ? UI.fcfa(m.costPerPiece) : '—'}</td><td>${UI.esc(m.lot || '—')}</td><td class="num"><button class="btn sm ghost" data-mdevis="${m.id}">Devis</button> <button class="btn sm ghost" data-mreprint="${m.id}">↻</button> <button class="btn sm danger" data-mdel="${m.id}">✕</button></td></tr>`)
      )}</div>
      <div class="small muted" style="margin-top:10px">Fiches complètes : couleurs, maillage, nombre de cadres, positions, tailles et quantités par T-shirt, recette d’encre, coût par pièce, gâche prévue, lot et réimpression en un clic. Ces données alimentent les devis impression, packaging et résine.</div>`;
    $('#new-motif').onclick = () => {
      const m = UI.modal('Nouvelle fiche motif', `<div class="form-grid">
        <div style="grid-column:1/-1"><label>Nom du motif</label><input class="field" id="mo-name" placeholder="Ex. Plateau résine 120×60"></div>
        <div><label>Atelier</label><select class="field" id="mo-metier">${Engine.modules().map(x => `<option value="${x.id}">${x.label}</option>`).join('')}</select></div>
        <div><label>Temps de fabrication (h)</label><input class="field" type="number" step="0.1" id="mo-time" value="1"></div>
        <div style="grid-column:1/-1"><label>Description</label><input class="field" id="mo-desc"></div>
        <div><label>Matière</label><input class="field" id="mo-mat"></div>
        <div><label>Lot de production</label><input class="field" id="mo-lot" placeholder="LOT-2401"></div>
        <div><label>Nombre de couleurs</label><input class="field" type="number" id="mo-colors" value="1"></div>
        <div><label>Maillage (ex. 43T)</label><input class="field" id="mo-mesh"></div>
        <div><label>Nombre de cadres</label><input class="field" type="number" id="mo-screens" value="0"></div>
        <div><label>Positions (ex. dos + poitrine)</label><input class="field" type="number" id="mo-positions" value="1"></div>
        <div><label>Tailles</label><input class="field" id="mo-sizes" placeholder="S–M–L–XL"></div>
        <div><label>Quantité type</label><input class="field" type="number" id="mo-qty" value="1"></div>
        <div><label>Coût par pièce (FCFA)</label><input class="field" type="number" id="mo-cost" value="0"></div>
        <div><label>Gâche prévue (%)</label><input class="field" type="number" id="mo-waste" value="5"></div>
        <div style="grid-column:1/-1"><label>Recette d’encre mémorisée</label><input class="field" id="mo-ink" placeholder="Blanc plastisol + magenta"></div>
        <div style="grid-column:1/-1"><label>Note atelier (cure, séchage, découpe…)</label><textarea class="field" id="mo-note" rows="2"></textarea></div>
      </div>`, `<button class="btn ghost" id="mo-cancel">Annuler</button><button class="btn primary" id="mo-ok">Enregistrer</button>`);
      $('#mo-cancel').onclick = m.close;
      $('#mo-ok').onclick = () => {
        const name = $('#mo-name').value.trim();
        if (!name) return UI.toast('Nom requis', true);
        Store.add('motifs', {
          id: Store.nextNumber('motif'), orgId: Store.db.activeOrg, name,
          metier: $('#mo-metier').value, timeH: Number($('#mo-time').value) || 0,
          description: $('#mo-desc').value.trim(), material: $('#mo-mat').value.trim(),
          lot: $('#mo-lot').value.trim(), colors: Number($('#mo-colors').value) || 0,
          mesh: $('#mo-mesh').value.trim(), screens: Number($('#mo-screens').value) || 0,
          positions: Number($('#mo-positions').value) || 0, sizes: $('#mo-sizes').value.trim(),
          qty: Number($('#mo-qty').value) || 0, costPerPiece: Number($('#mo-cost').value) || 0,
          wastePct: Number($('#mo-waste').value) || 0, inkRecipe: $('#mo-ink').value.trim(),
          note: $('#mo-note').value.trim()
        });
        m.close(); UI.toast('Fiche motif enregistrée'); vMotifs();
      };
    };
    $$('[data-mdel]').forEach(b => b.onclick = () => UI.confirm('Supprimer la fiche', 'Cette fiche sera retirée de la bibliothèque.', () => { Store.remove('motifs', b.dataset.mdel); vMotifs(); }));
    $$('[data-mreprint]').forEach(b => b.onclick = () => {
      const m = Store.motifs().find(x => x.id === b.dataset.mreprint);
      if (!m) return;
      quoteDraft = {
        module: m.metier || 'resine', motif: m.id,
        q: m.qty || 1, colors: m.colors || 1, positions: m.positions || 1,
        remise: 0, express: false
      };
      go('quotes');
      UI.toast('Réimpression préparée depuis « ' + m.name + ' »');
    });
    $$('[data-mdevis]').forEach(b => b.onclick = () => {
      const m = Store.motifs().find(x => x.id === b.dataset.mdevis);
      if (!m) return;
      quoteDraft = { module: m.metier || 'resine', motif: m.id, remise: 0, express: false };
      go('quotes');
      UI.toast('Devis préparé depuis « ' + m.name + ' »');
    });
  }

  /* ---------- Informations du support PDF ---------- */
  function pdfInfosHtml() {
    const r = Store.rules() || {};
    const s = Store.orgSettings() || {};
    const grand = (r.prices && r.prices.grandformat) || {};
    const grandRows = ['Bâche', 'Vinyle', 'Dos bleu', 'Micro perforé']
      .filter(k => grand[k] !== undefined)
      .map(k => `<tr><td>${UI.esc(k)}</td><td class="num">${UI.fcfa(grand[k])}</td></tr>`);
    const packs = (r.packsPromo || []).map(p => `<tr>
      <td><b>${UI.esc(p.name)}</b><div class="small muted">${UI.esc(p.headline || '')}</div></td>
      <td class="num">${UI.fcfa(p.price)}</td>
      <td>${(p.details || []).map(d => `<div class="small">• ${UI.esc(d)}</div>`).join('')}</td></tr>`);
    const bv = r.brandingVehicule || {};
    const gadgets = r.gadgets || {};
    const flyers = r.conseilsFlyers || {};
    const textile = r.textile || {};
    return `
      <div class="section-title">Informations du support PDF HaiBer</div>
      <div class="grid two" style="align-items:start">
        <div class="card"><h3>Contact & identité</h3>
          <div class="row"><span>Slogan</span><b>${UI.esc(s.tagline || '')}</b></div>
          <div class="row"><span>WhatsApp / support</span><span>${UI.esc(s.phone || '')}</span></div>
          <div class="row"><span>Téléphone 2</span><span>${UI.esc(s.phone2 || '')}</span></div>
          <div class="row"><span>E-mail</span><span>${UI.esc(s.email || '')}</span></div>
          <div class="row"><span>Adresse</span><span>${UI.esc(s.city || '')}</span></div>
          <div class="row"><span>Livraison</span><span>${UI.esc(s.delivery || '')}</span></div>
          <a class="btn primary" id="pdf-wa" target="_blank" href="${waLink(s.phone, 'Bonjour HaiBer, je souhaite être rappelé.')}">💬 Contacter HaiBer</a>
        </div>
        <div class="card"><h3>Grand format (tarifs PDF)</h3>
          ${UI.table([{label:'Support'},{label:'Prix',num:true}], grandRows)}
          <div class="small muted" style="margin-top:8px">Les autres supports et prix du devis restent modifiables dans Réglages.</div>
        </div>
      </div>
      <div class="section-title">Packs promotionnels</div>
      <div class="card">${UI.table([{label:'Pack'},{label:'Prix',num:true},{label:'Contenu'}], packs)}</div>
      <div class="grid two" style="align-items:start">
        <div class="card"><h3>${UI.esc(bv.title || 'Branding véhicule')}</h3>
          <p class="small">${UI.esc(bv.headline || '')}</p>
          <p class="small"><b>Véhicules :</b> ${(bv.vehicles || []).map(x => UI.esc(x)).join(' · ')}</p>
          <p class="small"><b>Prestations :</b> ${(bv.highlights || []).map(x => UI.esc(x)).join(' · ')}</p>
          <p class="small"><b>Processus :</b> ${(bv.process || []).map(x => x.step + '. ' + UI.esc(x.title)).join(' → ')}</p>
          <p class="small"><b>${UI.esc(bv.free || '')}</b> · ${UI.esc(bv.audience || '')}</p>
        </div>
        <div class="card"><h3>${UI.esc(gadgets.title || 'Objets publicitaires')}</h3>
          <p class="small">${UI.esc(gadgets.intro || '')}</p>
          <div style="margin:8px 0">${(gadgets.items || []).map(x => `<span class="chip" style="margin:2px">${UI.esc(x)}</span>`).join('')}</div>
          <p class="small"><b>${UI.esc(gadgets.freeDesign || '')}</b> · ${UI.esc(gadgets.priceNote || '')}</p>
          <div class="divider"></div>
          <h3>${UI.esc(textile.title || 'Textile & gadgets')}</h3>
          <p class="small"><b>Remises :</b> ${(textile.discounts || []).map(x => UI.esc(x)).join(' · ')}</p>
          <p class="small"><b>Techniques :</b> ${(textile.techniques || []).map(x => UI.esc(x)).join(' · ')}</p>
          <p class="small"><b>Quantités min :</b> ${Object.entries(textile.minQuantities || {}).map(([k, v]) => UI.esc(k) + ' : ' + UI.esc(v)).join(' · ')}</p>
          <p class="small muted">${UI.esc(textile.delivery || '')} · ${UI.esc(textile.priceNote || '')}</p>
        </div>
      </div>
      <div class="section-title">Conseils flyers (format & papier)</div>
      <div class="card">${(flyers.tips || []).map(t => `<div class="row"><b>${UI.esc(t.title)}</b><span class="small muted">${UI.esc(t.text)}</span></div>`).join('')}</div>`;
  }

  /* ---------- Catalogue officiel (site ↔ application) ---------- */
  function vCatalogue() {
    const mount = $('#content');
    if (!catalogState) {
      mount.innerHTML = `<div class="card cat-loading"><div class="cat-spinner"></div><h3>Chargement du catalogue HaiBer…</h3><p class="muted">Connexion au site web, puis repli sur la copie locale si besoin.</p></div>`;
      const loader = global.HBCatalogue ? global.HBCatalogue.load() : Promise.resolve(null);
      loader.then(res => {
        catalogState = res || { data: { products: [], categories: [], packs: [] }, source: 'Indisponible', live: false, site: '' };
        if (page === 'catalogue') vCatalogue();
      });
      return;
    }

    const { data, source, live, site } = catalogState;
    const cats = ['Tous'].concat((data.categories || []).map(c => c.name));
    mount.innerHTML = `
      <div class="card cat-hero">
        <div>
          <div class="row" style="gap:8px;flex-wrap:wrap">
            <h2 style="margin:0">Catalogue officiel HaiBer</h2>
            <span class="chip ${live ? 'ok' : 'warn'}">${live ? '● Synchronisé avec le site' : '○ Mode local'}</span>
          </div>
          <p class="muted">${UI.esc((data.meta && data.meta.description) || 'Conception, impression, packaging, sérigraphie et résine.')}</p>
          <div class="small muted">Source : ${UI.esc(source)} · ${(data.products || []).length} références · ${UI.esc((data.meta && data.meta.version) || '')}</div>
        </div>
        <div class="cat-hero-actions">
          <button class="btn ghost" id="cat-refresh">↻ Actualiser</button>
          <button class="btn primary" id="cat-site">Ouvrir le site web ↗</button>
        </div>
      </div>
      <div class="card">
        <div class="cat-toolbar">
          <input class="field" id="cat-search" placeholder="Rechercher un produit, un format, une finition…" value="${UI.esc(catalogQuery)}">
          <div class="cat-chips">${cats.map(c => `<button class="chip cat-chip${c === catalogFilter ? ' active' : ''}" data-cat-filter="${UI.esc(c)}">${UI.esc(c)}</button>`).join('')}</div>
        </div>
        <div class="small muted" id="cat-count"></div>
        <div class="cat-grid" id="cat-grid"></div>
      </div>
      ${(data.packs || []).length ? `<div class="section-title">Packs promotionnels</div><div class="grid three">${data.packs.map(p => `
        <div class="card cat-pack">
          <span class="chip warn">−20 %</span><h3>${UI.esc(p.name)}</h3>
          <p class="small muted">${UI.esc(p.subtitle)}</p>
          <ul class="small">${p.items.map(i => `<li>${UI.esc(i)}</li>`).join('')}</ul>
          <div class="row"><b>${UI.fcfa(p.price)}</b><button class="btn sm primary" data-cat-pack="${UI.esc(p.id)}">Chiffrer</button></div>
        </div>`).join('')}</div>` : ''}
      <div class="small muted" style="margin-top:14px">Les prix du catalogue sont indicatifs. Le devis reste personnalisé et gratuit.</div>`;

    const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const grid = $('#cat-grid');
    const paint = () => {
      const q = norm(catalogQuery.trim());
      const list = (data.products || []).filter(p => {
        const okCat = catalogFilter === 'Tous' || p.cat === catalogFilter;
        const hay = norm([p.name, p.desc, p.cat, p.unit, ...Object.values(p.details || {})].join(' '));
        return okCat && (!q || hay.includes(q));
      });
      $('#cat-count').textContent = list.length + ' référence(s) affichée(s) sur ' + (data.products || []).length;
      grid.innerHTML = list.length ? list.map(p => `
        <article class="cat-card">
          <div class="cat-card-media"><img src="${UI.esc(p.img)}" alt="${UI.esc(p.name)}" loading="lazy"></div>
          <div class="cat-card-body">
            <span class="chip">${UI.esc(p.cat)}</span>
            <h3>${UI.esc(p.name)}</h3>
            <p class="small muted">${UI.esc(p.desc)}</p>
            <div class="cat-card-price">${UI.fcfa(p.price)} <small>/ ${UI.esc(p.unit)}</small></div>
            <div class="row" style="gap:6px">
              <button class="btn sm ghost" data-cat-detail="${UI.esc(p.id)}">Fiche</button>
              <button class="btn sm primary" data-cat-quote="${UI.esc(p.id)}">Devis</button>
            </div>
          </div>
        </article>`).join('') : UI.empty('Aucun produit', 'Essayez un autre mot-clé ou une autre catégorie.', '🔎');
      $$('[data-cat-detail]', grid).forEach(b => b.onclick = () => catalogDetail(data.products.find(p => p.id === b.dataset.catDetail)));
      $$('[data-cat-quote]', grid).forEach(b => b.onclick = () => catalogQuote(data.products.find(p => p.id === b.dataset.catQuote)));
    };
    paint();

    $('#cat-search').oninput = e => { catalogQuery = e.target.value; paint(); };
    $$('[data-cat-filter]').forEach(b => b.onclick = () => {
      catalogFilter = b.dataset.catFilter;
      $$('[data-cat-filter]').forEach(x => x.classList.toggle('active', x === b));
      paint();
    });
    $('#cat-refresh').onclick = () => {
      if (global.HBCatalogue) global.HBCatalogue.invalidate();
      catalogState = null; catalogFilter = 'Tous'; catalogQuery = '';
      vCatalogue();
      UI.toast('Catalogue actualisé depuis le site web');
    };
    $('#cat-site').onclick = () => window.open((site || HBCatalogue.SITE) + '#catalogue', '_blank', 'noopener');
    $$('[data-cat-pack]').forEach(b => b.onclick = () => {
      const p = (data.packs || []).find(x => x.id === b.dataset.catPack);
      if (!p) return;
      quoteDraft = { module: 'conception', designType: p.name, hours: 2, revisions: 0, bat: true,
        marge: Store.orgSettings().margeDefaut || 30, remise: 0, express: false, depositPct: 30,
        notes: p.items.join(' · ') };
      go('quotes');
      UI.toast('Pack ajouté au devis : ' + p.name);
    });
  }

  function catalogDetail(p) {
    if (!p) return;
    const rows = Object.entries(p.details || {}).filter(([, v]) => v && v !== '—')
      .map(([k, v]) => `<div class="row"><span class="muted">${UI.esc(k)}</span><b>${UI.esc(v)}</b></div>`).join('');
    const m = UI.modal(p.name, `
      <div class="cat-detail">
        <img src="${UI.esc(p.img)}" alt="${UI.esc(p.name)}">
        <div>
          <p>${UI.esc(p.desc)}</p>
          <div class="cat-detail-price">${UI.fcfa(p.price)} <small>/ ${UI.esc(p.unit)}</small></div>
          ${rows}
          <div class="small muted" style="margin-top:10px">${UI.esc(p.source || '')} · prix indicatif, devis personnalisé offert.</div>
        </div>
      </div>`, `<button class="btn ghost" id="cat-wa">Commander sur WhatsApp</button><button class="btn primary" id="cat-to-quote">Ajouter au devis</button>`);
    m.root.querySelector('#cat-to-quote').onclick = () => { m.close(); catalogQuote(p); };
    m.root.querySelector('#cat-wa').onclick = () => {
      const msg = 'Bonjour HaiBer, je souhaite commander : ' + p.name + '\n' +
        Object.entries(p.details || {}).filter(([, v]) => v && v !== '—').map(([k, v]) => '• ' + k + ' : ' + v).join('\n') +
        '\nPrix indicatif : ' + UI.fcfa(p.price) + ' / ' + p.unit + '\nMerci de me préparer un devis.';
      window.open('https://wa.me/22606879710?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    };
  }

  function catalogQuote(p) {
    if (!p) return;
    quoteDraft = {
      module: 'conception', designType: 'Catalogue — ' + p.name, hours: 2, revisions: 0, bat: true,
      marge: Store.orgSettings().margeDefaut || 30, remise: 0, express: false, depositPct: 30,
      notes: p.desc + ' | ' + Object.entries(p.details || {}).map(([k, v]) => k + ' : ' + v).join(' · ')
    };
    go('quotes');
    UI.toast('Produit ajouté au devis : ' + p.name);
  }

  /* ---------- Galerie & motion design ---------- */
  function vGallery() {
    $('#content').innerHTML = `
      <div class="section-title">Motion design HaiBer</div>
      <div class="card">
        <div class="hb-motion-stage">
          <div class="hb-orbit"></div>
          <img class="motion-gif" src="assets/motion/logo-loop.gif" alt="Logo HaiBer animé">
          <div class="hb-caption">CONCEPTION · PACKAGING · IMPRESSION · MULTI-MÉDIA · RÉSINE</div>
        </div>
        <p class="muted">Animation de marque, habillage vidéo, logo animé et motion typographique. Les prestations sont chiffrées dans le devis « Multi-média » et toutes les options restent modifiables dans Réglages.</p>
        <button class="btn primary" id="motion-quote">Chiffrer un motion design</button>
        <button class="btn ghost" id="motion-ai">Demander à l’assistant</button>
      </div>
      <div class="section-title">Vos fiches motifs</div>
      <div class="card"><div class="hb-strip">${Store.motifs().map(m => `<div class="hb-chip"><b>${UI.esc(m.name)}</b><span>${UI.esc(m.metier || '')} · ${m.colors || 0} couleur(s) · ${m.screens || 0} écran(s) · ${m.positions || 0} position(s)</span><small>${UI.esc(m.inkRecipe || m.material || '')}</small></div>`).join('')}</div>
        <button class="btn ghost" id="motion-motifs" style="margin-top:10px">Gérer les fiches motifs</button>
      </div>
      <div class="section-title">Offre scolaire & kits cadeaux (données fournies)</div>
      <div class="card"><div class="grid two">
        <div><h3>Services aux établissements scolaires</h3>
          ${Object.entries(Store.rules().schoolServices || {}).map(([k, v]) => `<p class="small"><b>${UI.esc(k)}</b> : ${UI.esc(v.join(' · '))}</p>`).join('')}
          <p class="small muted">${UI.esc(Store.org().city || 'Cissin, Ouagadougou')} · livraison à l’école · délais 24 à 48 h · paiement mensuel possible.</p>
        </div>
        <div><h3>Tarifs des kits cadeaux</h3>${UI.table([{label:'Formule'},{label:'Prix',num:true}],
          Object.entries(Store.rules().kitOffers || {}).map(([k, v]) => `<tr><td>${UI.esc(k)}</td><td class="num">${UI.fcfa(v)}</td></tr>`))}</div>
      </div></div>
      ${pdfInfosHtml()}
      <div class="section-title">Galerie des visuels (${GALLERY.length})</div>
      <div class="hb-gallery">${GALLERY.map(g => `
        <figure data-img="assets/galerie/${g.file}">
          <img src="assets/galerie/${g.file}" alt="${UI.esc(g.caption)}" loading="lazy">
          <figcaption>${UI.esc(g.caption)}</figcaption>
        </figure>`).join('')}
      </div>
      <div class="small muted" style="margin-top:12px">Tous ces visuels sont embarqués dans l’application et dans l’APK : aucune connexion n’est nécessaire.</div>`;
    $('#motion-quote').onclick = () => {
      quoteDraft = { module: 'multimedia', mediaType: 'Motion design', motionStyle: 'Logo animé', motionDuration: 15, motionVersions: 2, motionFormat: 'MP4', remise: 0, express: false };
      go('quotes');
      UI.toast('Devis motion design préparé');
    };
    $('#motion-ai').onclick = () => {
      const fab = $('#ai-fab'); if (fab) fab.click();
      if (typeof Assistant !== 'undefined' && Assistant.suggest) Assistant.suggest('Comment tarifer un motion design ?');
    };
    $('#motion-motifs').onclick = () => go('motifs');
    $$('.hb-gallery figure').forEach(f => f.onclick = () => {
      const box = document.createElement('div');
      box.className = 'hb-lightbox';
      box.innerHTML = `<button class="btn ghost" id="hb-close">✕ Fermer</button><img src="${f.dataset.img}" alt="Aperçu">`;
      document.body.appendChild(box);
      box.onclick = (e) => { if (e.target === box || e.target.id === 'hb-close') box.remove(); };
      $('#hb-close').onclick = () => box.remove();
    });
  }

  /* ---------- Designs ---------- */
  function vDesigns() {
    const designs = Store.designs();
    $('#content').innerHTML = `<div class="card-head"><h2>Conceptions archivées (${designs.length})</h2><button class="btn primary" id="new-design">+ Ajouter une conception</button></div>
      <div class="card" style="margin-bottom:16px"><div class="dropzone" id="dropzone">📂 Glissez vos fichiers ici ou cliquez pour parcourir<br><span class="small">Images, PDF, SVG — max 1,5 Mo par fichier (stockage local)</span></div><input type="file" id="design-file" accept="image/*,.pdf,.svg" class="hidden" multiple></div>
      <div class="design-grid">${designs.length ? designs.map(d => `<div class="design-card">
        <div class="design-thumb">${d.data ? `<img src="${d.data}" alt="${UI.esc(d.name)}">` : '🎨'}</div>
        <div class="design-info"><h4>${UI.esc(d.name)}</h4>
          <div class="small muted">${UI.esc(d.type)}${d.clientId ? ' · ' + UI.esc(Store.client(d.clientId)?.name || '') : ''}</div>
          <div class="small muted">${UI.date(d.date)}</div>
          ${(d.tags || []).map(t => `<span class="tag">${UI.esc(t)}</span>`).join('')}
          <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-dl="${d.id}">Ouvrir</button><button class="btn sm danger" data-dd="${d.id}">Supprimer</button></div>
        </div></div>`).join('') : UI.empty('Aucune conception', 'Ajoutez vos maquettes, logos et visuels clients.')}</div>`;
    $('#new-design').onclick = () => $('#design-file').click();
    $('#dropzone').onclick = () => $('#design-file').click();
    $('#dropzone').ondragover = e => { e.preventDefault(); };
    $('#dropzone').ondrop = e => { e.preventDefault(); handleFiles(e.dataTransfer.files); };
    $('#design-file').onchange = e => handleFiles(e.target.files);
    $$('[data-dl]').forEach(b => b.onclick = () => {
      const d = Store.db.designs.find(x => x.id === b.dataset.dl);
      if (!d || !d.data) return UI.toast('Aucun fichier joint', true);
      const a = document.createElement('a'); a.href = d.data; a.download = d.name; a.click();
    });
    $$('[data-dd]').forEach(b => b.onclick = () => UI.confirm('Supprimer la conception', 'Le fichier sera retiré de vos archives.', () => { Store.remove('designs', b.dataset.dd); vDesigns(); }));
  }

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (file.size > 1.5 * 1024 * 1024) { UI.toast('Fichier trop volumineux : ' + file.name, true); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const d = { id: Store.uid('DES'), orgId: Store.db.activeOrg, name: file.name, type: file.type.includes('pdf') ? 'PDF' : file.type.includes('svg') ? 'SVG' : 'Image', tags: [], note: '', data: reader.result, date: Store.today() };
        Store.add('designs', d);
        UI.toast('Conception ajoutée : ' + file.name);
        vDesigns();
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- Clients ---------- */
  function vClients() {
    const clients = Store.clients();
    $('#content').innerHTML = `<div class="card-head"><h2>Clients (${clients.length})</h2><button class="btn primary" id="new-client">+ Nouveau client</button></div>
      <div class="card">${UI.table([{label:'Nom'},{label:'Téléphone'},{label:'E-mail'},{label:'Ville'},{label:'IFU'},{label:''}],
        clients.map(c => `<tr><td><b>${UI.esc(c.name)}</b></td><td>${UI.esc(c.phone || '—')}</td><td>${UI.esc(c.email || '—')}</td><td>${UI.esc(c.city || '—')}</td><td>${UI.esc(c.ifu || '—')}</td><td class="num"><button class="btn sm ghost" data-del="${c.id}">Supprimer</button></td></tr>`))}
      </div>`;
    $('#new-client').onclick = () => {
      const m = UI.modal('Nouveau client', `<div class="form-grid">
        <div><label>Nom</label><input class="field" id="c-name"></div>
        <div><label>Téléphone</label><input class="field" id="c-phone"></div>
        <div><label>E-mail</label><input class="field" id="c-email"></div>
        <div><label>Ville</label><input class="field" id="c-city"></div>
        <div><label>IFU</label><input class="field" id="c-ifu"></div>
      </div>`, `<button class="btn ghost" id="c-cancel">Annuler</button><button class="btn primary" id="c-ok">Enregistrer</button>`);
      $('#c-cancel').onclick = m.close;
      $('#c-ok').onclick = () => {
        const name = $('#c-name').value.trim();
        if (!name) return UI.toast('Nom requis', true);
        Store.add('clients', { id: Store.uid('CL'), orgId: Store.db.activeOrg, name, phone: $('#c-phone').value, email: $('#c-email').value, city: $('#c-city').value, ifu: $('#c-ifu').value });
        m.close(); UI.toast('Client ajouté'); vClients();
      };
    };
    $$('[data-del]').forEach(b => b.onclick = () => UI.confirm('Supprimer le client', 'Cette action est irréversible.', () => { Store.remove('clients', b.dataset.del); vClients(); }));
  }

  /* ---------- Invoices ---------- */
  function vInvoices() {
    const invoices = Store.invoices();
    const ca = invoices.reduce((a, i) => a + i.ttc, 0);
    $('#content').innerHTML = `<div class="grid kpi">
      <div class="kpi-card"><b>${UI.fcfa(ca)}</b><span>Total facturé TTC</span></div>
      <div class="kpi-card"><b>${invoices.length}</b><span>Factures émises</span></div>
    </div><div class="spacer"></div>
    <div class="card-head"><h2>Factures</h2><button class="btn primary" id="new-invoice">+ Nouvelle facture</button></div>
    <div class="card">${UI.table([{label:'N°'},{label:'Client'},{label:'Date'},{label:'HT',num:true},{label:'TVA',num:true},{label:'TTC',num:true},{label:'Mode'},{label:''}],
      invoices.map(i => `<tr><td><b>${UI.esc(i.id)}</b></td><td>${UI.esc(Store.client(i.clientId)?.name || 'Occasionnel')}</td><td>${UI.date(i.date)}</td><td class="num">${UI.fcfa(i.ht)}</td><td class="num">${UI.fcfa(i.tva)}</td><td class="num">${UI.fcfa(i.ttc)}</td><td>${UI.esc(i.mode)}</td><td class="num"><button class="btn sm ghost" data-if="${i.id}">PDF</button> <button class="btn sm ghost" data-prof="${i.id}">Proforma</button> <button class="btn sm ghost" data-bl="${i.id}">B. livraison</button> <button class="btn sm ghost" data-invcr="${i.id}">Avoir</button></td></tr>`))}
    </div>
    <div class="card" style="margin-top:16px"><h3>Conformité fiscale (Burkina Faso)</h3>
      <p class="muted small">La facture électronique certifiée (FEC) est prioritaire. Ce module n’affiche <b>jamais</b> la mention « conforme DGI » sans attestation. Régime : ${UI.esc(Store.rules().taxRegime || '—')} · retenue à la source : ${UI.esc(Store.rules().withholding || 0)} %. Les règles fiscales sont des données modifiables dans les réglages.</p>
      <div class="row"><span class="chip warn">Mode simulation FEC</span><span class="muted small">Code de certification, QR et identifiant MCF réservés aux comptes attestés.</span></div>
      <div class="row"><span>Avoirs et corrections</span><span class="muted small">Toute correction passe par un avoir : une facture émise n’est jamais modifiée.</span></div>
      <div class="row"><span>Hors ligne</span><span class="muted small">Devis et bons de commande utilisables sans réseau ; certification mise en file d’attente tant que le MCF est injoignable.</span></div>
    </div>`;
    $('#new-invoice').onclick = () => {
      const clients = Store.clients();
      const m = UI.modal('Nouvelle facture', `<div class="form-grid">
        <div><label>Client</label><select class="field" id="f-client"><option value="">— Occasionnel —</option>${clients.map(c => `<option value="${c.id}">${UI.esc(c.name)}</option>`).join('')}</select></div>
        <div><label>Montant HT (FCFA)</label><input class="field" type="number" id="f-ht" value="100000"></div>
        <div><label>Mode de facturation</label><select class="field" id="f-mode"><option>Facture simple</option><option>Facture normalisée</option><option>FEC (simulation)</option></select></div>
      </div>
      <div class="divider"></div><div class="small muted">TVA : ${Store.orgSettings().tva} % · Numérotation continue et inaltérable. Le mode FEC est une simulation : sans attestation DGI, aucun QR ni mention « conforme DGI » n’est ajouté.</div>`,
      `<button class="btn ghost" id="f-cancel">Annuler</button><button class="btn primary" id="f-ok">Émettre</button>`);
      $('#f-cancel').onclick = m.close;
      $('#f-ok').onclick = () => {
        const ht = Number($('#f-ht').value) || 0;
        const tva = ht * Store.orgSettings().tva / 100;
        const i = { id: Store.nextNumber('invoice'), orgId: Store.db.activeOrg, clientId: $('#f-client').value || null, date: Store.today(), ht: Math.round(ht), tva: Math.round(tva), ttc: Math.round(ht + tva), mode: $('#f-mode').value, fec: { code: '', qr: '', mcf: '' } };
        Store.add('invoices', i);
        let notice = 'Facture ' + i.id + ' émise';
        if (i.mode === 'FEC (simulation)') {
          const r = Integrations.fiscal.certify(i);
          notice += ' — ' + r.reason;
        }
        m.close(); UI.toast(notice); vInvoices();
      };
    };
    $$('[data-if]').forEach(b => b.onclick = () => printInvoice(Store.db.invoices.find(x => x.id === b.dataset.if)));
    $$('[data-prof]').forEach(b => b.onclick = () => {
      const i = Store.db.invoices.find(x => x.id === b.dataset.prof);
      printDoc('Facture proforma ' + i.id, 'Client : ' + (Store.client(i.clientId)?.name || 'Occasionnel'),
        [['Total HT', UI.fcfa(i.ht)], ['TVA', UI.fcfa(i.tva)], ['Total TTC', UI.fcfa(i.ttc)]],
        'Document provisoire, non fiscal. La facture définitive est émise après acceptation.');
    });
    $$('[data-bl]').forEach(b => b.onclick = () => {
      const i = Store.db.invoices.find(x => x.id === b.dataset.bl);
      const o = Store.orders().find(x => x.clientId === i.clientId && x.delivered) || Store.orders().find(x => x.clientId === i.clientId);
      printDoc('Bon de livraison — ' + i.id, 'Commande ' + (o?.id || '—') + ' · ' + UI.date(i.date), [
        ['Client', Store.client(i.clientId)?.name || 'Occasionnel'],
        ['Désignation', o?.desc || 'Prestations d’impression'],
        ['Statut', o?.delivered ? 'Livré et signé' : 'À livrer']
      ], 'Bon de livraison — à signer à la réception.');
    });
    $$('[data-invcr]').forEach(b => b.onclick = () => creditModal(Store.db.invoices.find(x => x.id === b.dataset.invcr)));
  }

  function printInvoice(i) {
    if (!i) return;
    const org = Store.org();
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>${i.id}</title><style>body{font:14px sans-serif;color:#0B122F;padding:30px}h1{color:#3A4F9E}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #ddd}td:last-child{text-align:right}.total{font-weight:bold;font-size:16px}</style></head><body>
      <h1>${UI.esc(org.name)}</h1><p>${UI.esc(org.ifu)} · ${UI.esc(org.rccm)} · ${UI.esc(org.settings.phone)}</p>
      <h2>Facture ${UI.esc(i.id)}</h2><p>Date : ${UI.date(i.date)}<br>Client : ${UI.esc(Store.client(i.clientId)?.name || 'Client occasionnel')}</p>
      <table><tr><td>Total HT</td><td>${UI.fcfa(i.ht)}</td></tr><tr><td>TVA (${org.settings.tva} %)</td><td>${UI.fcfa(i.tva)}</td></tr><tr class="total"><td>Total TTC</td><td>${UI.fcfa(i.ttc)}</td></tr></table>
      <p style="margin-top:20px;font-size:12px">${UI.esc(i.mode)}. Aucune mention de conformité DGI sans attestation.</p>
      <p style="margin-top:30px;font-size:11px;color:#666">Propulsé par HaiBer Gestion · ${UI.esc(org.settings.phone || '')}<br>Conçu par Touch Unique · +226 55 04 15 30</p></body></html>`);
    w.document.close(); w.print();
  }

  /* ---------- Payments ---------- */
  function vPayments() {
    const pays = Store.payments(), methods = Store.rules().paymentMethods, rules = Store.rules();
    $('#content').innerHTML = `<div class="grid two" style="align-items:start">
      <div><div class="card-head"><h2>Paiements (${pays.length})</h2><button class="btn primary" id="new-pay">+ Enregistrer un paiement</button></div>
      <div class="card">${UI.table([{label:'N°'},{label:'Facture'},{label:'Moyen'},{label:'Référence'},{label:'Montant',num:true},{label:'Statut'},{label:''}],
        pays.map(p => {
          const inv = Store.db.invoices.find(i => i.id === p.invoiceId);
          const cl = Store.client(inv?.clientId);
          const msg = 'Bonjour ' + (cl ? cl.name : '') + ', votre paiement ' + p.id + ' (' + UI.fcfa(p.amount) + ') est enregistré. Merci. HaiBer';
          return `<tr><td><b>${UI.esc(p.id)}</b></td><td>${UI.esc(p.invoiceId || '—')}</td><td>${UI.esc(p.method)}</td><td>${UI.esc(p.ref || '—')}</td><td class="num">${UI.fcfa(p.amount)}</td><td><span class="chip ${p.status === 'confirmé' ? 'ok' : ['échoué','annulé'].includes(p.status) ? 'danger' : 'warn'}">${UI.esc(p.status)}</span></td><td class="num"><button class="btn sm ghost" data-receipt="${p.id}">Reçu</button> <a class="btn sm ghost" target="_blank" href="${waLink(cl?.phone, msg)}">💬</a></td></tr>`;
        }))}
      </div></div>
      <div class="card"><h3>Moyens de paiement configurables</h3><p class="small muted">Les opérateurs burkinabè sont activables/désactivables par organisation. Aucun PIN, OTP ou numéro de carte n’est stocké.</p>
        <div>${methods.map(m => `<span class="chip" style="margin:3px">${UI.esc(m)}</span>`).join('')}</div>
        <div class="divider"></div><h3>Niveaux d’intégration</h3>
        <div class="small muted"><b>1. Manuel</b> — saisie de la référence + capture d’écran, paiement « à vérifier ».<br><b>2. Agrégateur</b> — lien/USSD avec webhook signé (Ligdicash, PayDunya, CinetPay, YengaPay).<br><b>3. API directe</b> — Orange Money, Moov Money, Coris Money.</div>
        <div class="divider"></div><h3>Plafonds et frais</h3>
        <div class="small muted">${Object.entries(rules.paymentLimits || {}).map(([k, v]) => `${UI.esc(k)} : ${UI.fcfa(v)}`).join('<br>')}<br>Frais estimés ${UI.esc(rules.feeRate)} % à la charge de l’<b>${UI.esc(rules.feePayer)}</b>. Au-delà du plafond, proposer un virement ou un fractionnement.</div>
      </div>
    </div>`;
    $('#new-pay').onclick = () => {
      const invs = Store.invoices();
      const m = UI.modal('Enregistrer un paiement', `<div class="form-grid">
        <div><label>Facture</label><select class="field" id="p-inv"><option value="">— Aucune —</option>${invs.map(i => `<option value="${i.id}">${i.id} — ${UI.fcfa(i.ttc)}</option>`).join('')}</select></div>
        <div><label>Moyen de paiement</label><select class="field" id="p-method">${methods.map(x => `<option>${UI.esc(x)}</option>`).join('')}</select></div>
        <div><label>Montant (FCFA)</label><input class="field" type="number" id="p-amount" value="100000"></div>
        <div><label>Référence transaction</label><input class="field" id="p-ref" placeholder="Ex. OM-2026-XXXX"></div>
        <div><label>Statut</label><select class="field" id="p-status">${(rules.paymentStatuses || []).map(s => `<option ${s === 'à vérifier' ? 'selected' : ''}>${UI.esc(s)}</option>`).join('')}</select></div>
      </div>`, `<button class="btn ghost" id="p-cancel">Annuler</button><button class="btn primary" id="p-ok">Enregistrer</button>`);
      $('#p-cancel').onclick = m.close;
      $('#p-ok').onclick = () => {
        const p = { id: Store.uid('PAY'), orgId: Store.db.activeOrg, invoiceId: $('#p-inv').value || null, method: $('#p-method').value, amount: Number($('#p-amount').value) || 0, ref: $('#p-ref').value, status: $('#p-status').value, date: Store.today() };
        const limit = (rules.paymentLimits || {})[p.method];
        if (limit && p.amount > limit && !confirm('Montant au-dessus du plafond ' + UI.fcfa(limit) + '. Proposer un virement ou un fractionnement ? Continuer quand même ?')) return;
        Store.add('payments', p); m.close(); UI.toast('Paiement enregistré — reçu disponible'); vPayments();
      };
    };
    $$('[data-receipt]').forEach(b => b.onclick = () => {
      const p = Store.db.payments.find(x => x.id === b.dataset.receipt);
      const inv = Store.db.invoices.find(i => i.id === p.invoiceId);
      const cl = Store.client(inv?.clientId);
      printDoc('Reçu de paiement ' + p.id, 'Facture ' + (p.invoiceId || '—') + ' · ' + UI.date(p.date), [
        ['Client', cl ? cl.name : 'Client occasionnel'], ['Moyen', p.method], ['Référence', p.ref || '—'],
        ['Statut', p.status], ['Montant reçu', UI.fcfa(p.amount)]
      ], 'Aucun PIN, OTP ou numéro de carte n’est stocké par HaiBer.');
    });
  }

  /* ---------- Caisse comptoir ---------- */
  function waLink(phone, message) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    // Le compte WhatsApp Business HaiBer est enregistré avec le 0 national :
    // +226 06 87 97 10 -> https://wa.me/22606879710
    return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(message);
  }

  function vCash() {
    const sales = Store.cash().filter(x => x.kind !== 'closure');
    const closures = Store.cash().filter(x => x.kind === 'closure');
    const today = Store.today();
    const daySales = sales.filter(s => s.date === today);
    const total = a => a.reduce((s, x) => s + (x.amount || 0), 0);
    $('#content').innerHTML = `<div class="grid kpi">
      <div class="kpi-card"><b>${UI.fcfa(total(daySales))}</b><span>Ventes du jour</span></div>
      <div class="kpi-card"><b>${daySales.length}</b><span>Tickets émis</span></div>
      <div class="kpi-card"><b>${UI.fcfa(total(sales) - total(closures))}</b><span>Solde non clôturé</span></div>
      <div class="kpi-card"><b>${closures.length}</b><span>Clôtures enregistrées</span></div>
    </div><div class="spacer"></div>
    <div class="card-head"><h2>Caisse comptoir</h2><div class="row" style="gap:8px"><button class="btn ghost" id="close-cash">Clôturer la caisse</button><button class="btn primary" id="new-sale">+ Vente rapide</button></div></div>
    <div class="card">${UI.table([{label:'Ticket'},{label:'Date'},{label:'Article'},{label:'Client'},{label:'Moyen'},{label:'Montant',num:true},{label:''}],
      sales.slice().reverse().map(s => `<tr><td><b>${UI.esc(s.id)}</b></td><td>${UI.date(s.date)}</td><td>${UI.esc(s.item)} × ${s.qty}</td><td>${UI.esc(s.clientName || 'Comptoir')}</td><td>${UI.esc(s.method)}</td><td class="num">${UI.fcfa(s.amount)}</td><td class="num"><button class="btn sm ghost" data-ticket="${s.id}">Ticket</button></td></tr>`))}
    </div>
    <div class="small muted" style="margin-top:10px">Vente rapide : cartes de visite, photocopies, tampons, objets publicitaires. Impression thermique 58/80 mm prévue dans la version matérielle.</div>`;
    $('#new-sale').onclick = () => {
      const cat = Store.rules().catalog;
      const m = UI.modal('Vente rapide', `<div class="form-grid">
        <div><label>Article du catalogue</label><select class="field" id="cs-item">${cat.map(c => `<option value="${UI.esc(c.name)}" data-price="${c.price}">${UI.esc(c.name)} — ${UI.fcfa(c.price)}</option>`).join('')}</select></div>
        <div><label>Quantité</label><input class="field" type="number" min="1" id="cs-qty" value="1"></div>
        <div><label>Prix unitaire (FCFA)</label><input class="field" type="number" id="cs-price" value="${cat[0]?.price || 0}"></div>
        <div><label>Moyen de paiement</label><select class="field" id="cs-method">${Store.rules().paymentMethods.map(x => `<option>${UI.esc(x)}</option>`).join('')}</select></div>
        <div><label>Client (facultatif)</label><select class="field" id="cs-client"><option value="">— Comptoir —</option>${Store.clients().map(c => `<option value="${c.id}">${UI.esc(c.name)}</option>`).join('')}</select></div>
      </div>`, `<button class="btn ghost" id="cs-cancel">Annuler</button><button class="btn primary" id="cs-ok">Enregistrer et imprimer</button>`);
      $('#cs-item').onchange = e => { $('#cs-price').value = e.target.selectedOptions[0].dataset.price; };
      $('#cs-cancel').onclick = m.close;
      $('#cs-ok').onclick = () => {
        const qty = Math.max(1, Number($('#cs-qty').value) || 1);
        const price = Number($('#cs-price').value) || 0;
        const c = Store.client($('#cs-client').value);
        const s = { id: Store.nextNumber('cash'), orgId: Store.db.activeOrg, kind: 'sale', date: Store.today(),
          item: $('#cs-item').value, qty, price, amount: qty * price, method: $('#cs-method').value,
          clientId: c ? c.id : null, clientName: c ? c.name : '' };
        Store.add('cash', s); m.close(); UI.toast('Vente ' + s.id + ' enregistrée'); vCash();
        printDoc('Ticket de caisse ' + s.id, UI.date(s.date), [
          ['Article', s.item + ' × ' + s.qty], ['Paiement', s.method], ['Total TTC', UI.fcfa(s.amount)]
        ], 'Ticket non fiscal — facture à demander au comptoir.');
      };
    };
    $('#close-cash').onclick = () => {
      const amount = total(sales) - total(closures);
      const m = UI.modal('Clôture de caisse', `<p>Vente totale non clôturée : <b>${UI.fcfa(amount)}</b></p>
        <div><label>Observations</label><input class="field" id="cc-note" placeholder="Écart, espèces, mobile money…"></div>`,
        `<button class="btn ghost" id="cc-cancel">Annuler</button><button class="btn primary" id="cc-ok">Enregistrer la clôture</button>`);
      $('#cc-cancel').onclick = m.close;
      $('#cc-ok').onclick = () => {
        Store.add('cash', { id: Store.uid('CLO'), orgId: Store.db.activeOrg, kind: 'closure', date: Store.today(), amount, note: $('#cc-note').value, by: currentUser.name });
        Store.log('cash-close', UI.fcfa(amount)); m.close(); UI.toast('Caisse clôturée'); vCash();
      };
    };
    $$('[data-ticket]').forEach(b => b.onclick = () => {
      const s = Store.db.cash.find(x => x.id === b.dataset.ticket);
      printDoc('Ticket ' + s.id, UI.date(s.date), [
        [s.item + ' × ' + s.qty, UI.fcfa(s.amount)], ['Moyen', s.method]
      ], 'Merci de votre visite.');
    });
  }

  /* ---------- Créances et avoirs ---------- */
  function creditModal(invoice) {
    const invs = Store.invoices();
    const m = UI.modal('Nouvel avoir', `<div class="form-grid">
      <div><label>Facture concernée</label><select class="field" id="cr-inv">${invs.map(i => `<option value="${i.id}" ${invoice && invoice.id === i.id ? 'selected' : ''}>${i.id} — ${UI.fcfa(i.ttc)}</option>`).join('')}</select></div>
      <div><label>Montant (FCFA)</label><input class="field" type="number" id="cr-amount" value="${invoice ? Math.round(invoice.ttc / 2) : 0}"></div>
      <div style="grid-column:1/-1"><label>Motif</label><input class="field" id="cr-reason" placeholder="Ex. erreur de quantité, retour client"></div>
    </div><div class="small muted" style="margin-top:8px">L’avoir est enregistré de façon inaltérable : la facture émise n’est jamais modifiée.</div>`,
      `<button class="btn ghost" id="cr-cancel">Annuler</button><button class="btn primary" id="cr-ok">Émettre l’avoir</button>`);
    $('#cr-cancel').onclick = m.close;
    $('#cr-ok').onclick = () => {
      const c = { id: Store.nextNumber('credit'), orgId: Store.db.activeOrg, invoiceId: $('#cr-inv').value,
        amount: Number($('#cr-amount').value) || 0, reason: $('#cr-reason').value, date: Store.today() };
      if (!c.amount) return UI.toast('Montant requis', true);
      Store.add('creditNotes', c); m.close(); UI.toast('Avoir ' + c.id + ' émis');
      if (page === 'credits') vCredits(); else vInvoices();
    };
  }

  function balance(invoice) {
    const paid = Store.payments().filter(p => p.invoiceId === invoice.id && p.status === 'confirmé').reduce((a, p) => a + p.amount, 0);
    const credits = Store.creditNotes().filter(c => c.invoiceId === invoice.id).reduce((a, c) => a + c.amount, 0);
    return Math.max(0, invoice.ttc - paid - credits);
  }

  function vCredits() {
    const unpaid = Store.invoices().map(i => ({ i, due: balance(i) })).filter(x => x.due > 0);
    const credits = Store.creditNotes();
    const total = unpaid.reduce((a, x) => a + x.due, 0);
    $('#content').innerHTML = `<div class="grid kpi">
      <div class="kpi-card"><b>${UI.fcfa(total)}</b><span>Total créances</span></div>
      <div class="kpi-card"><b>${unpaid.length}</b><span>Factures impayées</span></div>
      <div class="kpi-card"><b>${UI.fcfa(credits.reduce((a, c) => a + c.amount, 0))}</b><span>Avoirs émis</span></div>
    </div><div class="spacer"></div>
    <div class="card-head"><h2>Impayés et relances</h2><button class="btn ghost" id="new-credit-standalone">+ Nouvel avoir</button></div>
    <div class="card">${UI.table([{label:'Facture'},{label:'Client'},{label:'Date'},{label:'Reste dû',num:true},{label:'Relance'},{label:''}],
      unpaid.map(({ i, due }) => {
        const c = Store.client(i.clientId);
        const msg = 'Bonjour ' + (c ? c.name : '') + ', rappel de la facture ' + i.id + ' : solde ' + UI.fcfa(due) + '. Merci. HaiBer';
        return `<tr><td><b>${UI.esc(i.id)}</b></td><td>${UI.esc(c?.name || 'Occasionnel')}</td><td>${UI.date(i.date)}</td><td class="num">${UI.fcfa(due)}</td><td><a class="btn sm ghost" target="_blank" href="${waLink(c?.phone, msg)}">💬 WhatsApp</a></td><td class="num"><button class="btn sm ghost" data-cr="${i.id}">Avoir</button></td></tr>`;
      }))}
    </div>
    <div class="section-title">Avoirs émis</div>
    <div class="card">${UI.table([{label:'N°'},{label:'Facture'},{label:'Date'},{label:'Montant',num:true},{label:'Motif'},{label:''}],
      credits.map(c => `<tr><td><b>${UI.esc(c.id)}</b></td><td>${UI.esc(c.invoiceId || '—')}</td><td>${UI.date(c.date)}</td><td class="num">${UI.fcfa(c.amount)}</td><td>${UI.esc(c.reason || '—')}</td><td class="num"><button class="btn sm ghost" data-acr="${c.id}">PDF</button></td></tr>`))}
    </div>`;
    $('#new-credit-standalone').onclick = () => creditModal(null);
    $$('[data-cr]').forEach(b => b.onclick = () => creditModal(Store.db.invoices.find(i => i.id === b.dataset.cr)));
    $$('[data-acr]').forEach(b => b.onclick = () => {
      const c = Store.db.creditNotes.find(x => x.id === b.dataset.acr);
      printDoc('Avoir ' + c.id, 'Facture ' + (c.invoiceId || '—') + ' · ' + UI.date(c.date),
        [['Motif', c.reason || '—'], ['Montant', UI.fcfa(c.amount)]], 'Avoir enregistré sans modification de la facture initiale.');
    });
  }

  /* ---------- Stocks ---------- */
  function vStocks() {
    const stocks = Store.stocks();
    $('#content').innerHTML = `<div class="card-head"><h2>Stocks (${stocks.length})</h2><button class="btn primary" id="new-stock">+ Nouvelle matière</button></div>
      <div class="card"><h3>Périodes fortes à anticiper</h3><div class="small muted">${(Store.db.seasons || []).map(x => `<span class="chip" style="margin:2px">${UI.esc(x)}</span>`).join('')}</div></div>
      <div class="spacer"></div>
      <div class="card">${UI.table([{label:'Matière'},{label:'Catégorie'},{label:'Qté',num:true},{label:'Seuil',num:true},{label:'Unité'},{label:'Fournisseur'},{label:'Alerte'},{label:''}],
        stocks.map(s => `<tr><td><b>${UI.esc(s.name)}</b></td><td>${UI.esc(s.category)}</td><td class="num">${s.qty}</td><td class="num">${s.min}</td><td>${UI.esc(s.unit)}</td><td>${UI.esc(s.supplier || '—')}</td><td><span class="chip ${s.qty <= s.min ? 'warn' : 'ok'}">${s.qty <= s.min ? 'Rupture proche' : 'OK'}</span></td><td class="num"><button class="btn sm ghost" data-stock="${s.id}">Modifier</button></td></tr>`))}
      </div>`;
    $('#new-stock').onclick = () => stockModal(null);
    $$('[data-stock]').forEach(b => b.onclick = () => stockModal(Store.db.stocks.find(s => s.id === b.dataset.stock)));
  }

  function stockModal(s) {
    const sup = Store.rules().suppliers;
    const m = UI.modal(s ? 'Modifier la matière' : 'Nouvelle matière', `<div class="form-grid">
      <div><label>Nom</label><input class="field" id="s-name" value="${s ? UI.esc(s.name) : ''}"></div>
      <div><label>Catégorie</label><select class="field" id="s-cat">${['Matière','Encre','Consommable','Écran','Autre'].map(c => `<option ${s && s.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div><label>Quantité</label><input class="field" type="number" id="s-qty" value="${s ? s.qty : 0}"></div>
      <div><label>Seuil d’alerte</label><input class="field" type="number" id="s-min" value="${s ? s.min : 2}"></div>
      <div><label>Unité</label><input class="field" id="s-unit" value="${s ? UI.esc(s.unit) : 'pièce'}"></div>
      <div><label>Fournisseur</label><select class="field" id="s-sup">${sup.map(x => `<option ${s && s.supplier === x ? 'selected' : ''}>${UI.esc(x)}</option>`).join('')}</select></div>
    </div>`, `<button class="btn ghost" id="s-cancel">Annuler</button><button class="btn primary" id="s-ok">Enregistrer</button>`);
    $('#s-cancel').onclick = m.close;
    $('#s-ok').onclick = () => {
      const data = { name: $('#s-name').value.trim(), category: $('#s-cat').value, qty: Number($('#s-qty').value) || 0, min: Number($('#s-min').value) || 0, unit: $('#s-unit').value, supplier: $('#s-sup').value };
      if (!data.name) return UI.toast('Nom requis', true);
      if (s) Store.update('stocks', s.id, data);
      else Store.add('stocks', { id: Store.uid('ST'), orgId: Store.db.activeOrg, ...data });
      m.close(); UI.toast('Stock enregistré'); updateNotif(); vStocks();
    };
  }

  /* ---------- Settings ---------- */
  function vSettings() {
    const o = Store.org(), r = Store.rules(), s = o.settings;
    $('#content').innerHTML = `<div class="grid two" style="align-items:start">
      <div class="card"><h3>Organisation & coordonnées HaiBer</h3><div class="form-grid">
        <div><label>Nom</label><input class="field" id="set-name" value="${UI.esc(o.name)}"></div>
        <div><label>IFU</label><input class="field" id="set-ifu" value="${UI.esc(o.ifu)}"></div>
        <div><label>RCCM</label><input class="field" id="set-rccm" value="${UI.esc(o.rccm)}"></div>
        <div><label>Téléphone support / WhatsApp</label><input class="field" id="set-phone" value="${UI.esc(s.phone)}"></div>
        <div><label>Téléphone 2</label><input class="field" id="set-phone2" value="${UI.esc(s.phone2 || '')}"></div>
        <div><label>E-mail de contact</label><input class="field" id="set-email" value="${UI.esc(s.email || '')}"></div>
        <div style="grid-column:1/-1"><label>Ville / adresse</label><input class="field" id="set-city" value="${UI.esc(s.city || o.city || '')}"></div>
        <div style="grid-column:1/-1"><label>Tagline</label><input class="field" id="set-tagline" value="${UI.esc(s.tagline || o.tagline || '')}"></div>
        <div style="grid-column:1/-1"><label>Livraison</label><input class="field" id="set-delivery" value="${UI.esc(s.delivery || '')}"></div>
      </div></div>
      <div class="card"><h3>Règles métier</h3><div class="form-grid">
        <div><label>TVA (%)</label><input class="field" type="number" id="set-tva" value="${s.tva}"></div>
        <div><label>Marge par défaut (%)</label><input class="field" type="number" id="set-marge" value="${s.margeDefaut}"></div>
        <div><label>Gâche (%)</label><input class="field" type="number" id="set-gache" value="${s.gache}"></div>
        <div><label>Express (%)</label><input class="field" type="number" id="set-express" value="${s.express}"></div>
        <div><label>Coût machine / h</label><input class="field" type="number" id="set-mh" value="${r.machineHour}"></div>
        <div><label>Vitesse (m²/h)</label><input class="field" type="number" id="set-speed" value="${r.speedM2H}"></div>
        <div><label>Main-d’œuvre / h</label><input class="field" type="number" id="set-lh" value="${r.laborHour}"></div>
        <div><label>Encre / m²</label><input class="field" type="number" id="set-ink" value="${r.inkM2}"></div>
      </div></div>
    </div>
    <div class="spacer"></div>
    <div class="grid two" style="align-items:start">
      <div class="card"><h3>Licence et tarifs</h3>
        <div class="small muted">Prix de départ hors TVA, modifiables ici — jamais codés en dur.</div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Offre</th><th>Postes</th><th>Mensuel</th><th>Annuel</th><th>Installation</th></tr></thead><tbody>
        ${(Store.db.licensePlans || []).map(p => `<tr><td><b>${UI.esc(p.name)}</b></td><td>${UI.esc(p.seats)}</td><td>${UI.fcfa(p.monthly)}</td><td>${p.yearly ? UI.fcfa(p.yearly) : 'sur devis'}</td><td>${p.setup ? UI.fcfa(p.setup) : 'sur devis'}</td></tr>`).join('')}
        </tbody></table></div>
        <div class="form-grid" style="margin-top:12px">
          <div><label>Offre active</label><select class="field" id="set-plan">${(Store.db.licensePlans || []).map(p => `<option ${p.name === s.license.plan ? 'selected' : ''}>${UI.esc(p.name)}</option>`).join('')}</select></div>
          <div><label>Clé d’activation</label><input class="field" id="set-license-key" value="${UI.esc(r.licenseKey || '')}" placeholder="Clé signée, vérifiable hors ligne"></div>
          <div><label>Tolérance après échéance (jours)</label><input class="field" type="number" id="set-grace" value="${r.licenseGraceDays || 30}"></div>
        </div>
        <div class="row" style="margin-top:10px"><span>Modules actifs</span><span>${s.license.modules.map(m => `<span class="chip" style="margin-left:3px">${UI.esc(m)}</span>`).join('')}</span></div>
        <div class="row"><span>Échéance</span><span>${UI.date(s.license.expires)} ${Store.readOnly() ? '<span class="chip danger">lecture seule</span>' : ''}</span></div>
        <div class="small muted" style="margin-top:10px">Après l’échéance et la tolérance : lecture seule, export toujours disponible. La clé signée est une simulation dans cette démo.</div>
      </div>
      <div class="card"><h3>Fiscalité, paiements et domaines</h3><div class="form-grid">
        <div><label>Régime d’imposition</label><input class="field" id="set-regime" value="${UI.esc(r.taxRegime || '')}"></div>
        <div><label>Retenue à la source (%)</label><input class="field" type="number" id="set-withholding" value="${r.withholding || 0}"></div>
        <div><label>Frais de paiement (%)</label><input class="field" type="number" step="0.1" id="set-fee" value="${r.feeRate || 0}"></div>
        <div><label>Frais à la charge de</label><select class="field" id="set-fee-payer"><option ${r.feePayer === 'entreprise' ? 'selected' : ''}>entreprise</option><option ${r.feePayer === 'client' ? 'selected' : ''}>client</option></select></div>
        <div><label>Domaine application</label><input class="field" id="set-domain-app" value="${UI.esc(r.domains?.app || '')}"></div>
        <div><label>Domaine API</label><input class="field" id="set-domain-api" value="${UI.esc(r.domains?.api || '')}"></div>
        <div><label>Portail client</label><input class="field" id="set-domain-portal" value="${UI.esc(r.domains?.portal || '')}"></div>
      </div><div class="small muted" style="margin-top:8px">Aucun domaine n’est figé dans le code : ces valeurs seront des variables d’environnement côté serveur.</div></div>
    </div>
    <div class="spacer"></div>
    <div class="grid two" style="align-items:start">
      <div class="card"><h3>Devises et matières importées</h3>
        <div class="small muted">Taux de change modifiables, utilisés pour le prix de revient des imports.</div>
        <div class="form-grid" style="margin-top:10px">${Object.entries(Store.db.currencyRates || {}).map(([k,v]) => `<div><label>${UI.esc(k)} → FCFA</label><input class="field" type="number" step="0.001" id="rate-${k}" value="${v}"></div>`).join('')}</div>
        <div class="divider"></div><div class="row"><input class="field" type="number" id="conv-amount" value="100" style="max-width:120px"><select class="field" id="conv-currency" style="max-width:110px">${Object.keys(Store.db.currencyRates || {}).map(k => `<option>${UI.esc(k)}</option>`).join('')}</select><button class="btn teal" id="conv-go">Convertir</button></div>
        <div id="conv-result" class="small" style="margin-top:8px"></div>
      </div>
      <div class="card"><h3>Saisonnalité et sous-traitance</h3>
        <div class="small muted">Périodes fortes configurables pour anticiper les stocks.</div>
        <div style="margin:8px 0">${(Store.db.seasons || []).map(x => `<span class="chip" style="margin:2px">${UI.esc(x)}</span>`).join('')}</div>
        <div class="divider"></div>
        ${Store.subcontractors().map(x => `<div class="row" style="justify-content:space-between"><span><b>${UI.esc(x.name)}</b> · ${UI.esc(x.specialty || '—')}</span><a class="btn sm ghost" target="_blank" href="${waLink(x.phone, 'Bonjour ' + x.name + ', nous avons un travail à sous-traiter. HaiBer')}">💬 ${UI.esc(x.phone || 'Appeler')}</a></div><div class="small muted">${UI.esc(x.note || '')}</div>`).join('') || '<div class="small muted">Aucun sous-traitant enregistré.</div>'}
      </div>
    </div>
    <div class="spacer"></div>
    <div class="card"><h3>Environnement</h3>
      <div class="row"><span>Mode actuel</span><span class="chip ${Store.isDemo() ? 'warn' : 'ok'}">${Store.isDemo() ? 'Démonstration (données fictives)' : 'Atelier réel (données locales)'}</span></div>
      <div class="row"><span>Stockage</span><span class="muted small">Local sur cet appareil · export JSON pour sauvegarde</span></div>
      <div class="row"><span>Licence</span><span class="muted small">${r.licenseKey ? 'Clé enregistrée (vérification serveur à brancher)' : 'Non activée — voir docs/PASSAGE_EN_PRODUCTION.md'}</span></div>
      <div class="small muted" style="margin-top:8px">Le passage en mode réel efface les données fictives et met en place votre organisation, votre administrateur et votre code d’accès local.</div>
      <div style="margin-top:10px">${Store.isDemo() ? '<button class="btn teal" id="go-real">Configurer mon atelier (mode réel)</button>' : '<button class="btn ghost" id="back-demo">Revenir au mode démonstration</button>'}</div>
    </div>
    <div class="spacer"></div>
    <div class="card"><h3>Intégrations externes</h3>
      <div class="row"><span>Paiement manuel (niveau 1)</span><span class="chip ok">Actif</span></div>
      <div class="row"><span>Agrégateur / API opérateur</span><span class="chip warn">Non connecté</span></div>
      <div class="row"><span>Facture certifiée FEC</span><span class="chip warn">Simulation · attestation DGI requise</span></div>
      <div class="row"><span>Serveur multi-appareils</span><span class="chip warn">Non déployé</span></div>
      <div class="row"><span>Factures en attente de certification</span><span>${Integrations.fiscal.queue().length}</span></div>
      <div class="small muted" style="margin-top:8px">Les contrats sont définis dans <code>js/integrations.js</code>. La marche à suivre pour les activer est dans <b>docs/PASSAGE_EN_PRODUCTION.md</b>. Aucune écriture ni certification n’est simulée comme réelle.</div>
    </div>
    <div class="spacer"></div>
    <div class="row"><button class="btn ghost" id="reset-demo">Réinitialiser les données de démo</button><button class="btn teal" id="export-data">⬇ Exporter les données (JSON)</button><button class="btn ghost" id="import-data">⬆ Importer</button><input type="file" id="import-file" accept=".json,application/json" class="hidden"><button class="btn primary" id="save-settings">Enregistrer les réglages</button></div>
    <div class="small muted" style="margin-top:8px">L’export contient toutes vos organisations, données et règles métier. Il permet la sauvegarde, le transfert vers un autre appareil ou la migration future vers l’API. L’import remplace la base locale après confirmation.</div>`;
    $('#conv-go').onclick = () => {
      const rate = Number(Store.db.currencyRates[$('#conv-currency').value]) || 0;
      const amount = Number($('#conv-amount').value) || 0;
      $('#conv-result').innerHTML = `<b>${amount.toLocaleString('fr-FR')} ${UI.esc($('#conv-currency').value)} = ${UI.fcfa(amount * rate)}</b>`;
    };
    $('#save-settings').onclick = () => {
      if (Store.readOnly()) return UI.toast('Licence expirée : réglages verrouillés en lecture seule.', true);
      o.name = $('#set-name').value; o.ifu = $('#set-ifu').value; o.rccm = $('#set-rccm').value;
      s.phone = $('#set-phone').value;
      s.phone2 = $('#set-phone2').value;
      s.email = $('#set-email').value;
      s.city = $('#set-city').value;
      s.tagline = $('#set-tagline').value;
      s.delivery = $('#set-delivery').value;
      o.phone2 = s.phone2; o.email = s.email; o.city = s.city; o.tagline = s.tagline;
      s.tva = Number($('#set-tva').value) || 0; s.margeDefaut = Number($('#set-marge').value) || 0;
      s.gache = Number($('#set-gache').value) || 0; s.express = Number($('#set-express').value) || 0;
      r.machineHour = Number($('#set-mh').value) || 0; r.speedM2H = Number($('#set-speed').value) || 1;
      r.laborHour = Number($('#set-lh').value) || 0; r.inkM2 = Number($('#set-ink').value) || 0;
      const plan = (Store.db.licensePlans || []).find(p => p.name === $('#set-plan').value);
      if (plan) { s.license.plan = plan.name; s.license.seats = plan.seats; }
      r.licenseKey = $('#set-license-key').value;
      r.licenseGraceDays = Number($('#set-grace').value) || 0;
      r.taxRegime = $('#set-regime').value;
      r.withholding = Number($('#set-withholding').value) || 0;
      r.feeRate = Number($('#set-fee').value) || 0;
      r.feePayer = $('#set-fee-payer').value;
      r.domains = { app: $('#set-domain-app').value, api: $('#set-domain-api').value, portal: $('#set-domain-portal').value };
      Object.keys(Store.db.currencyRates || {}).forEach(k => { const el = $('#rate-' + k); if (el) Store.db.currencyRates[k] = Number(el.value) || 0; });
      Store.log('settings', 'Règles métier modifiées'); Store.save();
      UI.toast('Réglages enregistrés'); renderShell();
    };
    $('#reset-demo').onclick = () => UI.confirm('Réinitialiser', 'Toutes les données fictives seront restaurées.', () => { Store.reset(); currentUser = Store.users()[0]; renderShell(); go('home'); UI.toast('Données réinitialisées'); });
    if ($('#go-real')) $('#go-real').onclick = setupWizard;
    if ($('#back-demo')) $('#back-demo').onclick = () => UI.confirm('Mode démonstration', 'Vos données réelles seront remplacées par les données fictives. Exportez d’abord une sauvegarde.', () => { Store.reset(); currentUser = Store.users()[0]; renderShell(); go('settings'); UI.toast('Mode démonstration restauré'); });
    $('#export-data').onclick = () => {
      const blob = new Blob([JSON.stringify(Store.db, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'haiber-sauvegarde-' + Store.today() + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      UI.toast('Sauvegarde exportée');
    };
    $('#import-data').onclick = () => $('#import-file').click();
    $('#import-file').onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data.orgs || !data.activeOrg || !data.clients) throw new Error('Format invalide');
          UI.confirm('Importer la sauvegarde', 'Les données actuelles seront remplacées par le fichier « ' + file.name + ' ».', () => {
            localStorage.setItem('hb_db_v1', JSON.stringify(data));
            location.reload();
          });
        } catch (err) { UI.toast('Fichier de sauvegarde invalide', true); }
      };
      reader.readAsText(file);
    };
  }

  /* ---------- About ---------- */
  function vAbout() {
    const org = Store.org(), s = org.settings || {};
    $('#content').innerHTML = `<div class="grid two">
      <div class="card" style="text-align:center"><div class="login-logo">${UI.logo()}</div>
        <h2 style="margin:10px 0 0;color:var(--teal-dark)">HAIBER</h2>
        <p class="slogan" style="color:var(--gold);font-weight:800;letter-spacing:2px">CONCEPTION · PACKAGING · IMPRESSION · MULTI-MÉDIA · RÉSINE</p>
        <p><b>${UI.esc(s.tagline || org.tagline || '')}</b></p>
        <p class="small muted">${UI.esc(s.city || org.city || '')}</p>
        <p class="small muted">Whatsapp : ${UI.esc(s.phone || '')}${s.phone2 ? ' · Téléphone 2 : ' + UI.esc(s.phone2) : ''}</p>
        ${s.email ? `<p class="small muted">E-mail : ${UI.esc(s.email)}</p>` : ''}
        ${s.delivery ? `<p class="small muted">Livraison : ${UI.esc(s.delivery)}</p>` : ''}
        ${(org.ifu || org.rccm) ? `<p class="small muted">${UI.esc([org.ifu && ('IFU ' + org.ifu), org.rccm && ('RCCM ' + org.rccm)].filter(Boolean).join(' · '))}</p>` : ''}
        <a class="btn primary" href="${waLink(s.phone, 'Bonjour HaiBer, je souhaite être rappelé.')}" target="_blank">💬 Support client : ${UI.esc(s.phone || '+226 06 87 97 10')}</a>
        <a class="btn ghost" style="margin-top:8px" href="https://haibermultiservices564-gif.github.io/haiber-site/" target="_blank">🌐 Site web & boutique HaiBer ↗</a>
        <div class="small muted" style="margin-top:10px">Conçu par <b>Touch Unique</b> · +226 55 04 15 30</div>
      </div>
      <div class="card"><h3>À propos de cette version</h3>
        <p class="muted">Application web autonome (offline-first) démontrant les modules principaux : moteur de devis partagé, commandes, production, facturation, paiements mobile money et stocks prédictifs.</p>
        <p class="muted small">Les données sont fictives et stockées localement dans votre navigateur. Aucune donnée n’est envoyée sur un serveur.</p>
        <div class="divider"></div>
        <h3>Journal d’audit</h3><div class="small muted">${Store.audit().slice(0,5).map(a => `<div class="row"><span>${UI.esc(a.action)}</span><span>${UI.date(a.at)}</span></div>`).join('') || 'Aucune opération enregistrée.'}</div>
      </div>
    </div>`;
  }

  /* ---------- Init ---------- */
  function init() {
    try { const t = localStorage.getItem('hb_theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
    let knownSiteOrders = siteOrders().length;
    window.addEventListener('storage', (e) => {
      if (e.key !== SITE_ORDERS_KEY) return;
      const list = siteOrders();
      refreshSiteOrderIndicators();
      if (currentUser && page === 'site-orders') vSiteOrders();
      if (currentUser && list.length > knownSiteOrders) {
        UI.toast('Nouvelle commande reçue depuis le site web');
      }
      knownSiteOrders = list.length;
    });
    window.addEventListener('focus', () => {
      refreshSiteOrderIndicators();
      if (currentUser && page === 'site-orders') vSiteOrders();
    });
    login();
  }

  global.App = { init };
})(window);

document.addEventListener('DOMContentLoaded', function () { App.init(); });
