# HaiBer Gestion — Solutions apportées aux blocages

Ce document explique comment chaque limite identifiée lors de la première livraison a été traitée, et ce qui reste à brancher lorsque les accès externes seront disponibles.

## 1. « Pas de Flutter / Android SDK » → APK réel

**Problème.** Aucun SDK Flutter ni Android n'était installé sur la machine, donc aucun APK ne pouvait être produit.

**Solution retenue.** L'application est embarquée dans un conteneur Android natif (une `WebView` Java) puis compilée avec le JDK 17 et les outils de build Android (`aapt2`, `d8`, `apksigner`). Le code source de l'application reste unique (HTML/CSS/JS) et fonctionne identiquement sur PC (navigateur) et sur Android.

**Avantages.** Aucune dépendance réseau, démarrage instantané, mises à jour simples, taille réduite, code identique entre les deux plateformes.

**Migration future.** Le conteneur peut être remplacé par une application Flutter sans réécrire les règles métier : `js/quotes.js` (moteur de devis) et `js/ai.js` (assistant) sont des modules autonomes directement transposables en Dart.

## 2. « Pas de serveur NestJS/FastAPI, PostgreSQL, Redis, S3 » → mode local complet + interface prête

**Problème.** Aucun serveur ni base de données centrale n'était disponible, ce qui empêchait la synchronisation multi-appareils.

**Solution retenue.** Toutes les données sont conservées localement dans `localStorage`, cloisonnées par organisation. Un export/import JSON complet (boutons dans **Réglages**) permet : sauvegarde, transfert vers un autre appareil, reprise après panne, et migration future vers l'API. Le format exporté contient les organisations, utilisateurs, clients, devis, commandes, factures, paiements, stocks, conceptions et règles métier.

**Migration future.** Le fichier JSON exporté est le contrat d'entrée de l'API. Chaque accesseur de `js/store.js` est déjà isolé par `orgId`, ce qui correspond exactement au cloisonnement PostgreSQL par organisation.

## 3. « Pas d'accès DGI / certification FEC » → mode simulation honnête

**Problème.** La facture électronique certifiée exige des accès et une attestation de la DGI (code de certification, QR, identifiant MCF) qui ne peuvent pas être obtenus ici.

**Solution retenue.** Le module de facturation applique la numérotation continue, le calcul TVA configurable et l'export PDF. Il **n'affiche jamais** la mention « conforme DGI » sans attestation ; il indique explicitement « Mode simulation FEC » et réserve les champs de certification aux comptes attestés.

**Migration future.** Brancher un `FiscalInvoiceProvider` avec trois modes : facture simple, facture normalisée, FEC certifié. Les champs `fec.code`, `fec.qr`, `fec.mcf` sont déjà présents dans le modèle de données.

## 4. « Pas d'accès aux opérateurs mobile money » → trois niveaux d'intégration documentés

**Problème.** Les API Orange Money, Moov Money, etc. nécessitent des contrats et des clés.

**Solution retenue.** Le module Paiements enregistre manuellement les références de transaction avec statut « à vérifier » ou « confirmé ». Aucun PIN, OTP ou numéro de carte n'est stocké. Les moyens burkinabè sont tous configurables dans les règles métier (`js/store.js`).

**Migration future.** Niveau 2 : agrégateur (Ligdicash, PayDunya, CinetPay, YengaPay) avec webhook signé et idempotence. Niveau 3 : API directe opérateur. Le modèle `payments` contient déjà `method`, `ref`, `amount`, `status`.

## 5. « Pas de préflight AI réel (Ghostscript/qpdf) » → règles déterministes + assistant local

**Problème.** Le moteur de préflight des fichiers d'impression nécessite des outils système et un modèle de langage externe.

**Solution retenue.** Le moteur de devis intègre déjà des avertissements déterministes (largeur machine, fond perdu, grammage, seuil de rentabilité). L'assistant intelligent local (`js/ai.js`) interroge l'historique en français et cite ses sources, sans aucun appel réseau.

**Migration future.** Ajouter un worker Ghostscript/qpdf pour le préflight et un RAG avec embeddings pour l'assistant, en gardant le même cloisonnement par organisation.

