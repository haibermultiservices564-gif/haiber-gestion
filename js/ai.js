/* ============================================================
   HaiBer Gestion — Assistant intelligent local
   Interroge l'historique des productions, commandes, devis,
   factures, paiements, stocks et conceptions.
   Toutes les réponses sont sourcées et cloisonnées par organisation.
   ============================================================ */
(function (global) {
  'use strict';

  const norm = (s) => (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 \-]/g, ' ').replace(/\s+/g, ' ').trim();

  const MONTHS = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];

  function money(n) { return Math.round(n || 0).toLocaleString('fr-FR') + ' FCFA'; }

  const Assistant = {
    suggestions: [
      'Quels clients n’ont pas payé ?',
      'Combien de résine pour un plateau 120x60 cm ?',
      'Quand démouler le plateau en résine ?',
      'Quels stocks sont critiques ?',
      'Quelles fiches motifs sont enregistrées ?',
      'Quels BAT sont en attente ?',
      'Quelle est la marge du mois ?',
      'Quels durcisseurs arrivent à péremption ?',
      'Combien ai-je facturé cette année ?',
      'Résumé de l’activité'
    ],

    ask(raw) {
      const q = norm(raw);
      const clients = Store.clients(), orders = Store.orders(), quotes = Store.quotes();
      const invoices = Store.invoices(), pays = Store.payments(), stocks = Store.stocks();
      const designs = Store.designs(), cash = Store.cash(), credits = Store.creditNotes();
      const plans = Store.db.licensePlans || [], subs = Store.subcontractors();
      let answer = '', sources = [];

      // Extract entity: order id like CMD-0142 / CMD-2026-0001
      const idMatch = (raw.toUpperCase().match(/CMD-[0-9A-Z-]+/) || [])[0];
      // Extract client by name mention
      const client = clients.find(c => q.includes(norm(c.name).split(' ')[0]) && norm(c.name).split(' ')[0].length > 3);

      const has = (...words) => words.some(w => q.includes(w));

      // ---- STATUT D'UNE COMMANDE ----
      if (idMatch && has('statut','etat','ou','avancement','status','ou en est')) {
        const o = orders.find(x => x.id.toUpperCase() === idMatch);
        if (o) {
          const steps = Store.steps;
          const cl = Store.client(o.clientId);
          answer = `La commande ${o.id} (${cl ? cl.name : 'client occasionnel'}) est à l’étape **${steps[o.step] || o.step}**. Description : ${o.desc}. ${o.hist.length ? 'Dernier événement : ' + o.hist[0].step + ' le ' + o.hist[0].at + '.' : 'Aucune étape validée pour le moment.'}`;
          sources = [{ type: 'Commande', ref: o.id }];
        }
      }
      // ---- LIVRAISONS ----
      else if (has('livraison','livree','livrees','livrer','signature','recu','reception')) {
        const livrees = orders.filter(o => o.delivered);
        answer = livrees.length
          ? `${livrees.length} commande(s) livrée(s) avec signature :\n\n` + livrees.map(o => `• **${o.id}** — ${Store.client(o.clientId)?.name || '—'} — livrée le ${this.fmtDate(o.deliveredAt)}${o.receivedBy ? ' à ' + o.receivedBy : ''}`).join('\n')
          : 'Aucune commande livrée pour le moment. Ouvrez une commande prête dans Production pour enregistrer la livraison et la signature client.';
        sources = livrees.map(o => ({ type: 'Livraison', ref: o.id }));
      }
      // ---- HISTORIQUE DE PRODUCTION ----
      else if (has('historique','historik','parcours','toutes les commandes','production precedente','productions precedentes','deja fait','deja produit')) {
        const done = orders.filter(o => o.step === 5);
        const encours = orders.filter(o => o.step < 5);
        answer = `**Historique de production** — ${orders.length} commande(s) au total.\n\n`;
        answer += `• ${done.length} commande(s) terminée(s), dont ${orders.filter(o => o.delivered).length} livrée(s) avec signature.\n• ${encours.length} commande(s) en cours.\n\n`;
        answer += encours.slice(0,5).map(o => `— ${o.id} · ${Store.client(o.clientId)?.name || '—'} · ${o.desc}`).join('\n');
        sources = orders.slice(0,6).map(o => ({ type: 'Commande', ref: o.id }));
      }
      // ---- COMMANDES EN COURS ----
      else if (has('commande','commandes','encours','en cours','production')) {
        const encours = orders.filter(o => o.step < 5);
        answer = encours.length
          ? `${encours.length} commande(s) en cours :\n\n` + encours.map(o => `• **${o.id}** — ${Store.client(o.clientId)?.name || '—'} : ${o.desc} (étape ${o.step}/5)`).join('\n')
          : 'Aucune commande en cours pour le moment.';
        sources = encours.map(o => ({ type: 'Commande', ref: o.id }));
      }
      // ---- STOCKS CRITIQUES ----
      else if (has('stock','stocks','rupture','critique','matiere','matieres')) {
        const low = stocks.filter(s => s.qty <= s.min);
        answer = low.length
          ? `${low.length} stock(s) critique(s) :\n\n` + low.map(s => `• **${s.name}** — ${s.qty} ${s.unit} restants (seuil ${s.min}). Fournisseur : ${s.supplier || '—'}`).join('\n')
          : 'Tous les stocks sont au-dessus de leur seuil d’alerte.';
        sources = low.map(s => ({ type: 'Stock', ref: s.name }));
      }
      // ---- FACTURATION / CA ----
      else if (has('facture','factures','facture','chiffre','ca','revenu','encaisse','gagne','vendu') && !has('caisse','ticket','cloture','clôture')) {
        const total = invoices.reduce((a,i) => a + i.ttc, 0);
        const payes = pays.filter(p => p.status === 'confirmé').reduce((a,p) => a + p.amount, 0);
        answer = `**Facturation** — ${invoices.length} facture(s) émise(s).\n\n`;
        answer += `• Total facturé TTC : **${money(total)}**\n• Paiements confirmés : **${money(payes)}**\n• Solde estimé : ${money(total - payes)}\n`;
        if (invoices.length) answer += `\nDernière facture : ${invoices[0].id} — ${money(invoices[0].ttc)} (${this.fmtDate(invoices[0].date)}).`;
        sources = invoices.slice(0,3).map(i => ({ type: 'Facture', ref: i.id }));
      }
      // ---- CAISSE COMPTOIR ----
      else if (has('caisse','ticket','vente rapide','cloture','clôture','photocopie','carte de visite')) {
        const sales = cash.filter(x => x.kind !== 'closure');
        const day = sales.filter(s => s.date === Store.today());
        const total = a => a.reduce((s, x) => s + (x.amount || 0), 0);
        answer = `**Caisse comptoir** — ${day.length} vente(s) aujourd’hui pour **${money(total(day))}**.\n\n`;
        answer += `• Total des tickets enregistrés : ${money(total(sales))}\n`;
        answer += `• Clôtures : ${cash.filter(x => x.kind === 'closure').length}\n`;
        if (sales.length) answer += `• Dernière vente : ${sales[sales.length-1].id} — ${sales[sales.length-1].item} × ${sales[sales.length-1].qty} (${money(sales[sales.length-1].amount)}).`;
        sources = day.slice(0,5).map(s => ({ type: 'Ticket', ref: s.id }));
      }
      // ---- CRÉANCES / IMPAYÉS ----
      else if (has('creance','créance','impaye','impayé','avoir','avoirs','relance','dette','solde du','pas paye','non paye','n ont pas paye')) {
        const unpaid = invoices.map(i => {
          const paid = pays.filter(p => p.invoiceId === i.id && p.status === 'confirmé').reduce((a,p) => a + p.amount, 0);
          const cr = credits.filter(c => c.invoiceId === i.id).reduce((a,c) => a + c.amount, 0);
          return { i, due: Math.max(0, i.ttc - paid - cr) };
        }).filter(x => x.due > 0);
        answer = `**Créances** — ${unpaid.length} facture(s) impayée(s), pour un total de **${money(unpaid.reduce((a,x) => a + x.due, 0))}**.\n\n`;
        answer += unpaid.slice(0,6).map(x => `• **${x.i.id}** — ${Store.client(x.i.clientId)?.name || 'Occasionnel'} : ${money(x.due)} restants. Relance possible par WhatsApp.`).join('\n') || 'Aucun impayé.';
        answer += `\n\n${credits.length} avoir(s) émis, sans modification des factures initiales.`;
        sources = unpaid.slice(0,5).map(x => ({ type: 'Facture', ref: x.i.id }));
      }
      // ---- LICENCE ----
      else if (has('licence','license','abonnement','activation','offre')) {
        const lic = Store.orgSettings().license || {};
        answer = `**Licence** — offre ${lic.plan || '—'} (${lic.seats || '—'}), échéance ${this.fmtDate(lic.expires)}. ${Store.readOnly() ? 'Actuellement en lecture seule.' : 'Active.'}\n\n`;
        answer += plans.map(p => `• **${p.name}** — ${p.seats} : ${money(p.monthly)}/mois, ${p.yearly ? money(p.yearly) + '/an (2 mois offerts)' : 'annuel sur devis'}, installation ${p.setup ? money(p.setup) : 'sur devis'}.`).join('\n');
        answer += '\n\nActivation hors ligne par clé signée, avec 30 jours de tolérance avant lecture seule.';
        sources = plans.map(p => ({ type: 'Offre', ref: p.name }));
      }
      // ---- SOUS-TRAITANCE ----
      else if (has('sous-trait','soustrait','partenaire','prestataire','atelier')) {
        answer = subs.length
          ? `${subs.length} sous-traitant(s) :\n\n` + subs.map(x => `• **${x.name}** — ${x.specialty || '—'} · ${x.phone || '—'}${x.note ? ' · ' + x.note : ''}`).join('\n')
          : 'Aucun sous-traitant enregistré.';
        sources = subs.map(x => ({ type: 'Sous-traitant', ref: x.name }));
      }
      // ---- DEVISES ----
      else if (has('devise','change','euro','dollar','import','taux')) {
        const rates = Store.db.currencyRates || {};
        answer = '**Taux de change vers FCFA** (modifiables dans Réglages) :\n\n' +
          Object.entries(rates).map(([k,v]) => `• 1 ${k} = ${money(v)}`).join('\n');
        sources = [{ type: 'Réglages', ref: 'Devises' }];
      }
      // ---- SAISONNALITÉ ----
      else if (has('saison','fespaco','siao','tabaski','rentree','electoral')) {
        const seasons = Store.db.seasons || [];
        answer = `${seasons.length} période(s) forte(s) configurée(s) :\n\n` + seasons.map(s => '• ' + s).join('\n');
        sources = [{ type: 'Réglages', ref: 'Saisonnalité' }];
      }
      // ---- DEVIS PAR CLIENT ----
      else if (has('devis','tarif','prix','estimation','coute','coutere')) {
        const list = client ? quotes.filter(x => x.clientId === client.id) : quotes;
        answer = list.length
          ? `${list.length} devis ${client ? 'pour ' + client.name : 'enregistré(s)'} :\n\n` + list.slice(0,6).map(x => `• **${x.id}** — ${x.module} — ${money(x.ttc)} (${this.fmtDate(x.date)})`).join('\n')
          : (client ? 'Aucun devis enregistré pour ' + client.name + '.' : 'Aucun devis enregistré pour le moment. Utilisez le module Devis pour en créer un.');
        sources = list.slice(0,5).map(x => ({ type: 'Devis', ref: x.id }));
      }
      // ---- CLIENT ----
      else if (client && has('client','fiche','coordonnees','telephone','contact')) {
        const cs = orders.filter(o => o.clientId === client.id);
        const qs = quotes.filter(x => x.clientId === client.id);
        answer = `**${client.name}** — ${client.phone || 'pas de téléphone'} · ${client.email || 'pas d’e-mail'} · ${client.city || '—'}.\n\n`;
        answer += `• ${cs.length} commande(s) · ${qs.length} devis.\n`;
        if (cs.length) answer += `• Dernière commande : ${cs[0].id} — ${cs[0].desc}.`;
        sources = [{ type: 'Client', ref: client.name }];
      }
      // ---- CONCEPTIONS ----
      else if (has('conception','conceptions','design','designs','maquette','maquettes','fichier','fichiers','logo','visuel')) {
        answer = designs.length
          ? `${designs.length} conception(s) enregistrée(s) :\n\n` + designs.map(d => `• **${d.name}** — ${d.type}${d.clientId ? ' · ' + (Store.client(d.clientId)?.name || '') : ''}${d.tags?.length ? ' · ' + d.tags.join(', ') : ''}`).join('\n')
          : 'Aucune conception enregistrée. Ajoutez vos maquettes dans la section Conceptions.';
        sources = designs.map(d => ({ type: 'Conception', ref: d.name }));
      }
      // ---- RÉSUMÉ GÉNÉRAL ----
      else if (has('resume','bilan','activite','synthese','comment','ca va','tout','global','jour','rapport')) {
        const ca = invoices.reduce((a,i) => a + i.ttc, 0);
        const low = stocks.filter(s => s.qty <= s.min).length;
        const encours = orders.filter(o => o.step < 5).length;
        answer = `**Résumé de l’activité**\n\n`;
        answer += `• ${orders.length} commande(s) au total, **${encours} en cours**.\n`;
        answer += `• ${quotes.length} devis · ${invoices.length} factures.\n`;
        answer += `• Chiffre d’affaires facturé : **${money(ca)}**.\n`;
        answer += `• Caisse comptoir : ${cash.filter(x => x.kind !== 'closure').length} ticket(s).\n`;
        answer += `• ${credits.length} avoir(s) émis.\n`;
        answer += `• ${designs.length} conception(s) archivée(s).\n`;
        answer += `• **${low} stock(s) critique(s)** à surveiller.`;
        sources = [{ type: 'Synthèse', ref: 'Toutes les données' }];
      }
      // ---- QUANTITÉ DE RÉSINE (calcul à partir des règles) ----
      else if (has('résine','resine','plateau','moule','catalyseur','demoulage','démoulage') && has('combien','quantite','quantité','kg','litre','cure','demouler','démouler','calcul')) {
        const r = Store.rules();
        const dims = String(raw).match(/(\d+)\s*[x×]\s*(\d+)/i);
        const l = dims ? Number(dims[1]) : 120, w = dims ? Number(dims[2]) : 60;
        const ep = Number((String(raw).match(/(\d+(?:\.\d+)?)\s*cm\s*d'?[ée]pais/i) || [])[1]) || 1;
        const q = Number((String(raw).match(/\b(\d+)\s*(?:plateaux?|pi[eè]ces?|exemplaires?)\b/i) || [])[1]) || 1;
        const kg = (l / 100) * (w / 100) * (ep / 100) * q * (r.resineDensity || 1.15) * 1000;
        const waste = kg * (r.resineWaste || 8) / 100;
        const cat = kg * (r.catalystPct || 2) / 100;
        answer = `**Résine pour ${l}×${w} cm × ${q} pièce(s)**\n\n`;
        answer += `• Volume : ${(l * w * ep * q / 1000).toFixed(2)} L (épaisseur ${ep} cm).\n`;
        answer += `• Résine nécessaire : **${kg.toFixed(2)} kg**.\n`;
        answer += `• Gaspillage inclus (${r.resineWaste || 8} %) : ${waste.toFixed(2)} kg → prévoir **${(kg + waste).toFixed(2)} kg**.\n`;
        answer += `• Catalyseur (${r.catalystPct || 2} %) : ${cat.toFixed(3)} kg.\n`;
        answer += `\nCure : ${r.resineCureH || 24} h — démoulage au plus tôt le ${Engine.cureDate(r.resineCureH || 24)}. Valeurs modifiables dans Réglages.`;
        sources = [{ type: 'Réglages', ref: 'Résine : densité, gaspillage, catalyseur, cure' }, { type: 'Fiches motifs', ref: String(Store.motifs().length) + ' fiche(s)' }];
      }
      // ---- CURE / DÉMOULAGE ----
      else if (has('cure','demoulage','démoulage','sechage','séchage','24 h')) {
        const h = Store.rules().resineCureH || 24;
        answer = `**Temps de cure atelier résine** — ${h} h par défaut.\n\n`;
        answer += `• Démoulage possible au plus tôt le **${Engine.cureDate(h)}**.\n`;
        answer += `• Ne pas accélérer la cure au-delà des préconisations du fabricant.\n`;
        answer += `• Le suivi de production utilise l’étape « Séchage / Cure » de chaque commande.`;
        sources = [{ type: 'Réglages', ref: 'Durée de cure' }, { type: 'Commandes', ref: String(orders.filter(o => o.step === 2).length) + ' en cure/séchage' }];
      }
      // ---- FICHES MOTIFS ----
      else if (has('motif','motifs','bibliotheque','bibliothèque','boites','boîtes','patron','patrons')) {
        const ms = Store.motifs();
        answer = ms.length
          ? `${ms.length} fiche(s) motif(s) et patron(s) enregistrée(s) :\n\n` + ms.map(x => `• **${x.name}** — ${x.metier || '—'} · ${x.timeH || 0} h · ${x.material || 'matière non renseignée'}${x.note ? ' · ' + x.note : ''}`).join('\n')
          : 'Aucune fiche motif enregistrée. Ouvrez « Fiches motifs » pour créer vos patrons de boîtes et motifs de résine.';
        sources = ms.map(x => ({ type: 'Fiche motif', ref: x.id }));
      }
      // ---- BAT EN ATTENTE ----
      else if (has('bat','bon a tirer','bon à tirer','validation','en attente de validation')) {
        const enAttente = orders.filter(o => o.step === 0 || (o.desc || '').toLowerCase().includes('bat'));
        answer = enAttente.length
          ? `${enAttente.length} dossier(s) en attente de BAT / validation client :\n\n` + enAttente.map(o => `• **${o.id}** — ${o.desc} (${Store.client(o.clientId)?.name || '—'})`).join('\n') + '\n\nNe lancez pas la production avant validation écrite.'
          : 'Aucun BAT en attente. Pensez à joindre le BAT aux devis conception, packaging et imprimerie.';
        sources = enAttente.map(o => ({ type: 'Commande', ref: o.id }));
      }
      // ---- MARGE / RENTABILITÉ ----
      else if (has('marge','rentabilite','rentabilité','seuil','benefice','bénéfice')) {
        const base = quotes.reduce((a, q) => a + (q.base || 0), 0);
        const ht = quotes.reduce((a, q) => a + (q.ht || 0), 0);
        const pct = ht ? Math.round((ht - base) / ht * 100) : 0;
        answer = `**Rentabilité des devis enregistrés**\n\n`;
        answer += `• Coût de revient cumulé : ${money(base)}\n• Total HT devisé : ${money(ht)}\n• Marge moyenne : **${pct} %**\n`;
        answer += `\nMarge par défaut : ${Store.orgSettings().margeDefaut || 30} %. Ajustez-la dans Réglages ou directement dans chaque devis.`;
        sources = quotes.slice(0, 6).map(q => ({ type: 'Devis', ref: q.id }));
      }
      // ---- PÉREMPTION ----
      else if (has('peremption','péremption','durcisseur','date limite','expire')) {
        const soon = stocks.filter(s => s.expiry && new Date(s.expiry) <= new Date(Date.now() + 30 * 86400000));
        answer = soon.length
          ? `${soon.length} produit(s) à péremption proche :\n\n` + soon.map(s => `• **${s.name}** — ${this.fmtDate(s.expiry)} · ${s.qty} ${s.unit} en stock${s.alert ? ' · ' + s.alert : ''}`).join('\n')
          : 'Aucune péremption signalée dans les 30 prochains jours.';
        sources = soon.map(s => ({ type: 'Stock', ref: s.name }));
      }
      // ---- AIDE ----
      else if (has('aide','help','comment faire','questce','cest quoi','question')) {
        answer = `Je peux vous aider à suivre la production et répondre sur vos données passées. Posez-moi par exemple :\n\n${this.suggestions.map(s => '• ' + s).join('\n')}\n\nToutes les réponses sont basées uniquement sur les données de votre organisation.`;
        sources = [];
      }
      // ---- FALLBACK ----
      else {
        answer = `Je n’ai pas trouvé de réponse précise à « ${raw} ». Je peux vous renseigner sur :\n\n${this.suggestions.slice(0,5).map(s => '• ' + s).join('\n')}`;
        sources = [];
      }

      return { answer, sources, at: new Date().toLocaleString('fr-FR') };
    },

    fmtDate(s) {
      if (!s) return '—';
      const d = new Date(s);
      return isNaN(d) ? s : d.toLocaleDateString('fr-FR');
    }
  };

  global.Assistant = Assistant;
})(window);
