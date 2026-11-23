# chasm. · le jeu de stratégie « Crossing the Chasm »

Jeu d’équipe pour la présentation **« Crossing the Chasm »** (Geoffrey A. Moore, 1991) d’Alicia, Tassilo et Patrick · Team Academy.
Vous êtes la business team qui organise des événements d’équipe : en 8 mois, dominez 4 segments de clients pragmatiques sans faire faillite.

- **5 équipes de 2**, un ordinateur par équipe : 🎅 Les Pères Noël · 🦌 Les Rennes · ⛄ Les Bonshommes de neige · 🧝 Les Lutins · 🍪 Les Pains d’épices
- **Classement en direct** à projeter : ouvrir le site avec **`#classement`** à la fin de l’adresse.

## Déroulé

1. Chaque équipe ouvre le site, choisit son personnage et clique sur **JOUER**.
2. Mois 0 : reconnaître les profils du cycle d’adoption. Puis la carte : choisir sa tête de pont et dominer les segments en 5 étapes (🎤 interviewer · 💬 positionnement · 🧩 offre complète · 🧪 valider · ⭐ rassurer). Chaque étape coûte de l’argent ; un segment dominé rapporte chaque mois, de plus en plus.
3. Pendant la partie, rien n’est corrigé : tout est noté. À la fin, un **débrief** en vert (réussi) et en rouge (à améliorer).
4. Le score part tout seul au classement, avec le numéro du tour en cours.

## Écran du présentateur (`/#classement`)

- Podium, classement avec les points de chaque tour (T1, T2…) et le total, 👑 pour le premier, 🐌 lanterne rouge pour le dernier, flèches ▲▼.
- Points d’un tour = meilleure partie de l’équipe pendant ce tour · Total = somme des tours.
- Bouton ⚙️ : entrer le **code animateur**, puis tour suivant / précédent, ajouter un score à la main, supprimer un score, réinitialiser le tournoi.

## Mettre en ligne sur Cloudflare (une seule fois)

```
cd cloudflare
npx wrangler login
npx wrangler deploy
npx wrangler secret put ADMIN_CODE     # choisir le code animateur
```

Le site est alors en ligne sur `https://chasm-jeu.<votre-sous-domaine>.workers.dev`.

## Modifier le jeu

Le jeu complet est dans `index.html` (même fichier que la version publiée sur Claude). Après une modification :

```
python3 src/build_cloudflare.py
cd cloudflare && npx wrangler deploy
```

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | le jeu complet, version Claude (classement via la base de données des pages Claude) |
| `cloudflare/reseau_cloudflare.js` | remplace, dans la page, la base de données Claude par le serveur Cloudflare (`/api/…`) |
| `cloudflare/worker.js` | serveur : sert le jeu et garde le classement (Durable Object `Tournoi`) |
| `cloudflare/wrangler.jsonc` | configuration Cloudflare |
| `cloudflare/public/index.html` | page générée par `src/build_cloudflare.py` (ne pas modifier à la main) |
| `src/build_cloudflare.py` | fabrique la page Cloudflare depuis `index.html` |

Version Claude : https://claude.ai/artifact/3YGKakRvrNUZmmui4rK4q5
