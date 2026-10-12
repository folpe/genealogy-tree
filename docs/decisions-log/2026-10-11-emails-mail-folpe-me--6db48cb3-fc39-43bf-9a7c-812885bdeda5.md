---
schemaVersion: 1
id: "adr:6db48cb3-fc39-43bf-9a7c-812885bdeda5"
createdAt: "2026-10-11T17:29:22.512Z"
title: "Emails envoyés depuis mail.folpe.me"
status: accepted
deciders: ["folpe"]
supersedes: []
---

# Emails envoyés depuis mail.folpe.me

## Context

L'ADR 12 prévoyait des emails envoyés depuis `famille@folpe.me`, avec SPF, DKIM et DMARC Resend sur `folpe.me`. Folpe avait déjà créé dans Resend le domaine d'envoi `mail.folpe.me`, avec DKIM, MX et SPF vérifiés sur ce sous-domaine. `folpe.me` porte la messagerie Google Workspace, avec un SPF en `-all`.

## Decision

L'app envoie depuis `Ances-Tree <famille@mail.folpe.me>` (variable `EMAIL_FROM`, et valeur par défaut dans `src/env.ts`).

## Consequences

Positive:

- Aucune modification du SPF ni des MX de `folpe.me` : la messagerie Google n'est pas touchée.
- La réputation d'envoi de l'app est isolée sur un sous-domaine.

Negative:

- L'adresse visible est `famille@mail.folpe.me`, un peu moins lisible que `famille@folpe.me`. Le DMARC est hérité de `folpe.me` (`p=quarantine`) : l'alignement DKIM se fait sur le sous-domaine, en mode relâché.

## Alternatives considered

- Créer un second domaine Resend `folpe.me` : écarté. Il doublonnerait un domaine déjà vérifié, et ajouterait des enregistrements sur la racine qui porte Google.

## Reversal cost

Low : une variable d'environnement, si un domaine `folpe.me` est vérifié plus tard dans Resend.
