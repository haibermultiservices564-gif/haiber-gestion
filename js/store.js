/* ============================================================
   HaiBer Gestion — Data store (offline-first, localStorage)
   All business values live in settings and can be edited in the UI.
   Multi-organization isolation is enforced in every accessor.
   ============================================================ */
(function (global) {
  'use strict';

  const KEY = 'hb_db_v1';

  const uid = (p) => p + '-' + Math.random().toString(36).slice(2, 9).toUpperCase();
  const today = () => new Date().toISOString().slice(0, 10);
  const LOGO_URL = 'assets/logo.png';

  // Coordonnées officielles extraites du support PDF HaiBer.
  // Le numéro historique reste réservé à la mention « conçu par Touch Unique ».
  const LEGACY_SUPPORT_PHONE = '+226 55 04 15 30';
  const DEFAULT_CONTACT = {
    phone: '+226 06 87 97 10',
    phone2: '+226 60 28 31 31',
    email: 'haibermultiservices@gmail.com',
    city: 'Cissin, non loin de la boulangerie Wend-Konta, Ouagadougou',
    tagline: 'Votre communication, notre mission !',
    delivery: 'Partout au Burkina Faso et dans la sous-région, à vos frais'
  };
  // Valeurs d'organisation héritées de l'ancienne démo : remplacées uniquement
  // si elles n'ont pas été personnalisées.
  const LEGACY_ORG = {
    tagline: 'Imprimerie · Conception graphique · Packaging · Résine · Sérigraphie',
    city: 'Kouritenga, Ouagadougou',
    phone2: '+226 06 87 97 10 / 60 28 31 31'
  };

  // Code d'accès local : on ne conserve jamais le code en clair.
  // Ce verrou est un confort d'usage, pas une authentification serveur.
  function pinHash(pin) {
    const s = 'HB-APP:' + String(pin || '');
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function demoDB() {
    const orgId = 'ORG-DEMO';
    return {
      version: 1,
      setupDone: false,
      activeOrg: orgId,
      orgs: [{
        id: orgId,
        name: 'HaiBer Multi-Services',
        ifu: 'IFU-TEST-001', rccm: 'RCCM-TEST-001',
        tagline: DEFAULT_CONTACT.tagline,
        city: DEFAULT_CONTACT.city,
        phone2: DEFAULT_CONTACT.phone2,
        email: DEFAULT_CONTACT.email,
        country: 'Burkina Faso', currency: 'FCFA',
        settings: {
          tva: 18, margeDefaut: 30, gache: 5, express: 25,
          devise: 'XOF', dateFormat: 'JJ/MM/AAAA', langue: 'fr',
          phone: DEFAULT_CONTACT.phone,
          phone2: DEFAULT_CONTACT.phone2,
          email: DEFAULT_CONTACT.email,
          city: DEFAULT_CONTACT.city,
          tagline: DEFAULT_CONTACT.tagline,
          delivery: DEFAULT_CONTACT.delivery,
          license: { plan: 'Professionnel', seats: 15, expires: '2027-03-01', modules: ['conception','packaging','imprimerie','multimedia','resine','stocks','client'] }
        }
      }],
      users: [
        { id: 'U1', orgId, name: 'Admin Principal', email: 'admin@haiber.bf', role: 'administrateur' },
        { id: 'U2', orgId, name: 'Commercial', email: 'commercial@haiber.bf', role: 'commercial' },
        { id: 'U3', orgId, name: 'Opérateur', email: 'operator@haiber.bf', role: 'operateur' },
        { id: 'U4', orgId, name: 'Magasinier', email: 'stock@haiber.bf', role: 'magasinier' }
      ],
      clients: [
        { id: 'C1', orgId, name: 'Maison Kaboré', phone: '+226 70 12 34 56', email: 'contact@maisonkabore.bf', ifu: '', city: 'Ouagadougou' },
        { id: 'C2', orgId, name: 'Pharmacie du Centre', phone: '+226 76 00 11 22', email: 'pharmacie@centre.bf', ifu: '', city: 'Ouagadougou' },
        { id: 'C3', orgId, name: 'École Les Étoiles', phone: '+226 65 22 33 44', email: 'ecole@etoiles.bf', ifu: '', city: 'Bobo-Dioulasso' }
      ],
      quotes: [],
      orders: [
        { id: 'CMD-0142', orgId, clientId: 'C1', desc: 'Plateau résine 120×60 cm — cure 24 h', metier: 'resine', step: 1, date: today(), due: today(), hist: [] },
        { id: 'CMD-0143', orgId, clientId: 'C2', desc: '100 t-shirts sérigraphie 2 couleurs — séchage', metier: 'imprimerie', step: 2, date: today(), due: today(), hist: [] },
        { id: 'CMD-0144', orgId, clientId: 'C3', desc: 'Boîtes packaging découpées + BAT en attente', metier: 'packaging', step: 0, date: today(), due: today(), hist: [] },
        { id: 'CMD-0145', orgId, clientId: 'C1', desc: 'Montage vidéo multi-média — 3 séquences', metier: 'multimedia', step: 3, date: today(), due: today(), hist: [] }
      ],
      invoices: [
        { id: 'FAC-2026-0001', orgId, clientId: 'C1', date: today(), ht: 250000, tva: 45000, ttc: 295000, mode: 'Facture simple', fec: { code: '', qr: '', mcf: '' } },
        { id: 'FAC-2026-0002', orgId, clientId: 'C2', date: today(), ht: 120000, tva: 21600, ttc: 141600, mode: 'Facture normalisée', fec: { code: '', qr: '', mcf: '' } }
      ],
      payments: [
        { id: 'PAI-0001', orgId, invoiceId: 'FAC-2026-0001', method: 'Orange Money', ref: 'OM-774512', amount: 150000, status: 'confirmé', date: today(), fee: 2250 },
        { id: 'PAI-0002', orgId, invoiceId: 'FAC-2026-0002', method: 'Espèces', ref: '', amount: 40000, status: 'à vérifier', date: today(), fee: 0 }
      ],
      cash: [],
      creditNotes: [],
      fiscalQueue: [],
      licensePlans: [
        { id: 'ESS', name: 'Essentiel', seats: '3 utilisateurs', monthly: 20000, yearly: 200000, setup: 50000 },
        { id: 'PRO', name: 'Professionnel', seats: '15 utilisateurs', monthly: 60000, yearly: 600000, setup: 100000 },
        { id: 'ENT', name: 'Entreprise', seats: 'Illimité, multisites, API', monthly: 150000, yearly: 0, setup: 0 }
      ],
      currencyRates: { EUR: 655.957, USD: 600, GBP: 780 },
      seasons: ['Rentrée scolaire', 'FESPACO', 'SIAO', 'Tabaski', 'Fêtes de fin d’année', 'Campagnes électorales'],
      subcontractors: [
        { id: 'SUB1', orgId, name: 'Atelier Dioulasso', phone: '+226 65 00 00 00', specialty: 'Sublimation textile', note: 'Délai 5 jours' },
        { id: 'SUB2', orgId, name: 'Decoupe Precision', phone: '+226 70 00 00 00', specialty: 'Découpe laser packaging', note: 'Bibliothèque de boîtes disponible' }
      ],
      motifs: [
        { id: 'MOT-001', orgId, name: 'Plateau résine 120×60', metier: 'resine', description: 'Motif géométrique gravé, 4 coins arrondis', timeH: 2.5, material: 'Résine époxy + durcisseur', colors: 2, mesh: '—', screens: 0, positions: 1, sizes: '120×60 cm', qty: 1, inkRecipe: 'Pigment bleu + paillettes', costPerPiece: 35000, wastePct: 8, lot: 'LOT-2401', note: 'Cure 24 h obligatoire avant démoulage · température atelier 25 °C' },
        { id: 'MOT-002', orgId, name: 'Boîte cadeau 24×18×8', metier: 'packaging', description: 'Fond et couvercle, découpe + pliage', timeH: 1.2, material: 'Carton 350 g', colors: 1, mesh: '—', screens: 0, positions: 1, sizes: '24×18×8 cm', qty: 100, inkRecipe: '', costPerPiece: 800, wastePct: 5, lot: '', note: 'Vérifier le BAT avant découpe · optimisation sur feuille 70×100' },
        { id: 'MOT-003', orgId, name: 'T-shirt 2 couleurs dos+poitrine', metier: 'imprimerie', description: 'Encre plastisol, 2 écrans', timeH: 0.8, material: 'Coton 180 g', colors: 2, mesh: '43T', screens: 2, positions: 2, sizes: 'S–M–L–XL', qty: 100, inkRecipe: 'Blanc plastisol + magenta', costPerPiece: 2500, wastePct: 4, lot: '', note: 'Séchage 10 min entre couleurs · réimpression en un clic' }
      ],
      designs: [
        { id: 'D1', orgId, name: 'Visuel plateau FESPACO', clientId: 'C1', orderId: 'CMD-0142', type: 'Résine', tags: ['plateau','événement'], data: null, note: 'BAT validé par le client', date: today() },
        { id: 'D2', orgId, name: 'Boîte pharmacie — Bibliothèque', clientId: 'C2', orderId: 'CMD-0144', type: 'Packaging', tags: ['boîte','découpe'], data: null, note: 'Dernier patron de découpe', date: today() }
      ],
      aiChats: [],
      stocks: [
        { id: 'S1', orgId, name: 'Résine époxy (lot 5 kg)', category: 'Résine', qty: 1, min: 3, unit: 'lot', supplier: 'Fournisseur Local', expiry: '', alert: 'Résine époxy : stock sous le seuil' },
        { id: 'S2', orgId, name: 'Durcisseur 1 L', category: 'Résine', qty: 2, min: 2, unit: 'L', supplier: 'Fournisseur Local', expiry: '2026-12-05', alert: 'Durcisseur : péremption proche' },
        { id: 'S3', orgId, name: 'Encre plastisol blanc 5 kg', category: 'Encre', qty: 1, min: 2, unit: 'pot', supplier: 'Fournisseur Local', expiry: '', alert: 'Encre plastisol : réapprovisionner' },
        { id: 'S4', orgId, name: 'Cadres sérigraphie 50×70', category: 'Sérigraphie', qty: 12, min: 6, unit: 'cadre', supplier: 'Fournisseur Local', expiry: '', alert: '' },
        { id: 'S5', orgId, name: 'Carton 350 g (feuille)', category: 'Packaging', qty: 40, min: 20, unit: 'feuille', supplier: 'Fournisseur Local', expiry: '', alert: '' }
      ],
      rules: {
        prices: {
          numerique: { A4: 150, A3: 400 },
          // Tarifs grand format du PDF : les anciens libellés sont conservés
          // pour ne pas casser les devis déjà enregistrés.
          grandformat: {
            'Bâche 510 g': 2500, 'Bâche': 2500,
            'Vinyle adhésif': 3000, 'Vinyle': 3000,
            'Dos bleu': 2000, 'Micro perforé': 4000,
            'Tissu polyester': 4000
          },
          serigraphie: { textile: 1200 },
          conception: { 'Logo': 25000, 'Plaquette': 18000, 'Mise en page': 8000, 'Identité visuelle': 45000 },
          packaging: { 'Carton 350 g': 900, 'Carton 500 g': 1400, 'Papier kraft': 700 },
          multimedia: { 'Montage vidéo': 15000, 'Photo produit': 8000, 'Animation': 25000, 'Motion design': 30000 },
          resine: { 'Époxy': 4200, 'Polyuréthane': 5600, 'Silicon': 6800 }
        },
        machineHour: 12000, speedM2H: 15, laborHour: 4000, minPerM2: 4,
        inkM2: 600, eyelet: 25, hem: 300, screenCost: 3500, filmCost: 800,
        designHour: 6000, packagingDie: 15000, multimediaHour: 12000,
        resineCureH: 24, resineDensity: 1.15, resineWaste: 8, catalystPct: 2,
        batFee: 5000, forfaitDiscount: 10,
        // Motion design — tarification modifiable depuis Réglages
        motionOptions: {
          second: 2500, style2d: 12000, style3d: 25000, styleTypo: 8000,
          version: 5000, formats: { MP4: 0, GIF: 3000, HTML5: 7000, Toutes: 10000 }
        },
        // Options complémentaires du cahier des charges HaiBer
        studioOptions: { preflight: 3000, batLink: 1000, version: 2000 },
        packagingOptions: { sachetM2: 650, etiquette: 300, depliant: 500, laminationM2: 400, dorureM2: 900, optimisation: 0 },
        mediaSubscriptions: { 'Aucun': 0, 'Réseaux sociaux — mensuel': 25000, 'Pack campagne': 45000 },
        // Tarifs exacts de « PROPOSITION DES TARIFS.xlsx » (kits cadeaux).
        kitOffers: {
          'KIT 1 — Popcorn + Bonbon + Jus': 800,
          'KIT 2 — Popcorn + Bonbon + Jus + Haribo': 1000,
          'KIT 3 — Popcorn + Bonbon + Jus + Chips + Haribo': 1500,
          'KIT 4 — Popcorn + Bonbon + Jus + Chips + Haribo + Biscuit': 2000,
          'KIT 5 — Popcorn + Bonbon + Jus + Chips + Haribo + Biscuit (grand format)': 3000
        },
        // Services de l'offre « OFFRE DE SERVICE I.docx » (établissements scolaires).
        schoolServices: {
          'Administratif': ['Photocopie de documents administratifs', 'Impression de bulletins, fiches et convocations', 'Reliure et plastification'],
          'Pédagogie': ['Polycopiés (cours, TD, examens)', 'Cartes scolaires et badges', 'Affiches éducatives et supports visuels', 'Impression de sujets d’examen', 'Mise en page de documents'],
          'Uniformes scolaires': ['Impression de logos sur tenues', 'Sérigraphie / flocage', 'Fourniture de tee-shirts ou polos scolaires'],
          'Avantages partenaires': ['Qualité professionnelle', 'Tarifs réduits pour les gros volumes', 'Livraison gratuite à l’école', 'Respect des délais', 'Délais courts 24 à 48 h', 'Possibilité de paiement mensuel']
        },
        // Données structurées extraites du support PDF HaiBer (offres et conseils).
        packsPromo: [
          {
            id: 'PACK-ENTREPRISE', name: 'PACK ENTREPRISE', price: 75500,
            headline: 'Laissez-nous créer votre identité !',
            details: ['Création de logo pro', 'Conception d’une entête', '100 cartes de visite', '100 flyers', '10 carnets de factures']
          },
          {
            id: 'PACK-GADGETS', name: 'PACK GADGETS', price: 150000,
            headline: 'Laissez-nous créer votre identité !',
            details: ['20 t-shirts personnalisés', '20 casquettes', '10 tasses entreprise', '10 porte-clés personnalisés', '10 stylos personnalisés']
          },
          {
            id: 'PACK-CADEAU', name: 'PACK CADEAU/CALENDAR', price: 157500,
            headline: 'Renforcez vos liens avec vos clients',
            details: ['50 calendriers muraux', '20 calendriers de table', '100 cartes de vœux', '10 blocs-notes', '10 tasses entreprise']
          },
          {
            id: 'PACK-PREMIUM', name: 'PACK PREMIUM', price: 165000,
            headline: 'Laissez-nous créer votre identité !',
            details: ['50 calendriers muraux', '50 calendriers de table', '50 cartes de vœux', '20 blocs-notes', '20 tasses', '20 t-shirts', '20 casquettes', '10 porte-clés']
          }
        ],
        brandingVehicule: {
          title: 'Branding véhicule',
          headline: 'Roulez votre image, marquez les esprits !',
          vehicles: ['Bus', 'Camion', 'Car', 'Van'],
          highlights: [
            'Design sur mesure', 'Impression haute qualité', 'Pose professionnelle et garantie',
            'Habillage vitrine & façade', 'Lettrage adhésif', 'Impression numérique grand format',
            'Matériaux de qualité supérieure', 'Délais respectés', 'Conseils personnalisés',
            'Intervention partout au Burkina Faso et dans la sous-région'
          ],
          audience: 'Tous types de véhicules et d’entreprises',
          process: [
            { step: 1, title: 'Écoute & conseil' },
            { step: 2, title: 'Création du design' },
            { step: 3, title: 'Impression & pose' },
            { step: 4, title: 'Livraison ou résultat' }
          ],
          free: 'Maquette & devis gratuits'
        },
        gadgets: {
          title: 'Objets publicitaires personnalisables',
          intro: 'Un cadeau unique, pratique et original pour toutes les occasions.',
          items: ['Tasses', 'Blocs-notes', 'Stylos', 'Porte-clés', 'Casquettes', 'T-shirts', 'Sacs', 'Gourdes'],
          freeDesign: 'Conception gratuite',
          priceNote: 'Prix sur devis sauf indication contraire'
        },
        conseilsFlyers: {
          title: 'Avant de commander vos flyers : format et papier',
          tips: [
            { title: 'Format A5', text: 'Plus d’espace pour le contenu : idéal pour les informations détaillées, ex. les menus.' },
            { title: 'Recto ou recto-verso', text: 'Impression possible en recto ou en recto-verso.' },
            { title: 'Format sur mesure', text: 'Pour un besoin spécifique, un format sur mesure permet un flyer unique et personnalisé.' },
            { title: 'Grammage', text: 'Plus le grammage est élevé, plus le papier est épais et résistant.' },
            { title: '90 à 135 g/m²', text: 'Papier léger et économique, idéal pour les flyers distribués en grande quantité.' }
          ]
        },
        textile: {
          title: 'Informations utiles — textile & gadgets',
          discounts: ['-15 %', '-20 %'],
          techniques: ['Impression vinyl', '180 g', '200 g plastifié', 'DTF', 'Sublimation'],
          minQuantities: { 'Vinyl / sérigraphie': '100 U minimum', 'Sublimation / DTF': '10 U minimum' },
          delivery: 'Livraison et expédition possibles partout au Burkina Faso, à vos frais',
          priceNote: 'Prix à vérifier (OCR partiel) — se référer au devis'
        },
        suppliers: ['Fournisseur Local', 'Coris Bank', 'BOA', 'Ecobank', 'Orabank', 'UBA'],
        paymentMethods: ['Espèces', 'Virement bancaire', 'Chèque', 'Orange Money', 'Moov Money', 'Coris Money', 'Telecel Money', 'Sank Money', 'Wave', 'Carte bancaire', 'Paiement à la livraison'],
        paymentStatuses: ['en attente', 'à vérifier', 'confirmé', 'échoué', 'remboursé', 'annulé'],
        paymentLimits: { 'Orange Money': 500000, 'Moov Money': 300000, 'Coris Money': 1000000 },
        feePayer: 'entreprise', feeRate: 1.5,
        taxRegime: 'Réel normal', withholding: 0,
        domains: { app: 'app.haiber.bf', api: 'api.haiber.bf', portal: 'client.haiber.bf' },
        licenseKey: '', licenseGraceDays: 30,
        catalog: [
          { name: 'Photocopie A4', price: 100 },
          { name: 'Carte de visite (100)', price: 5000 },
          { name: 'Plateau résine 120×60', price: 35000 },
          { name: 'T-shirt sérigraphié 1 couleur', price: 2500 },
          { name: 'Boîte packaging découpée', price: 800 },
          { name: 'Montage vidéo (forfait court)', price: 15000 },
          { name: 'KIT 1 — Popcorn + Bonbon + Jus', price: 800 },
          { name: 'KIT 2 — Popcorn + Bonbon + Jus + Haribo', price: 1000 },
          { name: 'KIT 3 — Popcorn + Bonbon + Jus + Chips + Haribo', price: 1500 },
          { name: 'KIT 4 — Popcorn + Bonbon + Jus + Chips + Haribo + Biscuit', price: 2000 },
          { name: 'KIT 5 — Grand format cadeau', price: 3000 },
          // Objets publicitaires et packs du support PDF (prix 0 = sur devis).
          { name: 'Tasse personnalisée — Simple', price: 2500 },
          { name: 'Tasse personnalisée — VIP', price: 5000 },
          { name: 'Bloc-note A5 spiralé', price: 14900 },
          { name: 'Gourde sublimation', price: 9900 },
          { name: 'T-shirt sublimation', price: 1500 },
          { name: 'Polo DTF', price: 5500 },
          { name: 'Casquette personnalisée — sur devis', price: 0 },
          { name: 'Stylo personnalisé — sur devis', price: 0 },
          { name: 'Porte-clé personnalisé — sur devis', price: 0 },
          { name: 'PACK ENTREPRISE', price: 75500 },
          { name: 'PACK GADGETS', price: 150000 },
          { name: 'PACK CADEAU/CALENDAR', price: 157500 },
          { name: 'PACK PREMIUM', price: 165000 }
        ]
      },
      audit: []
    };
  }

  // Base réelle : organisation et règles fournies par l'utilisateur,
  // toutes les données fictives supprimées.
  function realDB(p) {
    const d = demoDB();
    const orgId = uid('ORG');
    d.activeOrg = orgId;
    d.setupDone = true;
    const o = d.orgs[0];
    o.id = orgId;
    o.name = p.name;
    o.ifu = p.ifu || '';
    o.rccm = p.rccm || '';
    o.country = p.country || 'Burkina Faso';
    o.currency = p.currency || 'FCFA';
    // Coordonnées HaiBer : valeur fournie ou valeur par défaut du PDF.
    Object.keys(DEFAULT_CONTACT).forEach(k => {
      o.settings[k] = p[k] || DEFAULT_CONTACT[k];
    });
    o.tagline = o.settings.tagline;
    o.city = o.settings.city;
    o.phone2 = o.settings.phone2;
    o.email = o.settings.email;
    if (p.tva !== undefined) o.settings.tva = p.tva;
    o.settings.license = { plan: 'À activer', seats: '', expires: '', modules: [] };
    d.users = [{ id: uid('U'), orgId, name: p.adminName, email: p.adminEmail || 'admin@local', role: 'administrateur', appPinHash: pinHash(p.pin) }];
    ['clients', 'quotes', 'orders', 'invoices', 'payments', 'cash', 'creditNotes', 'fiscalQueue',
     'subcontractors', 'motifs', 'designs', 'aiChats', 'stocks'].forEach(k => { d[k] = []; });
    if (p.catalog && p.catalog.length) d.rules.catalog = p.catalog;
    if (p.suppliers && p.suppliers.length) d.rules.suppliers = p.suppliers;
    d.rules.domains = p.domains || { app: '', api: '', portal: '' };
    d.rules.licenseKey = '';
    d.rules.paymentMethods = p.paymentMethods || d.rules.paymentMethods;
    d.audit = [];
    return d;
  }

  // Ajoute les nouveaux jeux de données aux bases déjà enregistrées.
  // Les valeurs personnalisées ne sont jamais écrasées : seules les valeurs
  // historiques (anciens defaults) sont remplacées par celles du PDF.
  function migrate(d) {
    if (d.setupDone === undefined) d.setupDone = false;
    const base = demoDB();
    const baseOrg = base.orgs[0];
    (d.orgs || []).forEach(o => {
      if (!o.settings) o.settings = {};
      ['tagline', 'city', 'phone2', 'email'].forEach(k => {
        const legacyValue = o[k] === undefined || o[k] === '' || o[k] === LEGACY_ORG[k];
        const settingValue = o.settings[k];
        if (legacyValue) o[k] = (settingValue && settingValue !== LEGACY_ORG[k]) ? settingValue : baseOrg[k];
      });
      Object.keys(DEFAULT_CONTACT).forEach(k => {
        const current = o.settings[k];
        const legacy = k === 'phone' ? LEGACY_SUPPORT_PHONE : undefined;
        const missing = current === undefined || current === null || current === '';
        if (missing || current === legacy) {
          const orgValue = o[k];
          o.settings[k] = (orgValue && orgValue !== LEGACY_ORG[k]) ? orgValue : DEFAULT_CONTACT[k];
        }
      });
      ['tagline', 'city', 'phone2', 'email'].forEach(k => {
        if (o[k] === undefined || o[k] === '' || o[k] === LEGACY_ORG[k]) o[k] = o.settings[k];
      });
    });
    ['cash', 'creditNotes', 'fiscalQueue', 'licensePlans', 'currencyRates', 'seasons', 'subcontractors', 'motifs'].forEach(k => {
      if (!d[k]) d[k] = base[k];
    });
    (d.subcontractors || []).forEach(s => { if (!s.orgId) s.orgId = d.activeOrg; });
    (d.motifs || []).forEach(s => { if (!s.orgId) s.orgId = d.activeOrg; });
    if (!d.rules) d.rules = base.rules;
    if (!d.rules.prices) d.rules.prices = base.rules.prices;
    ['conception', 'packaging', 'multimedia', 'resine'].forEach(k => {
      if (!d.rules.prices[k]) d.rules.prices[k] = base.rules.prices[k];
    });
    if (!d.rules.prices.grandformat) d.rules.prices.grandformat = base.rules.prices.grandformat;
    else {
      Object.keys(base.rules.prices.grandformat).forEach(k => {
        if (d.rules.prices.grandformat[k] === undefined) {
          d.rules.prices.grandformat[k] = base.rules.prices.grandformat[k];
        }
      });
      // Ancien tarif par défaut du vinyle aligné sur le PDF (3000 FCFA).
      if (d.rules.prices.grandformat['Vinyle adhésif'] === 3200) d.rules.prices.grandformat['Vinyle adhésif'] = 3000;
    }
    if (d.rules) {
      ['paymentStatuses', 'paymentLimits', 'feePayer', 'feeRate', 'taxRegime',
       'withholding', 'domains', 'licenseKey', 'licenseGraceDays',
       'designHour', 'packagingDie', 'multimediaHour', 'resineCureH',
       'resineDensity', 'resineWaste', 'catalystPct', 'batFee', 'forfaitDiscount',
       'motionOptions', 'studioOptions', 'packagingOptions',
       'mediaSubscriptions', 'kitOffers', 'schoolServices',
       'packsPromo', 'brandingVehicule', 'gadgets', 'conseilsFlyers', 'textile'].forEach(k => {
        if (d.rules[k] === undefined) d.rules[k] = base.rules[k];
      });
      // Catalogue : ajoute les nouveautés sans toucher aux articles/prix existants.
      if (!Array.isArray(d.rules.catalog)) d.rules.catalog = base.rules.catalog.map(c => Object.assign({}, c));
      else {
        const names = new Set(d.rules.catalog.map(c => c && c.name));
        base.rules.catalog.forEach(c => {
          if (!names.has(c.name)) d.rules.catalog.push(Object.assign({}, c));
        });
      }
    }
    return d;
  }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    if (!raw) { const db = demoDB(); save(db); return db; }
    try { const d = migrate(JSON.parse(raw)); save(d); return d; }
    catch (e) { const db = demoDB(); save(db); return db; }
  }

  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { console.warn('Storage unavailable', e); }
  }

  let db = load();

  const Store = {
    get db() { return db; },
    save() { save(db); },
    reset() { db = demoDB(); save(db); return db; },
    uid, today,

    org() { return db.orgs.find(o => o.id === db.activeOrg) || db.orgs[0]; },
    orgSettings() { return this.org().settings; },
    rules() { return db.rules; },
    isDemo() { return !db.setupDone; },
    verifyPin(pin) {
      const u = this.users()[0];
      return !!u && !!u.appPinHash && pinHash(pin) === u.appPinHash;
    },
    applySetup(profile) { db = realDB(profile); save(db); return db; },

    // Une licence expirée (après le délai de grâce) passe en lecture seule :
    // les données restent exportables et aucune écriture métier n'est permise.
    readOnly() {
      const exp = this.orgSettings().license && this.orgSettings().license.expires;
      if (!exp) return false;
      const limit = new Date(exp + 'T23:59:59');
      limit.setDate(limit.getDate() + (db.rules.licenseGraceDays || 0));
      return new Date() > limit;
    },

    // All accessors are scoped to the active organisation.
    clients() { return db.clients.filter(x => x.orgId === db.activeOrg); },
    quotes() { return db.quotes.filter(x => x.orgId === db.activeOrg); },
    orders() { return db.orders.filter(x => x.orgId === db.activeOrg); },
    invoices() { return db.invoices.filter(x => x.orgId === db.activeOrg); },
    payments() { return db.payments.filter(x => x.orgId === db.activeOrg); },
    cash() { return db.cash.filter(x => x.orgId === db.activeOrg); },
    creditNotes() { return db.creditNotes.filter(x => x.orgId === db.activeOrg); },
    subcontractors() { return db.subcontractors.filter(x => x.orgId === db.activeOrg); },
    motifs() { return (db.motifs || []).filter(x => x.orgId === db.activeOrg); },
    stocks() { return db.stocks.filter(x => x.orgId === db.activeOrg); },
    designs() { return db.designs.filter(x => x.orgId === db.activeOrg); },
    aiChats() { return db.aiChats.filter(x => x.orgId === db.activeOrg); },
    users() { return db.users.filter(x => x.orgId === db.activeOrg); },
    audit() { return db.audit.filter(x => x.orgId === db.activeOrg); },

    client(id) { return db.clients.find(x => x.id === id && x.orgId === db.activeOrg); },
    order(id) { return db.orders.find(x => x.id === id && x.orgId === db.activeOrg); },
    quote(id) { return db.quotes.find(x => x.id === id && x.orgId === db.activeOrg); },

    log(action, detail) {
      db.audit.unshift({ id: uid('LOG'), orgId: db.activeOrg, action, detail, at: new Date().toISOString() });
      if (db.audit.length > 500) db.audit.length = 500;
      this.save();
    },

    blocked(list) {
      if (list === 'audit' || list === 'aiChats' || !this.readOnly()) return false;
      if (global.UI && UI.toast) UI.toast('Licence expirée : application en lecture seule. Exportez vos données.', true);
      return true;
    },

    add(list, item) { if (this.blocked(list)) return null; db[list].push(item); this.log('create', item.id); this.save(); return item; },
    update(list, id, patch) {
      if (this.blocked(list)) return null;
      const it = db[list].find(x => x.id === id && x.orgId === db.activeOrg);
      if (it) { Object.assign(it, patch); this.log('update', id); this.save(); }
      return it;
    },
    remove(list, id) {
      if (this.blocked(list)) return;
      const i = db[list].findIndex(x => x.id === id && x.orgId === db.activeOrg);
      if (i >= 0) { db[list].splice(i, 1); this.log('delete', id); this.save(); }
    },

    nextNumber(kind) {
      const prefixes = { invoice: 'FAC', quote: 'DEV', order: 'CMD', cash: 'TKT', credit: 'AVO', motif: 'MOT' };
      const lists = { invoice: 'invoices', quote: 'quotes', order: 'orders', cash: 'cash', credit: 'creditNotes', motif: 'motifs' };
      const prefix = prefixes[kind] || 'CMD';
      const year = new Date().getFullYear();
      const count = (db[lists[kind] || 'orders'] || []).filter(x => x.orgId === db.activeOrg).length + 1;
      return prefix + '-' + year + '-' + String(count).padStart(4, '0');
    },

    LOGO_URL,
    steps: ['BAT validé', 'Production', 'Séchage / Cure', 'Découpe / Finition', 'Contrôle qualité', 'Prêt'],
    logoImg(cls) { return `<img src="${LOGO_URL}" alt="HaiBer" class="${cls || ''}">`; }
  };

  global.Store = Store;
})(window);
