# 🐱 MiaouPost

App perso pour programmer et publier des posts sur Instagram, Facebook, YouTube et TikTok en même temps, pour la chatterie.

## Fonctionnement

- Un formulaire web pour créer un post (média + légende + plateformes + date/heure).
- Un scheduler (cron interne, vérifie chaque minute) qui publie automatiquement les posts dus via les API officielles de chaque plateforme.
- Une base SQLite locale (`data/miaoupost.db`) qui stocke les posts et leur statut (`scheduled`, `publishing`, `published`, `failed`).

## Prérequis : accès aux API

Ce projet suppose des comptes en mode développement/testeur (usage perso, pas de review complète nécessaire — voir discussion de faisabilité). Il faut renseigner un fichier `.env` (copier `.env.example`) :

- **Facebook / Instagram** : token de Page longue durée depuis [Graph API Explorer](https://developers.facebook.com/tools/explorer), avec ton compte Instagram Business/Creator lié à la Page.
- **YouTube** : client OAuth "Desktop" sur [Google Cloud Console](https://console.cloud.google.com), refresh token obtenu via OAuth Playground avec le scope `youtube.upload`.
- **TikTok** : token OAuth via TikTok for Developers (Content Posting API). Tant que l'app n'est pas auditée, la publication reste en visibilité restreinte.

⚠️ Instagram et TikTok récupèrent le média en le téléchargeant depuis une URL publique : le serveur doit donc être exposé publiquement (domaine ou tunnel type Cloudflare Tunnel / ngrok), renseigné dans `PUBLIC_BASE_URL`.

## Protection par mot de passe

Dès que l'app est exposée publiquement (hébergement, tunnel), configure `APP_PASSWORD` dans `.env` pour activer une protection HTTP Basic Auth sur toute l'app (UI + API). Le navigateur demandera le nom d'utilisateur (`APP_USERNAME`, par défaut `miaoupost`) et le mot de passe, une seule fois — pratique pour un accès partagé à deux. Laisse `APP_PASSWORD` vide en local si tu ne veux pas de protection.

## Installation

```bash
npm install
cp .env.example .env
# renseigner .env avec tes tokens
npm run dev
```

Ouvre `http://localhost:3000`.

## Scripts

- `npm run dev` — serveur de développement (rechargement auto)
- `npm run build` — compile en `dist/`
- `npm start` — lance la version compilée
- `npm run typecheck` — vérifie les types sans compiler