## 6. Assistant intelligent

L'assistant répond en langage naturel aux questions sur :

- les commandes en cours et le statut d'une commande précise ;
- l'historique complet de production ;
- les stocks critiques ;
- le chiffre d'affaires, les factures et les paiements confirmés ;
- les devis par client ;
- la caisse comptoir (ventes du jour, tickets, clôtures) ;
- les créances, impayés et avoirs ;
- les offres de licence et l'état d'activation ;
- les sous-traitants, les taux de change et la saisonnalité ;
- les conceptions archivées ;
- un résumé global de l'activité.

Chaque réponse indique ses sources. Les questions et réponses sont conservées dans l'historique de l'organisation.

## 7. Historique et conceptions

- **Historique** : vue consolidée et recherchable de toutes les commandes, devis, factures et conceptions, triée par date.
- **Conceptions** : archivage des maquettes, visuels et fichiers clients par glisser-déposer, avec aperçu, étiquettes, téléchargement et suppression. Les fichiers sont convertis en URL de données et stockés localement (limite de 1,5 Mo par fichier pour préserver la mémoire des appareils modestes).

## 8. Logo

Le vrai logo fourni (`C:\Users\NITRO\Desktop\HB\LOGO HB PNG.png`, 640×640, bleu `#3A4F9E` et magenta `#E21481`) est la source unique : écran de connexion, barre latérale, vue À propos, icône Android, galerie, animation motion et couverture du PDF récapitulatif. Le monogramme provisoire (`assets/logo.svg`) a été supprimé. La tagline affichée est **« Votre communication, notre mission ! »**. Le support client HaiBer est **+226 06 87 97 10** (https://wa.me/2266879710) ; l’autre contact est **+226 60 28 31 31** (`tel:+22660283131`), l’e-mail est **haibermultiservices@gmail.com** et l’atelier est à **Cissin, non loin de la boulangerie Wend-Konta, Ouagadougou**, avec livraison partout au Burkina Faso et dans la sous-région à vos frais. Le numéro **+226 55 04 15 30** (https://wa.me/22655041530) identifie uniquement **Touch Unique**, créateur du site et de l’application : il ne doit jamais être présenté comme le support HaiBer. L’ancienne adresse « Kouritenga » et l’ancien e-mail `contact@haiber.bf` sont abandonnés.

## 9. Addendum Burkina Faso : modules complémentaires

Les points de l'addendum qui ne demandent pas d'accès externe sont maintenant implémentés :

| Point de l'addendum | Traitement dans cette version |
|---|---|
| Prix des licences | Table `licensePlans` modifiable dans **Réglages** (mensuel, annuel à 2 mois offerts, installation). Aucun montant codé en dur. |
| Activation hors ligne | Champ de clé signée + tolérance configurable (30 jours par défaut). Après échéance, écritures bloquées et export maintenu. La vérification cryptographique réelle reste à brancher côté serveur. |
| Noms de domaine | Champs `app`, `api`, `portal` dans les réglages, prêts à devenir des variables d'environnement (`APP_DOMAIN`, `API_URL`, `PORTAL_DOMAIN`). |
| Moyens de paiement burkinabè | Listes configurables, plafonds par opérateur, frais à la charge de l'entreprise ou du client, statuts complets, reçus PDF et lien WhatsApp. |
| Caisse comptoir | Vente rapide depuis un catalogue modifiable, ticket imprimable, clôture de caisse. |
| Proforma, bon de livraison, avoirs | Boutons de génération sur chaque facture ; l'avoir est enregistré sans jamais modifier la facture émise. |
| Créances et relances | Calcul du solde après paiements et avoirs, relance WhatsApp en un clic, plafond de crédit à prévoir côté API. |
| Matières importées | Taux EUR/USD/GBP modifiables et convertisseur intégré au Réglages. |
| Catalogue local | Cartes de visite, photocopies, photo, tampons, façonnage dans le catalogue de caisse ; la sublimation est déjà référencée comme spécialité de sous-traitance. |
| Saisonnalité | Périodes fortes visibles dans les Stocks et interrogeables par l'assistant. |
| Sous-traitance | Fiches partenaires avec spécialité, téléphone et contact WhatsApp, visibles en Production. |

## 10. Identité HaiBer, galerie et motion design

Les fichiers du dossier `Desktop\HB` ont été intégrés tels quels : couverture, branding, conception, impression numérique, imprimerie/sérigraphie, résine, offre de services, étiquette et visuel de contact. Les données extractibles de `OFFRE DE SERVICE I.docx` (services scolaires, avantages partenaires) et de `PROPOSITION DES TARIFS.xlsx` (KIT 1 à 5 : 800, 1 000, 1 500, 2 000 et 3 000 FCFA) sont affichées dans la galerie et conservées dans les règles modifiables. Le `Tableau tarifaire HB.pdf` est un visuel scanné : ses images sont embarquées dans la galerie, ses montants non lisibles par extraction n'ont pas été inventés. Ils sont optimisés dans `assets\galerie\` et embarqués hors ligne dans l'APK. La vue **Galerie & motion** les affiche en grille avec aperçu plein écran, une boucle animée générée depuis le vrai logo (`assets\motion\logo-loop.gif`) et des animations d'interface qui respectent `prefers-reduced-motion`.

Le devis multi-média sait chiffrer le motion design : logo animé, motion 2D/3D, typographie animée, durée en secondes, nombre de versions, formats MP4/GIF/HTML5 et abonnements (réseaux sociaux, campagne). Les fiches motifs complètes (couleurs, maillage, cadres, positions, tailles, recette d'encre, coût pièce, lot, réimpression) alimentent les devis. Les options studio (préflight, BAT daté par lien/WhatsApp, versions archivées), packaging (sachet, étiquette, dépliant, pelliculage, dorure, optimisation sur feuille), l'acompte à la commande et le minuteur de cure 24 h sont modifiables dans **Réglages**.

**Points restant à valider avec des interlocuteurs externes** (aucune affirmation n'est faite dans l'application) : attestation DGI/CCI-BF et calendrier FEC exact, disponibilité marchande de Wave/Telecel Money/Sank Money, plafonds et frais réels des opérateurs, choix de l'agrégateur, texte de conformité CIL, règles de retenue à la source et de précompte, disponibilité du nom de domaine. Ces points sont listés tels quels dans l'addendum source et doivent être confirmés avant la mise en vente.

## 11. Offres structurées et contenus à valider

Les données commerciales sont désormais structurées dans `js/store.js` et `js/app.js`, et alignées avec le site `HaiBerSite` :

| Ajout | Contenu pris en charge |
|---|---|
| Packs promotionnels | PACK ENTREPRISE, PACK GADGETS, PACK CADEAU, PACK PREMIUM, avec le détail des prestations et la remise de **−20 %**. |
| Branding véhicule | Habillage complet, partiel ou total, design sur mesure, lettrage adhésif, habillage de vitrine/façade, pose professionnelle et intervention dans la sous-région. |
| Objets publicitaires / gadgets | Tasses, blocs-notes, casquettes, t-shirts, stylos, porte-clés, gourdes, sacs et emballages personnalisés, avec quantités minimales quand elles sont connues. |
| Conseils flyers | Format **A5** (recto ou recto-verso), format sur mesure possible, papier léger **90–135 g/m²** pour les grandes distributions. |
| Grand format | Tarifs au m² : Bâche **2 500 F**, Vinyle **3 000 F**, Dos bleu **2 000 F**, Micro perforé **4 000 F**. |

**Contenus encore à valider avant publication** : les témoignages du site sont des exemples à remplacer par de vrais retours clients. Les tarifs textiles relevés dans le PDF (`Tableau tarifaire HB.pdf`) doivent être confirmés par l’atelier : quantités minimales **100 U** ou **10 U**, techniques **vinyle**, **180 g**, **200 g plastifié**, **DTF** et **sublimation**, remises **−15 % / −20 %**. Aucun de ces montants ne doit être présenté comme définitif sans vérification.

Après modification des fichiers web, le miroir `android/assets/www/` doit être resynchronisé avant toute reconstruction de l’APK.
