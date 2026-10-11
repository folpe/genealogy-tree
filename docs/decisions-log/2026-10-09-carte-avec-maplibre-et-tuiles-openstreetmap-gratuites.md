---
date: 2026-10-09
title: "Carte avec MapLibre et tuiles OpenStreetMap gratuites"
status: accepted
migratedFrom: docs/DECISIONS.md
---

## 2026-10-09: Carte avec MapLibre et tuiles OpenStreetMap gratuites

- **Date :** 2026-10-09
- **Décision :** MapLibre GL, tuiles vectorielles OpenFreeMap, style sombre maison ; géocodage Base Adresse Nationale pour la France, Nominatim pour l'étranger, résultat stocké dans `places`.
- **Pourquoi :** open source, sans clé ni facturation, style entièrement personnalisable pour rester dans la direction visuelle.
- **Alternatives écartées :** Mapbox (payant au-delà du gratuit, clé obligatoire) ; Google Maps (payant, style contraint) ; Leaflet raster (moins fluide, style limité).
- **À réexaminer si :** la disponibilité d'OpenFreeMap devient un problème (repli : auto-hébergement de tuiles PMTiles sur Blob).
