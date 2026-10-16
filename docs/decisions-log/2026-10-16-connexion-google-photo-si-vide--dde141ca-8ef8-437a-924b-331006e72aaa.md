---
schemaVersion: 1
id: "adr:dde141ca-8ef8-437a-924b-331006e72aaa"
createdAt: "2026-10-16T12:00:00.000Z"
title: "Connexion Google, photo importée si la fiche est vide"
status: accepted
deciders: ["folpe", "claude"]
supersedes: []
---

# Connexion Google, photo importée si la fiche est vide

## Context

La connexion repose sur le lien magique et la passkey (décision du 2026-10-09). Une partie de la famille a déjà un compte Google et préfère un bouton à un email à aller chercher. L'accès reste sur invitation : Google ne doit ouvrir l'arbre à personne de plus que le lien magique.

Google fournit aussi une photo de profil. Beaucoup de fiches de membres n'en ont pas encore.

## Decision

- Bouton « Continuer avec Google » sur `/login`, affiché seulement si `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont configurés.
- Le crochet d'admission de la création de compte s'applique à Google comme au lien magique : une adresse non invitée est refusée, sans compte créé, avec un message qui le dit.
- Liaison implicite de better-auth, rendue explicite : un membre inscrit par lien magique (email vérifié) qui arrive par Google à la même adresse, vérifiée par Google, retrouve son compte. Google n'est pas déclaré fournisseur de confiance.
- Photo : choix de Folpe du 2026-10-16, « automatique si vide ». À la création d'un compte Google (nouveau membre ou liaison), si la fiche liée au membre n'a pas de photo de profil, la photo Google devient celle de la fiche. Une fiche déjà photographiée n'est jamais touchée.

Garde-fous de l'import :

- URL lue dans la revendication `picture` de l'idToken que better-auth vient de vérifier ; seuls `https:` et un hôte en `.googleusercontent.com` sont acceptés (SSRF), redirections refusées.
- Téléchargement borné : délai de 5 s, type `image/*` exigé, taille limitée à celle d'un envoi de photo (4 Mo), vérifiée sur l'en-tête puis pendant la lecture.
- Import par `changePhoto` au nom du membre : même policy de proximité, mêmes dérivées, EXIF retiré, comme un ajout à la main.
- Import planifié après la réponse (`after` de Next, `waitUntil` sur Vercel) : la connexion n'attend ni Google ni la normalisation de l'image, et un échec de l'import ne l'empêche jamais.

## Consequences

Positive:

- Une connexion en un geste pour qui a Google, sans élargir l'accès.
- Des fiches de membres illustrées sans effort, sans écraser un choix existant.

Negative:

- La photo peut n'apparaître qu'un instant après la première arrivée dans l'arbre.
- Un échec de l'import est silencieux : le projet n'a pas encore de logger.
- Un client OAuth Google à créer et à maintenir (URI de redirection par domaine).

## Alternatives

- Proposer la photo au membre, qui accepte ou non : écarté par Folpe, une étape de plus pour un gain faible tant que la fiche est vide.
- Remplacer toujours la photo par celle de Google : écarté, la photo choisie par la famille prime.
- Déclarer Google fournisseur de confiance : écarté, inutile puisque Google dit l'adresse vérifiée, et moins sûr.
