# HaiBer Gestion

Application de gestion **HaiBer Multi-Services** — version autonome, hors ligne, adaptée de `Touch Unique Gestion` en conservant toutes les mises à jour (addendum Burkina Faso, sortie du mode démo, interfaces externes).

HaiBer — **« Votre communication, notre mission ! »** — **support client principal : +226 06 87 97 10** (https://wa.me/2266879710). Identité reprise de vos fichiers : logo officiel `LOGO HB PNG.png`, bleu `#3A4F9E`, magenta `#E21481`, orange `#F88F25`. L’APK porte la version **1.3** (`versionCode 4`) et utilise le vrai logo comme icône de lancement, dans l’APK comme dans le site web.

### En ligne

Application web : **https://haibermultiservices564-gif.github.io/haiber-gestion/** (dépôt public `haibermultiservices564-gif/haiber-gestion`, branche `main`, racine). Site associé : **https://haibermultiservices564-gif.github.io/haiber-site/**.

### Coordonnées HaiBer (site et application)

| Information | Valeur |
|---|---|
| Tagline | « Votre communication, notre mission ! » |
| WhatsApp principal (support HaiBer) | **+226 06 87 97 10** — https://wa.me/2266879710 |
| Autre contact | **+226 60 28 31 31** — `tel:+22660283131` |
| E-mail | **haibermultiservices@gmail.com** |
| Atelier | **Cissin, non loin de la boulangerie Wend-Konta, Ouagadougou, Burkina Faso** |
| Livraison | Partout au Burkina Faso et dans la sous-région, **à vos frais** |
| Créateur du site et de l’application | **Touch Unique** — +226 55 04 15 30 (https://wa.me/22655041530), **pas le support HaiBer** |

Ces valeurs sont reprises dans `js/store.js` (organisation et réglages) et `js/app.js` (vue À propos, configuration, liens WhatsApp). L’ancienne adresse « Kouritenga, Ouagadougou » et l’ancien e-mail `contact@haiber.bf` ne sont plus en service ; le numéro `+226 55 04 15 30` doit rester présenté uniquement comme le contact du créateur, jamais comme le support HaiBer.

## Démarrer

| Support | Comment faire |
|---|---|
| **PC Windows / Mac** | Ouvrez `index.html` dans Chrome, Edge ou Firefox. Aucune installation, aucun serveur, aucun Internet. L’onglet affiche le logo HaiBer (favicon). |
| **Android** | Copiez `HaiBer Gestion.apk` sur le téléphone, autorisez « sources inconnues », installez. Fonctionne entièrement hors ligne. |
| **Raccourci web sur mobile** | Ouvrez le site, puis « Ajouter à l’écran d’accueil » : le manifeste `manifest.webmanifest` et les icônes 192/512 px garantissent une icône HaiBer, pas une icône générique. |
| **Synthèse du projet** | Ouvrez `HaiBer Gestion - Resume du projet.pdf` (couverture logo HaiBer, architecture, modules, état de livraison). |

> Le projet **Touch Unique** est conservé tel quel dans `C:\Users\NITRO\Documents\Projet par défaut\TouchUniqueGestion` et dans l'archive `TouchUniqueGestion_SAUVEGARDE_2026-11-24.zip`. Rien n'a été écrasé.

## Les cinq ateliers HaiBer

| Atelier | Ce que fait l'application |
|---|---|
| **Conception graphique** | Forfaits Logo / Plaquette / Mise en page / Identité visuelle, heures estimées, révisions au-delà de 2 incluses, BAT obligatoire, alerte si le temps dépasse le forfait. |
| **Packaging** | Bibliothèque de boîtes, dimensions L×l×h, surface de carton, outillage de découpe, pliage/collage, gâche et BAT avant découpe. |
| **Imprimerie / Sérigraphie** | Trois procédés : numérique, grand format, sérigraphie textile. Cadres et films, encre plastisol, temps de séchage entre couleurs, seuil de rentabilité, BAT. |
| **Multi-média** | Montage vidéo, photo produit, animation, **motion design** (logo animé, 2D, 3D, typographie, durée en secondes, versions, MP4/GIF/HTML5) ; rendu/export, voix off, sous-titres et validation du montage. |
| **Atelier résine** | Calcul du nombre de kg à partir des dimensions (ex. plateau 120×60 cm), densité, gaspillage, catalyseur, moule silicone, **cure 24 h** avec date de démoulage, mise en garde exothermie au-delà de 5 cm. |

Toutes les valeurs (prices, densité, gaspillage, catalyseur, durée de cure, frais de BAT, taux horaires, marges, TVA) sont **modifiables dans Réglages** : aucune valeur métier n'est codée en dur.

## Modules transverses conservés et adaptés

- **Assistant HaiBer IA** : répond en français et avec ses sources sur les commandes, devis, factures, stocks, caisse, créances, licences, devises, saisons, sous-traitants — et sur les questions HaiBer : *« Combien de résine pour un plateau 120x60 cm ? »*, *« Quand démouler ? »*, *« Quelles fiches motifs ? »*, *« Quels BAT en attente ? »*, *« Quelle est la marge du mois ? »*, *« Quels durcisseurs arrivent à péremption ? »*, *« Quels clients n'ont pas payé ? »*.
- **Fiches motifs / bibliothèque de boîtes** : patrons, temps de fabrication, matière, notes atelier ; un bouton « Devis » prépare directement le devis correspondant.
- **Catalogue officiel** (nouveau) : 62 références du `Catalogue HB VERSION FINAL.pdf` avec photos réelles, fiches détaillées (format, grammage, quantité, finitions), recherche et filtres. La donnée est synchronisée avec le site via `catalogue.json` (GitHub Pages → API GitHub → copie locale + cache hors ligne). Une fiche alimente le devis ou WhatsApp ; un pack alimente le moteur de devis.
- **Galerie & motion** : 9 visuels officiels HaiBer embarqués hors ligne (couverture, branding, conception, numérique, impression, résine, offre, étiquette, contact), aperçu plein écran et animations de marque (logo flottant, bandeau animé, transitions). Un bouton prépare le devis motion design. La vue affiche aussi l’offre scolaire issue de `OFFRE DE SERVICE I.docx` et les 5 tarifs de kits cadeaux de `PROPOSITION DES TARIFS.xlsx` (800 / 1000 / 1500 / 2000 / 3000 FCFA), tous modifiables dans Réglages.
- **Production** : étapes `BAT validé → Production → Séchage / Cure → Découpe / Finition → Contrôle qualité → Prêt`, scan QR simulé, signature manuscrite à la livraison, sous-traitance locale.
- **Tableau de bord** : marge moyenne des devis, « à livrer aujourd'hui », péremptions à surveiller, alertes stocks avec libellés métier (résine, durcisseur, encre plastisol).
- **Devis et documents** : détail ligne par ligne explicable, avertissements, facture, proforma, bon de livraison, ticket de caisse, reçu de paiement, PDF.
- **Addendum Burkina Faso** : caisse comptoir, créances/avoirs, licences tarifées, fiscalité configurable, plafonds et frais mobile money, devises d'import, saisonnalité, sous-traitance.
- **Sortie du mode démo** : « Configurer mon atelier » crée la vraie organisation et un code d'accès local haché ; les données fictives sont supprimées.
- **Interfaces externes** : `js/integrations.js` et `server/` (FastAPI + PostgreSQL) préparent paiements, FEC et synchronisation **sans activation frauduleuse**.
- **Offres complémentaires structurées** : champs et règles modifiables pour les **packs promotionnels** (PACK ENTREPRISE, PACK GADGETS, PACK CADEAU, PACK PREMIUM, remise −20 %), le **branding véhicule** (complet, partiel ou total ; lettrage, vitrine, façade, pose), les **objets publicitaires / gadgets** (tasses, blocs-notes, casquettes, t-shirts, stylos, porte-clés, gourdes, sacs) et les **conseils flyers** (A5, recto ou recto-verso, format sur mesure, papier 90–135 g/m²). Le grand format est tarifé au m² : Bâche **2 500 F**, Vinyle **3 000 F**, Dos bleu **2 000 F**, Micro perforé **4 000 F**. Ces données sont alignées avec le site vitrine `HaiBerSite`.

## Principes

- **Aucune valeur métier en dur** : tout vient du store et est modifiable dans l'interface.
- **Multi-organisations** : chaque accès est filtré par `orgId`.
- **Hors ligne** : `localStorage` (clé `hb_db_v1`, distincte de Touch Unique), export/import JSON complet.
- **Français** : interface, assistant, documents, messages WhatsApp.
- **Licence** : après échéance + tolérance, lecture seule ; l'export reste disponible.
- **Sécurité** : aucun PIN, OTP ni numéro de carte stocké ; le code local est haché.
- **Conformité** : aucune mention « conforme DGI » sans attestation ; FEC et paiements restent des simulations explicites.

## Structure

```
HaiBerGestion/
├── index.html                              Coquille de l'application
├── css/styles.css                          Thèmes clair/sombre, composants, assistant
├── js/store.js                             Données, migration, multi-org, règles HaiBer
├── js/quotes.js                            Moteur de devis (5 ateliers)
├── js/ui.js                                Modales, toasts, formats, étapes HaiBer
├── js/ai.js                                Assistant HaiBer IA local et sourcé
├── js/app.js                               Navigation, vues, configuration, export/import
├── js/integrations.js                      Contrats paiement / FEC / synchronisation
├── assets/logo.png                         Vrai logo HaiBer extrait de LOGO HB PNG.png
├── assets/logo.jpg                         Version raster fond blanc (PDF)
├── assets/ic_launcher.png                  Icône Android aux couleurs HaiBer
├── assets/galerie/                         9 visuels officiels optimisés (hors ligne)
├── server/                                 API FastAPI + schema.sql (scaffold non déployé)
├── docs/SOLUTIONS.md                       Blocages et voies de migration
├── docs/PASSAGE_EN_PRODUCTION.md           Feuille de route DGI, opérateurs, hébergement
├── generate_summary.py                     Générateur du PDF récapitulatif
├── HaiBer Gestion - Resume du projet.pdf
├── HaiBer Gestion.apk                      Application Android installable
└── android/                                Sources du conteneur Android (WebView)
```

## Fiche technique de l'APK

| Champ | Valeur |
|---|---|
| Fichier | `HaiBer Gestion.apk` |
| Package | `com.haiber.gestion` |
| Version | 1.2 (code 3) |
| Android minimal | 5.0 (API 21) |
| Android cible | 14 (API 34) |
| Signature | Clé release propre HaiBer (`android/release.jks`), SHA-256 `c3528a56beba39d1d7a66215f5155099e467c05e13a0f4abfce381bc7fe01053` |
| Taille | 223 Ko |
| Réseau | Aucun appel nécessaire ; INTERNET uniquement pour les liens WhatsApp |
| Reconstruction | Définir `JAVA_HOME` (JDK 17), puis `python android/build_apk.py` (SDK Android 34) |

Conservez précieusement `android/release.jks` : toute mise à jour devra être signée avec la même clé.

## Documents

- `docs/SOLUTIONS.md` : blocages traités et migrations futures.
- `docs/PASSAGE_EN_PRODUCTION.md` : les quatre priorités (atelier réel, FEC/DGI, paiements, serveur) avec l'état exact de chacune.
- Le PDF récapitulatif est à garder précieusement : il résume l'architecture et les limites externes.

## Points à valider avant publication

- **Témoignages du site** : les avis affichés dans `HaiBerSite` restent des exemples inspirés des clients de démonstration. Remplacez-les par de vrais retours clients avant mise en ligne.
- **Tarifs textiles du PDF** : les montants relevés dans `Tableau tarifaire HB.pdf` sont à confirmer par l’atelier avant publication (quantités minimales **100 U** ou **10 U**, techniques **vinyle**, **180 g**, **200 g plastifié**, **DTF**, **sublimation**, remises **−15 % / −20 %**). Ils ne doivent pas être présentés comme définitifs tant que la validation n’a pas eu lieu.
- **Miroir Android** : après toute modification des fichiers web (y compris `docs/`), resynchroniser `android/assets/www/` avant de reconstruire l’APK. Le contenu embarqué doit rester identique à celui de la racine. L’APK livré inclut déjà cette synchronisation après l’intégration des informations du PDF.

## Données de démonstration

Les données fournies à l'ouverture sont fictives et propres à HaiBer (plateaux résine, t-shirts sérigraphiés, boîtes packaging, durcisseur proche péremption). Le bouton « Réinitialiser les données de démo » les restaure. La configuration initiale les remplace définitivement par celles de l'atelier.
