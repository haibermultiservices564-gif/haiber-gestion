/* ============================================================
   HaiBer Gestion — Interfaces d'intégration externes

   Ce module ne prétend PAS que les services sont connectés.
   Il fournit les contrats (PaymentProvider, FiscalInvoiceProvider,
   SyncClient) et un état explicite « non connecté » tant que les
   accès externes (DGI, opérateurs, hébergement) ne sont pas fournis.
   ============================================================ */
(function (global) {
  'use strict';

  function notConnected(name) {
    return new Error(name + ' non connecté : accès externe requis (voir docs/PASSAGE_EN_PRODUCTION.md).');
  }

  const Integrations = {
    /* ---- Paiements ---- */
    payment: {
      providers: [
        { id: 'manuel', name: 'Saisie manuelle', connected: true, level: 1 },
        { id: 'aggregateur', name: 'Agrégateur (Ligdicash, PayDunya, CinetPay, YengaPay)', connected: false, level: 2 },
        { id: 'direct', name: 'API directe Orange Money / Moov Money / Coris Money', connected: false, level: 3 }
      ],
      active() { return this.providers; },
      config() {
        const r = Store.rules();
        return {
          methods: r.paymentMethods || [],
          statuses: r.paymentStatuses || [],
          limits: r.paymentLimits || {},
          feeRate: r.feeRate || 0,
          feePayer: r.feePayer || 'entreprise'
        };
      },
      // La saisie manuelle est la seule voie réellement active.
      record(payment) {
        if (!payment || !payment.method) throw notConnected('Paiement');
        return payment; // enregistré par Store.add('payments', …) dans l'UI
      },
      createLink(/* quoteId */) { throw notConnected('Lien de paiement agrégateur'); },
      verifyWebhook(/* provider, payload, signature */) { throw notConnected('Webhook de paiement'); },
      reconcile(/* date */) { throw notConnected('Réconciliation bancaire / opérateur'); }
    },

    /* ---- Facturation fiscale ---- */
    fiscal: {
      modes: ['Facture simple', 'Facture normalisée', 'FEC (simulation)'],
      status() {
        return {
          attestationDgi: false,
          mcf: false,
          distributeurCciBf: false,
          mode: 'simulation',
          message: 'Aucune attestation DGI n’est détenue : aucune facture n’est certifiée.'
        };
      },
      // Place une facture en file d'attente au lieu de la certifier mensongèrement.
      certify(invoice) {
        if (!invoice) throw notConnected('Certification fiscale');
        const q = Store.db.fiscalQueue || (Store.db.fiscalQueue = []);
        if (!q.some(x => x.invoiceId === invoice.id)) {
          q.push({
            id: 'FQ-' + Date.now(),
            orgId: Store.db.activeOrg,
            invoiceId: invoice.id,
            mode: invoice.mode || 'Facture simple',
            status: 'en attente de certification',
            reason: 'Attestation DGI / MCF requis',
            at: new Date().toISOString()
          });
          Store.log('fiscal-queue', invoice.id);
          Store.save();
        }
        return { certified: false, queued: true, reason: 'Attestation DGI requise — facture mise en file d’attente.' };
      },
      queue() { return (Store.db.fiscalQueue || []).filter(x => x.orgId === Store.db.activeOrg); },
      // À implémenter uniquement après obtention de l'attestation.
      certifyOnline(/* invoice, mcf */) { throw notConnected('MCF / SECeF'); }
    },

    /* ---- Synchronisation serveur ---- */
    sync: {
      status() {
        const api = (Store.rules().domains || {}).api || '';
        return { configured: !!api, endpoint: api, connected: false, message: 'Serveur non déployé : export/import JSON disponible.' };
      },
      async push(/* payload */) { throw notConnected('API de synchronisation'); },
      async pull(/* since */) { throw notConnected('API de synchronisation'); }
    },

    /* ---- État global pour l'écran Réglages ---- */
    overview() {
      return {
        paiementManuel: this.payment.providers[0].connected,
        paiementAgregateur: this.payment.providers[1].connected,
        paiementDirect: this.payment.providers[2].connected,
        fec: this.fiscal.status().attestationDgi,
        serveur: this.sync.status().connected,
        fileFiscale: this.fiscal.queue().length
      };
    }
  };

  global.Integrations = Integrations;
})(window);
