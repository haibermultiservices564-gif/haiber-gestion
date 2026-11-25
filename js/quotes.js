/* ============================================================
   HaiBer Gestion — Moteur de devis partagé
   Cinq ateliers : conception graphique, packaging, imprimerie /
   sérigraphie, multi-média et résine. Un seul moteur, des règles
   toutes modifiables dans Réglages (aucune valeur métier en dur).
   Formule : (matière + main-d'œuvre + machine + finitions + outillage
             + gâche) × marge → remise → TVA.
   ============================================================ */
(function (global) {
  'use strict';

  const round = (n) => Math.round(n);
  const euro = (n) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

  function finish(base, lines, opts) {
    const s = Store.orgSettings();
    const marge = opts.marge != null ? opts.marge : s.margeDefaut;
    const margeAmnt = base * marge / 100;
    let ht = base + margeAmnt;
    lines.push(['Marge (' + marge + ' %)', round(margeAmnt)]);
    const express = opts.express ? ht * s.express / 100 : 0;
    if (express) { ht += express; lines.push(['Supplément express (' + s.express + ' %)', round(express)]); }
    const remise = ht * (opts.remise || 0) / 100;
    if (remise) { ht -= remise; lines.push(['Remise (' + opts.remise + ' %)', -round(remise)]); }
    const tva = ht * s.tva / 100;
    const ttc = round(ht + tva);
    lines.push(['Total HT', round(ht)]);
    lines.push(['TVA (' + s.tva + ' %)', round(tva)]);
    lines.push(['Total TTC', ttc]);
    let deposit = 0;
    if (opts.deposit > 0) {
      deposit = Math.round(ttc * opts.deposit / 100);
      // Les lignes d'acompte sont affichées par l'UI et les PDF ; on ne les
      // duplique pas ici.
    }
    return { lines, ht: round(ht), tva: round(tva), ttc, deposit, solde: ttc - deposit, warnings: opts.warnings || [], base: round(base) };
  }

  function cureDate(hours) {
    const d = new Date(Date.now() + (hours || 24) * 3600000);
    return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  const Engine = {

    /* ---------------- CONCEPTION GRAPHIQUE ---------------- */
    conception(f) {
      const r = Store.rules(), s = Store.orgSettings();
      const lines = [], warnings = [];
      const type = f.designType || 'Logo';
      const hours = Math.max(0.5, f.hours || 4);
      const rate = r.designHour || 6000;
      const forfait = (r.prices.conception || {})[type] || 0;
      const temps = hours * rate;
      const design = Math.max(temps, forfait);
      lines.push(['Conception — ' + type + ' (' + hours + ' h)', round(temps)]);
      if (forfait > temps) lines.push(['Minimum forfait ' + type, round(forfait - temps)]);
      const included = 2;
      const extra = Math.max(0, (f.revisions || 0) - included) * rate * 0.5;
      if (extra) lines.push(['Révisions supplémentaires', round(extra)]);
      const bat = f.bat ? (r.batFee || 5000) : 0;
      if (bat) lines.push(['BAT / validation client', bat]);
      const so = r.studioOptions || {};
      const preflight = (f.preflightDpi || f.preflightColors) ? (so.preflight || 0) : 0;
      if (preflight) lines.push(['Préflight (' + (f.preflightDpi || 300) + ' dpi, ' + (f.preflightColors || 'CMYK') + (f.preflightBleed ? ', fond perdu' : '') + ')', preflight]);
      const versions = Math.max(1, f.versions || 1);
      const versionCost = (versions - 1) * (so.version || 0);
      if (versionCost) lines.push([(versions - 1) + ' version(s) archivée(s) supplémentaire(s)', round(versionCost)]);
      const batLink = /whatsapp|lien/i.test(f.batChannel || '') ? (so.batLink || 0) : 0;
      if (batLink) lines.push(['Envoi BAT ' + f.batChannel, batLink]);
      const base = design + extra + bat + preflight + versionCost + batLink;
      if (!f.bat) warnings.push('Prévoir le BAT : ne pas lancer la production sans validation écrite.');
      if (f.bat) warnings.push('BAT à envoyer par ' + (f.batChannel || 'lien + WhatsApp') + ' et à faire valider daté avant production.');
      if ((f.preflightDpi || 300) < 300) warnings.push('Résolution < 300 dpi : préflight à refuser ou à signaler au client.');
      if (f.preflightBleed === false) warnings.push('Fond perdu absent : ajouter 3 mm avant BAT.');
      if (temps > forfait * 1.5) warnings.push('Temps supérieur au forfait : facturer au temps passé ou réviser le forfait.');
      if ((f.revisions || 0) > included) warnings.push((f.revisions - included) + ' révision(s) au-delà du forfait de 2 incluses.');
      return finish(base, lines, { marge: f.marge, remise: f.remise, express: f.express, deposit: f.depositPct, warnings });
    },

    /* ---------------- PACKAGING ---------------- */
    packaging(f) {
      const r = Store.rules(), s = Store.orgSettings();
      const lines = [], warnings = [];
      const model = f.boxModel || 'Carton 350 g';
      const q = Math.max(1, f.q || 1);
      const l = Math.max(1, f.l || 24) / 100, w = Math.max(1, f.wBox || 18) / 100, h = Math.max(1, f.hBox || 8) / 100;
      const surface = 2 * (l * w + l * h + w * h);
      const priceM2 = (r.prices.packaging || {})[model] || 900;
      const mat = surface * q * priceM2;
      const outillage = f.newDie ? (r.packagingDie || 15000) : 0;
      const decoupe = q * 80;
      const pliage = q * 50;
      const bat = f.bat ? (r.batFee || 5000) : 0;
      const gache = (mat + decoupe) * s.gache / 100;
      const po = r.packagingOptions || {};
      const options = (f.sachet ? q * (po.sachetM2 || 0) : 0)
        + (f.etiquette ? q * (po.etiquette || 0) : 0)
        + (f.depliant ? q * (po.depliant || 0) : 0)
        + (f.lamination ? surface * q * (po.laminationM2 || 0) : 0)
        + (f.dorure ? surface * q * (po.dorureM2 || 0) : 0);
      const base = mat + outillage + decoupe + pliage + bat + gache + options;
      lines.push(['Carton — ' + model + ' (' + surface.toFixed(3) + ' m²/boîte × ' + q + ')', round(mat)]);
      if (f.sachet) lines.push(['Sachet personnalisé', round(q * (po.sachetM2 || 0))]);
      if (f.etiquette) lines.push(['Étiquette', round(q * (po.etiquette || 0))]);
      if (f.depliant) lines.push(['Dépliant', round(q * (po.depliant || 0))]);
      if (f.lamination) lines.push(['Pelliculage', round(surface * q * (po.laminationM2 || 0))]);
      if (f.dorure) lines.push(['Dorure', round(surface * q * (po.dorureM2 || 0))]);
      if (outillage) lines.push(['Outillage découpe / nouveau patron', outillage]);
      lines.push(['Découpe', round(decoupe)]);
      lines.push(['Pliage + collage', round(pliage)]);
      if (bat) lines.push(['BAT / bon à tirer', bat]);
      lines.push(['Gâche (' + s.gache + ' %)', round(gache)]);
      if (!f.dieTemplate) warnings.push('Bibliothèque de boîtes : sélectionner un patron de découpe avant fabrication.');
      if (f.sheetOptim) warnings.push('Découpe optimisée sur feuille 70×100 : vérifier l’orientation des motifs.');
      if (f.bat) warnings.push('BAT en attente : ne pas lancer la découpe avant validation client.');
      if ((f.hBox || 8) > 30) warnings.push('Hauteur > 30 cm : vérifier la résistance du carton et le fond.');
      return finish(base, lines, { marge: f.marge, remise: f.remise, express: f.express, deposit: f.depositPct, warnings });
    },

    /* ---------------- IMPRIMERIE / SÉRIGRAPHIE ---------------- */
    imprimerie(f) {
      const type = f.printType || 'numerique';
      const res = type === 'grandformat' ? this.grandformat(f)
        : type === 'serigraphie' ? this.serigraphie(f)
        : this.numerique(f);
      if (f.bat) {
        res.lines.push(['BAT / validation client', Store.rules().batFee || 5000]);
        res.base += Store.rules().batFee || 5000;
        res.ht = Math.round(res.ht + (Store.rules().batFee || 5000) * (1 + (Store.orgSettings().margeDefaut / 100)));
        res.ttc = Math.round(res.ht * (1 + Store.orgSettings().tva / 100));
        res.warnings.push('BAT en attente : bloquer la production tant que le client n’a pas validé.');
      }
      return res;
    },

    numerique(f) {
      const r = Store.rules(), s = Store.orgSettings();
      const lines = [], warnings = [];
      const quantity = f.qNum || f.q || 1;
      const sheets = Math.ceil(quantity * (f.pages || 1) / (f.rectoVerso ? 2 : 1));
      const format = f.format || 'A4';
      const pricePerSheet = r.prices.numerique[format] || 150;
      const mat = sheets * pricePerSheet;
      const enc = sheets * 45;
      const hours = sheets / 2500;
      const machine = hours * r.machineHour;
      const labour = (sheets * 0.6 / 60) * r.laborHour;
      let fin = 0;
      if (f.lamination) fin += sheets * 80;
      if (f.binding) fin += (f.q || 1) * 200;
      if (f.cutting) fin += sheets * 20;
      if (f.pantone) fin += 5000;
      const gache = (mat + enc) * (s.gache + (f.rectoVerso ? 2 : 0)) / 100;
      const base = mat + enc + machine + labour + fin + gache;
      lines.push(['Papier — ' + format + ' (' + sheets + ' feuilles)', round(mat)]);
      lines.push(['Encre', round(enc)]);
      lines.push(['Machine (' + hours.toFixed(2) + ' h)', round(machine)]);
      lines.push(['Main-d’œuvre', round(labour)]);
      lines.push(['Façonnage', round(fin)]);
      lines.push(['Gâche', round(gache)]);
      if (f.bleed === false) warnings.push('Fond perdu absent : ajouter 3 mm avant production.');
      if (f.grammage > 250 && f.binding) warnings.push('Grammage incompatible avec le dosage demandé.');
      if (f.bleed === false) warnings.push('BAT à refaire après ajout du fond perdu.');
      if (quantity > 5000) warnings.push('Quantité élevée : comparer avec le coût sérigraphie.');
      return finish(base, lines, { marge: f.marge, remise: f.remise, express: f.express, deposit: f.depositPct, warnings });
    },

    grandformat(f) {
      const r = Store.rules(), s = Store.orgSettings();
      const lines = [], warnings = [];
      const m2 = (f.w || 0) * (f.h || 0) * (f.q || 1);
      const perim = 2 * ((f.w || 0) + (f.h || 0)) * (f.q || 1);
      const supportPrice = r.prices.grandformat[f.support] || 2500;
      const mat = m2 * supportPrice;
      const enc = m2 * r.inkM2;
      const hours = m2 / r.speedM2H;
      const machine = hours * r.machineHour;
      const labour = (m2 * r.minPerM2 / 60) * r.laborHour;
      let fin = 0;
      if (f.eyelets) fin += Math.ceil(perim / 0.5) * r.eyelet;
      if (f.hem) fin += perim * r.hem;
      if (f.lamination) fin += m2 * 400;
      const gache = (mat + enc) * s.gache / 100;
      const base = mat + enc + machine + labour + fin + gache;
      lines.push(['Matière — ' + f.support + ' (' + m2.toFixed(2) + ' m²)', round(mat)]);
      lines.push(['Encre', round(enc)]);
      lines.push(['Machine (' + hours.toFixed(2) + ' h)', round(machine)]);
      lines.push(['Main-d’œuvre', round(labour)]);
      lines.push(['Finitions', round(fin)]);
      lines.push(['Gâche (' + s.gache + ' %)', round(gache)]);
      if (f.w > 3.2) warnings.push('Largeur au-delà de la machine (3,2 m) : découpe en lés avec recouvrement.');
      if (m2 > 40) warnings.push('Surface élevée : devis à valider par le prépresse.');
      if (f.express) warnings.push('Délai express : confirmer la charge machine avant acceptation.');
      return finish(base, lines, { marge: f.marge, remise: f.remise, express: f.express, deposit: f.depositPct, warnings });
    },

    serigraphie(f) {
      const r = Store.rules(), s = Store.orgSettings();
      const lines = [], warnings = [];
      const colors = Math.max(1, f.colors || 1);
      const q = Math.max(1, f.q || 1);
      const screens = colors * (f.positions || 1);
      const setup = screens * r.screenCost + colors * r.filmCost + 2000;
      const mat = q * (r.prices.serigraphie[f.supportSer || f.support] || 1200);
      const enc = q * colors * 120;
      const hours = q * colors / 400;
      const machine = hours * r.machineHour;
      const labour = (q * colors * 0.4 / 60) * r.laborHour;
      const sechage = colors * 10 * r.laborHour / 60;
      const gache = (mat + enc) * s.gache / 100;
      const base = setup + mat + enc + machine + labour + sechage + gache;
      lines.push(['Cadres + films (' + screens + ' écrans)', round(setup)]);
      lines.push(['Support × ' + q, round(mat)]);
      lines.push(['Encre plastisol (' + colors + ' couleurs)', round(enc)]);
      lines.push(['Machine (' + hours.toFixed(2) + ' h)', round(machine)]);
      lines.push(['Main-d’œuvre', round(labour)]);
      lines.push(['Séchage entre couleurs (' + colors * 10 + ' min)', round(sechage)]);
      lines.push(['Gâche (' + s.gache + ' %)', round(gache)]);
      const breakEven = Math.ceil(setup / 300);
      if (q < breakEven) warnings.push('Quantité sous le seuil de rentabilité (≈ ' + breakEven + ' pièces).');
      if (f.detail < 0.3) warnings.push('Détails trop fins pour la trame (min. 0,3 mm).');
      warnings.push('Prévoir le séchage 10 min entre chaque couleur avant surimpression.');
      return finish(base, lines, { marge: f.marge, remise: f.remise, express: f.express, deposit: f.depositPct, warnings });
    },

    /* ---------------- MULTI-MÉDIA ---------------- */
    multimedia(f) {
      const r = Store.rules(), s = Store.orgSettings();
      const lines = [], warnings = [];
      const type = f.mediaType || 'Montage vidéo';
      const hours = Math.max(0.5, f.mediaHours || 3);
      const rate = r.multimediaHour || 12000;
      const forfait = (r.prices.multimedia || {})[type] || 0;
      const montage = Math.max(hours * rate, forfait);
      lines.push([type + ' (' + hours + ' h)', round(hours * rate)]);
      if (forfait > hours * rate) lines.push(['Minimum forfait', round(forfait - hours * rate)]);
      const rendu = hours * 0.3 * r.machineHour;
      lines.push(['Rendu / export', round(rendu)]);
      let options = 0;
      if (f.voiceOver) { options += 15000; lines.push(['Voix off', 15000]); }
      if (f.subtitles) { options += 8000; lines.push(['Sous-titres', 8000]); }
      const sub = (r.mediaSubscriptions || {})[f.mediaSubscription || 'Aucun'] || 0;
      if (sub) { options += sub; lines.push([f.mediaSubscription, sub]); }
      // --- Motion design : durée, style, versions et formats (tout est éditable) ---
      if (/motion|anim/i.test(type)) {
        const mo = r.motionOptions || {};
        const sec = Math.max(1, f.motionDuration || 15);
        const style = f.motionStyle || 'Logo animé';
        const versions = Math.max(1, f.motionVersions || 1);
        const format = f.motionFormat || 'MP4';
        const anim = sec * (mo.second || 2500);
        const styleCost = style === 'Motion 3D' ? (mo.style3d || 25000)
          : style === 'Typographie animée' ? (mo.styleTypo || 8000)
          : style === 'Motion 2D' ? (mo.style2d || 12000) : 0;
        const extraVersions = (versions - 1) * (mo.version || 5000);
        const formatCost = (mo.formats || {})[format] || 0;
        lines.push([style + ' — ' + sec + ' s', round(anim)]);
        if (styleCost) lines.push(['Style ' + style, styleCost]);
        if (extraVersions) lines.push([(versions - 1) + ' version(s) supplémentaire(s)', round(extraVersions)]);
        if (formatCost) lines.push(['Export ' + format, formatCost]);
        options += anim + styleCost + extraVersions + formatCost;
        if (sec > 30) warnings.push('Durée > 30 s : prévoir un storyboard et une validation intermédiaire.');
        if (style === 'Motion 3D') warnings.push('Motion 3D : confirmer la machine de rendu et le délai avant acceptation.');
        warnings.push('Motion design : faire valider le storyboard avant le rendu final.');
      }
      const bat = f.bat ? (r.batFee || 5000) : 0;
      if (bat) lines.push(['Validation du montage', bat]);
      const base = montage + rendu + options + bat;
      if (!f.bat) warnings.push('Faire valider le montage (BAT vidéo) avant livraison.');
      if ((f.durationMin || 0) > 5) warnings.push('Durée > 5 min : prévoir un montage supplémentaire.');
      if (f.voiceOver) warnings.push('Voix off : prévoir le texte et la voix avant montage.');
      return finish(base, lines, { marge: f.marge, remise: f.remise, express: f.express, deposit: f.depositPct, warnings });
    },

    /* ---------------- ATELIER RÉSINE ---------------- */
    resine(f) {
      const r = Store.rules(), s = Store.orgSettings();
      const lines = [], warnings = [];
      const type = f.resinType || 'Époxy';
      const q = Math.max(1, f.q || 1);
      const l = Math.max(1, f.lRes || 120) / 100;
      const w = Math.max(1, f.wRes || 60) / 100;
      const ep = Math.max(0.2, f.thickness || 1) / 100;
      const volumeM3 = l * w * ep * q;              // m³
      const kg = volumeM3 * (r.resineDensity || 1.15) * 1000;
      const wastePct = r.resineWaste || 8;
      const waste = kg * wastePct / 100;
      const catalyst = kg * (r.catalystPct || 2) / 100;
      const priceKg = (r.prices.resine || {})[type] || 4200;
      const mat = (kg + waste) * priceKg + catalyst * priceKg * 0.6;
      const moule = f.mold ? (r.packagingDie || 15000) * 0.6 : 0;
      const cureH = r.resineCureH || 24;
      const hours = q * 0.25 + cureH * 0.02;
      const labour = hours * r.laborHour;
      const finition = q * 500;
      const base = mat + moule + labour + finition;
      lines.push([type + ' — ' + (l * 100) + '×' + (w * 100) + '×' + (ep * 1000) + ' cm × ' + q, round(kg * priceKg)]);
      lines.push(['Gaspillage résine (' + wastePct + ' %)', round(waste * priceKg)]);
      lines.push(['Catalyseur (' + (r.catalystPct || 2) + ' %)', round(catalyst * priceKg * 0.6)]);
      if (moule) lines.push(['Moule / silicone', round(moule)]);
      lines.push(['Main-d’œuvre + surveillance cure (' + hours.toFixed(2) + ' h)', round(labour)]);
      lines.push(['Ponçage / finition', round(finition)]);
      warnings.push('Cure ' + cureH + ' h : démoulage possible le ' + cureDate(cureH) + ' au plus tôt.');
      warnings.push('Gaspillage estimé à ' + round(waste) + ' kg inclus dans le devis.');
      if ((f.thickness || 1) > 5) warnings.push('Épaisseur > 5 cm : risque d’exothermie, couler en deux couches.');
      if (f.motif) {
        const m = Store.motifs().find(x => x.id === f.motif);
        if (m) warnings.push('Fiche motif « ' + m.name + ' » : ' + (m.note || m.description || ''));
      }
      return finish(base, lines, { marge: f.marge, remise: f.remise, express: f.express, deposit: f.depositPct, warnings });
    },

    /* ---------------- DISPATCH ---------------- */
    compute(module, f) {
      const map = {
        conception: 'conception', packaging: 'packaging', imprimerie: 'imprimerie',
        multimedia: 'multimedia', resine: 'resine',
        // compatibilité avec les devis enregistrés avant l'adaptation
        numerique: 'numerique', grandformat: 'grandformat', serigraphie: 'serigraphie'
      };
      return this[map[module] || 'imprimerie'](f);
    },

    modules() {
      return [
        { id: 'conception', label: 'Conception graphique', icon: '✎' },
        { id: 'packaging', label: 'Packaging', icon: '▣' },
        { id: 'imprimerie', label: 'Imprimerie / Sérigraphie', icon: '▤' },
        { id: 'multimedia', label: 'Multi-média', icon: '▶' },
        { id: 'resine', label: 'Atelier résine', icon: '◈' }
      ];
    },

    printTypes() {
      return [
        { id: 'numerique', label: 'Impression numérique' },
        { id: 'grandformat', label: 'Grand format' },
        { id: 'serigraphie', label: 'Sérigraphie / textile' }
      ];
    },

    money: euro, cureDate
  };

  global.Engine = Engine;
})(window);
