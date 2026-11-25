# Du mode démonstration à la production

Ce document est la feuille de route des quatre priorités choisies. Il distingue ce qui est **déjà livré**, ce qui est **préparé dans le code**, et ce qui exige **une démarche externe** que l'application ne peut pas simuler honnêtement.

## 1. Atelier réel local — ✅ livré

1. Ouvrir l'application (PC ou APK).
2. À la connexion : **« ⚙ Configurer mon atelier »**, ou dans **Réglages → Configurer mon atelier (mode réel)**.
3. Renseigner : nom, IFU, RCCM, **téléphone support HaiBer +226 06 87 97 10** (https://wa.me/2266879710), autre contact (`+226 60 28 31 31`, `tel:+22660283131`), e-mail **haibermultiservices@gmail.com**, ville/siège (**Cissin, non loin de la boulangerie Wend-Konta, Ouagadougou, Burkina Faso**), devise, TVA, administrateur, code d'accès local, catalogue caisse, fournisseurs, domaines (facultatif). La tagline est « Votre communication, notre mission ! » et la livraison est proposée partout au Burkina Faso et dans la sous-région, à vos frais. Le numéro **+226 55 04 15 30** (https://wa.me/22655041530) est réservé à **Touch Unique**, créateur du site et de l’application : ce n’est pas le support HaiBer.
4. Valider : les données fictives sont supprimées, l'organisation réelle est créée, le code d'accès est haché (jamais stocké en clair).
5. La connexion demande désormais le code d'accès. Le badge « DÉMO » disparaît.

Le bouton « Revenir au mode démonstration » existe uniquement pour les tests. Avant de l'utiliser : **Réglages → Exporter les données (JSON)**.

Limite assumée : le code local est un verrou de confort, pas une authentification serveur. Il ne remplace pas la gestion des droits d'un serveur.

## 2. Conformité fiscale FEC — ⚠️ préparé, à activer par la DGI

**Ce qui est prêt dans le code**

- `js/integrations.js` : `FiscalInvoiceProvider` avec trois modes (simple, normalisée, FEC), file d'attente `fiscalQueue`, et refus explicite de certification tant que l'attestation n'existe pas.
- Chaque facture possède `fec.code`, `fec.qr`, `fec.mcf` et une numérotation continue. Les corrections passent par des avoirs, jamais par la modification d'une facture émise.
- `server/schema.sql` : table `fiscal_invoices` avec code de certification, QR, identifiant MCF et date de certification.
- `server/app.py` : `POST /api/fiscal/certify` répond **501** tant que l'attestation n'est pas obtenue.
- Aucune mention « conforme DGI » n'apparaît dans l'application.

**Démarches à engager**

| Étape | Interlocuteur | Résultat attendu |
|---|---|---|
| Confirmer le calendrier et le statut de HaiBer au regard de la FEC | DGI Ouagadougou | Écriture sur le régime concerné et les dates d'obligation |
| Obtenir l'attestation de conformité du logiciel (arrêté n°0047/MEF/SG/DGI du 05/02/2025) | DGI | Attestation SFE |
| Vérifier le circuit de vente des systèmes par distributeurs agréés | CCI-BF | Agrément ou partenariat |
| Intégrer un MCF / SECeF homologué, ou certifier le propre module de HaiBer | DGI + intégrateur | Code de certification, QR, identifiant MCF |
| Confirmer IFU, RCCM, régime d'imposition, TVA, retenues à la source et précomptes | Comptable local | Règles exactes à saisir dans Réglages |

Ensuite seulement : implémenter `certifyOnline()` dans `js/integrations.js`, brancher `POST /api/fiscal/certify` sur le MCF, et retirer le statut « simulation » de l'interface.

## 3. Paiements réels — ⚠️ préparé, à activer par contrat

**Ce qui est prêt dans le code**

- `js/integrations.js` : `PaymentProvider` avec trois niveaux (manuel ✅, agrégateur ⛔, API directe ⛔), plafonds, statuts, frais à la charge de l'entreprise ou du client.
- Reçus PDF, liens WhatsApp, suivi des références, aucun PIN/OTP/numéro de carte stocké.
- `server/app.py` : webhook `HMAC-SHA256` avec `compare_digest` et table `webhook_events` garantissant l'idempotence.

**Démarches à engager**

1. Choisir un agrégateur : Ligdicash, PayDunya, CinetPay ou YengaPay (à comparer : frais, plafonds, délai de versement, support local).
2. Signer le contrat, obtenir les clés API et le secret webhook, les placer dans `.env` côté serveur — jamais dans l'APK.
3. Renseigner les numéros marchands et comptes bancaires de l'organisation dans les réglages.
4. Vérifier auprès des opérateurs la disponibilité marchande réelle de Wave, Telecel Money et Sank Money, ainsi que les plafonds et frais exacts.
5. Tester en bac à sable chaque adaptateur avant production.
6. Prévoir l'adaptateur PI-SPI (BCEAO) et les API directes au niveau 3 quand le volume le justifie.

## 4. Serveur multi-appareils — ⚠️ scaffold livré, à héberger

**Ce qui est prêt dans le code**

- `server/schema.sql` : organisations, utilisateurs, documents de synchronisation cloisonnés par `org_id`, webhooks, factures fiscales, licences, audit.
- `server/app.py` : `GET /health`, `GET /api/sync/pull`, `POST /api/sync/push`, webhooks signés, points d'extension FEC et licence.
- `server/.env.example` : `APP_DOMAIN`, `API_URL`, `PORTAL_DOMAIN`, secrets.
- Côté client, `js/integrations.js` expose `sync.push()` / `sync.pull()` qui échouent explicitement tant que le serveur n'est pas déployé ; l'export/import JSON reste la voie de repli.

**Démarches à engager**

1. Choisir et réserver le domaine (disponibilité à vérifier), configurer SPF/DKIM/DMARC pour `noreply@[domaine]`.
2. Héberger PostgreSQL + l'API, mettre en place HTTPS, sauvegardes et supervision.
3. Remplacer le jeton statique du scaffold par une vraie authentification (argon2/bcrypt + JWT/sessions) et les rôles.
4. Brancher le client sur `API_URL`, activer la file de synchronisation, tester une modification hors ligne puis sa réconciliation.
5. Déclarer les traitements auprès de la CIL (loi de 2021, à confirmer avec un juriste), prévoir consentement, durée de conservation, droit d'accès et de suppression, hébergement local des données.

## Récapitulatif des statuts

| Volet | État actuel |
|---|---|
| Atelier réel local | Terminé et testé |
| Assistant, historique, caisse, créances, devis, APK | Terminés et testés |
| Vrai logo, palette HaiBer, galerie de 9 visuels, motion design, fiches motifs enrichies | Terminés et testés |
| Support client HaiBer +226 06 87 97 10 (WhatsApp) | Appliqué dans l’interface, les documents, l’APK et le site vitrine |
| Touch Unique +226 55 04 15 30 | Créateur du site et de l’application ; mention d’auteur, **pas** le support HaiBer |
| Interfaces FEC, paiements, synchronisation | Écrites et documentées |
| Attestation DGI / MCF | En attente de démarche externe |
| Clés opérateurs / agrégateur | En attente de contrat |
| Hébergement, domaines, authentification serveur | En attente d'infrastructure |
| Matériel (imprimante thermique, scanner, tablette) | Non branché ; scan QR et signature simulés |

## Points de validation avant publication

- **Témoignages du site** : les avis de `HaiBerSite` sont des exemples inspirés des données de démonstration. Les remplacer par de vrais retours clients avant la mise en ligne.
- **Tarifs textiles du PDF** : confirmer avec l’atelier les montants relevés dans `Tableau tarifaire HB.pdf` (quantités minimales **100 U** ou **10 U**, techniques **vinyle**, **180 g**, **200 g plastifié**, **DTF**, **sublimation**, remises **−15 % / −20 %**) avant de les publier comme définitifs.
- **Offres structurées** : vérifier une dernière fois les packs promotionnels (−20 %), le branding véhicule, les gadgets/objets publicitaires, les conseils flyers (A5, recto/recto-verso, sur mesure, 90–135 g/m²) et les tarifs grand format (Bâche 2 500 F / Vinyle 3 000 F / Dos bleu 2 000 F / Micro perforé 4 000 F le m²) entre `js/store.js`, `js/app.js` et le site vitrine.
- **Miroir Android** : resynchroniser `android/assets/www/` depuis la racine (fichiers web et `docs/`) avant toute reconstruction de l’APK.

Toute affirmation de conformité ou de connexion serait fausse dans l'état actuel : l'application affiche donc explicitement « simulation » ou « non connecté ».
