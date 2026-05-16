<div align="center">
  <img src="./imgs/icon.png" alt="PromptHub Logo" width="120" height="120" />
  <h1>PromptHub</h1>
  <p><strong>🚀 Une boîte à outils IA tout-en-un pour les prompts, les skills et les assets d'agents</strong></p>
  <p>Réutilisation de prompts · Distribution de skills en un clic · Gestion des assets d'agents · Synchronisation cloud · Sauvegarde · Contrôle de version</p>

  <p>
    <a href="https://github.com/legeling/PromptHub/stargazers"><img src="https://img.shields.io/github/stars/legeling/PromptHub?style=flat-square&color=yellow" alt="GitHub Stars"/></a>
    <a href="https://github.com/legeling/PromptHub/network/members"><img src="https://img.shields.io/github/forks/legeling/PromptHub?style=flat-square" alt="GitHub Forks"/></a>
    <a href="https://github.com/legeling/PromptHub/releases"><img src="https://img.shields.io/badge/preview-v0.5.6--beta.2-8B5CF6?style=flat-square" alt="Version"/></a>
    <a href="https://github.com/legeling/PromptHub/releases"><img src="https://img.shields.io/github/downloads/legeling/PromptHub/total?style=flat-square&color=blue" alt="Téléchargements"/></a>
    <img src="https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square" alt="Licence : AGPL-3.0"/>
  </p>

  <p>
    <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Electron-33-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron"/>
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React"/>
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="TailwindCSS"/>
  </p>

  <p>
    <a href="../README.md">简体中文</a> ·
    <a href="./README.zh-TW.md">繁體中文</a> ·
    <a href="./README.en.md">English</a> ·
    <a href="./README.ja.md">日本語</a> ·
    <a href="./README.de.md">Deutsch</a> ·
    <a href="./README.es.md">Español</a> ·
    <a href="./README.fr.md">Français</a>
  </p>
</div>

<br/>

<div align="center">
  <a href="https://github.com/legeling/PromptHub/releases">
    <img src="https://img.shields.io/badge/📥_Télécharger_maintenant-Releases-blue?style=for-the-badge&logo=github" alt="Téléchargement"/>
  </a>
</div>

<br/>

> 💡 **Pourquoi PromptHub ?**
>
> PromptHub est plus qu'un gestionnaire de prompts. C'est un espace de travail local-first pour les prompts, les skills SKILL.md et les assets d'agents. Organisez vos prompts, scannez et distribuez des skills vers Claude Code, Cursor, Windsurf, Codex et plus de 15 outils IA, puis maintenez vos assets IA personnels ou de projet avec synchronisation cloud, sauvegarde, contrôle de version et stockage local respectueux de la vie privée.

---

## Comment utiliser PromptHub

| Format | Idéal pour | Valeur principale |
| ------ | ---------- | ----------------- |
| Application desktop | Utilisateurs individuels, usage intensif de prompts, workflows de développement assistés par IA | Un espace principal local-first pour les prompts, les skills et les assets IA liés aux projets |
| Web auto-hébergé | Accès via navigateur, auto-hébergement personnel, usage comme cible de sauvegarde / restauration | Un espace léger dans le navigateur qui peut aussi servir de cible de synchronisation pour le desktop |
| CLI | Traitements batch, scripts, automatisation, pipelines | Accès direct aux données locales PromptHub et aux dépôts de skills gérés |

Si vous découvrez PromptHub, l'ordre recommandé est :

1. Commencer par l'application desktop pour organiser prompts et skills.
2. Ajouter WebDAV ou PromptHub Web auto-hébergé quand vous avez besoin d'accès navigateur ou de sauvegardes multi-appareils.
3. Ajouter la CLI quand l'automatisation devient nécessaire.

## 📸 Captures d'écran

<div align="center">
  <p><strong>Interface principale</strong></p>
  <img src="./imgs/1-index.png" width="80%" alt="Interface principale"/>
  <br/><br/>
  <p><strong>Boutique de Skills</strong></p>
  <img src="./imgs/10-skill-store.png" width="80%" alt="Boutique de Skills"/>
  <br/><br/>
  <p><strong>Détail du Skill et installation sur les plateformes</strong></p>
  <img src="./imgs/11-skill-platform-install.png" width="80%" alt="Détail du Skill et installation sur les plateformes"/>
  <br/><br/>
  <p><strong>Édition des fichiers Skill et comparaison de versions</strong></p>
  <img src="./imgs/12-skill-files-version-diff.png" width="80%" alt="Édition des fichiers Skill et comparaison de versions"/>
  <br/><br/>
  <p><strong>Sauvegarde des données</strong></p>
  <img src="./imgs/4-backup.png" width="80%" alt="Sauvegarde des données"/>
  <br/><br/>
  <p><strong>Paramètres de thème et d'arrière-plan</strong></p>
  <img src="./imgs/5-theme.png" width="80%" alt="Paramètres de thème et d'arrière-plan"/>
  <br/><br/>
  <p><strong>Comparaison de versions</strong></p>
  <img src="./imgs/8-version-compare.png" width="80%" alt="Comparaison de versions"/>
</div>

## ✨ Fonctionnalités

### 📝 Gestion des prompts

- Créer, modifier et supprimer avec dossiers et tags
- Historique de versions automatique avec comparaison et restauration
- Variables de modèle `{{variable}}` pour la copie, les tests et la distribution
- Favoris, recherche plein texte, pièces jointes et aperçu média

### 🧩 Distribution et gestion des skills

- **Boutique de Skills** : plus de 20 skills sélectionnés provenant d'Anthropic, OpenAI et d'autres sources
- **Installation multiplateforme** : installation en un clic sur Claude Code, Cursor, Windsurf, Codex, Kiro, Gemini CLI, Qoder, QoderWork, CodeBuddy et plus de 15 plateformes
- **Scan local** : détecte les fichiers `SKILL.md`, les prévisualise puis les importe de manière sélective
- **Mode symlink / copie** : édition synchronisée via lien symbolique ou copie indépendante
- **Répertoires cibles par plateforme** : surcharge du dossier de skills par plateforme tout en gardant cohérence entre scan et distribution
- **Traduction et amélioration IA** : traduire ou affiner un Skill complet directement depuis PromptHub
- **Filtrage par tags** : filtrer rapidement les skills depuis la barre latérale

### 🤖 Projets et assets d'agents

- Scanne les dossiers de projet courants comme `.claude/skills`, `.agents/skills`, `skills` et `.gemini`
- Gère bibliothèques personnelles, dépôts locaux et assets IA de projet depuis un seul endroit
- Rend prompts, skills et assets de projet portables grâce au stockage local-first, à la synchronisation et aux sauvegardes

### 🧪 Tests IA et génération

- Tests IA intégrés pour les principaux fournisseurs
- Comparaison parallèle d'un même prompt sur plusieurs modèles
- Tests de modèles de génération d'images
- Génération et amélioration de skills assistées par IA

### 💾 Données et synchronisation

- Toutes les données sont stockées localement, avec priorité à la confidentialité
- Sauvegarde et restauration complètes avec `.phub.gz`
- Synchronisation WebDAV
- Utilisation de PromptHub Web auto-hébergé comme cible de sauvegarde / restauration pour le desktop
- Synchronisation au démarrage et planifiée

### 🎨 Interface et sécurité

- Vues cartes, galerie et liste
- Modes sombre, clair et système avec plusieurs couleurs de thème
- Images d'arrière-plan personnalisées
- 7 langues, rendu Markdown, coloration syntaxique et support multiplateforme
- Protection par mot de passe maître
- Dossiers privés (bêta)

## 📥 Téléchargement et installation desktop

Si vous commencez avec PromptHub, démarrez de préférence par l'application desktop.

### Téléchargement

Téléchargez la dernière preview `v0.5.6-beta.2` depuis [Releases](https://github.com/legeling/PromptHub/releases) :

| Plateforme | Téléchargement |
| :--------: | :------------- |
| Windows | [![Windows x64](https://img.shields.io/badge/Windows_x64-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-Setup-0.5.6-beta.2-x64.exe) [![Windows arm64](https://img.shields.io/badge/Windows_arm64-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-Setup-0.5.6-beta.2-arm64.exe) |
| macOS | [![macOS Apple Silicon](https://img.shields.io/badge/macOS_Apple_Silicon-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-0.5.6-beta.2-arm64.dmg) [![macOS Intel](https://img.shields.io/badge/macOS_Intel-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-0.5.6-beta.2-x64.dmg) |
| Linux | [![Linux AppImage](https://img.shields.io/badge/Linux_AppImage-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-0.5.6-beta.2-x64.AppImage) [![Linux deb](https://img.shields.io/badge/Linux_deb-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/prompthub_0.5.6-beta.2_amd64.deb) |
| Aperçu | [![Preview Prereleases](https://img.shields.io/badge/Preview_Prereleases-8B5CF6?style=for-the-badge&logo=github&logoColor=white)](https://github.com/legeling/PromptHub/releases?q=prerelease%3Atrue) |

> 💡 **Conseils d'installation**
>
> - **macOS** : Apple Silicon (M1/M2/M3/M4) doit utiliser `arm64`, Intel doit utiliser `x64`
> - **Windows** : la plupart des machines doivent utiliser `x64` ; seul Windows on ARM nécessite `arm64`
> - **Canal preview** : les builds preview sont publiées comme GitHub `Prereleases` ; une fois activé, PromptHub vérifie uniquement les prereleases
> - **Retour au stable** : désactivez d'abord le canal preview. PromptHub ne rétrograde jamais automatiquement d'une preview plus récente vers une stable plus ancienne

### Installer sur macOS via Homebrew

```bash
brew tap legeling/tap
brew install --cask prompthub
```

### Mise à jour pour les utilisateurs Homebrew

Si vous avez installé PromptHub avec Homebrew, utilisez Homebrew aussi pour les mises à jour futures et ne mélangez pas cela avec le flux DMG interne.

```bash
brew update
brew upgrade --cask prompthub
```

Si l'état local de Homebrew semble incohérent, réinstallez le cask actuel :

```bash
brew reinstall --cask prompthub
```

> - Les utilisateurs ayant installé via DMG/EXE doivent utiliser l'updater interne ou GitHub Releases
> - Les utilisateurs Homebrew doivent utiliser `brew upgrade --cask prompthub` et ne pas revenir au chemin DMG interne
> - Mélanger les deux chemins peut désynchroniser la version connue de Homebrew et l'app réellement installée

### Premier lancement sur macOS

Comme l'application n'est pas notariée par Apple, vous pouvez voir **"PromptHub est endommagé et ne peut pas être ouvert"** ou **"Impossible de vérifier le développeur"** au premier lancement.

**Solution recommandée** : ouvrez Terminal et exécutez cette commande pour contourner Gatekeeper :

```bash
sudo xattr -rd com.apple.quarantine /Applications/PromptHub.app
```

> 💡 **Conseil** : si l'application est installée ailleurs, remplacez le chemin par le chemin réel.

**Sinon** : ouvrez "Réglages Système" → "Confidentialité et sécurité" → faites défiler jusqu'à Sécurité → cliquez sur "Ouvrir quand même".

<div align="center">
  <img src="./imgs/install.png" width="60%" alt="Avis d'installation sur macOS"/>
</div>

### Exécuter le desktop depuis les sources

```bash
git clone https://github.com/legeling/PromptHub.git
cd PromptHub
pnpm install

# Démarrer le développement desktop
pnpm electron:dev

# Construire le desktop
pnpm build

# Construire le Web auto-hébergé si nécessaire
pnpm build:web
```

> `pnpm build` à la racine du dépôt ne construit que l'application desktop. Exécutez aussi `pnpm build:web` si vous avez besoin du build Web.

## 🚀 Démarrage rapide

### 1. Créer votre premier Prompt

Cliquez sur « Nouveau » et remplissez le titre, la description, `System Prompt`, `User Prompt` et les tags.

### 2. Utiliser des variables de modèle

Utilisez la syntaxe `{{nom_variable}}` dans vos prompts :

```text
Veuillez traduire le texte suivant de {{source_lang}} vers {{target_lang}} :

{{text}}
```

### 3. Ajouter des Skills à votre espace de travail

- Ajoutez des skills utiles depuis la boutique
- Scannez des `SKILL.md` locaux ou présents dans des projets
- Continuez ensuite à éditer, traduire, comparer et distribuer depuis « My Skills »

### 4. Les distribuer vers des outils IA

- Choisissez des plateformes cibles comme Claude Code, Cursor, Windsurf, Codex ou Gemini CLI
- PromptHub installe les skills dans chaque répertoire de plateforme pour vous

> 🖥️ **Plateformes actuellement prises en charge** : Claude Code, GitHub Copilot, Cursor, Windsurf, Kiro, Gemini CLI, Trae, OpenCode, Codex CLI, Roo Code, Amp, OpenClaw, Qoder, QoderWork, CodeBuddy

### 5. Configurer sync et sauvegarde

- Configurez WebDAV pour synchroniser plusieurs appareils
- Ou connectez PromptHub Web auto-hébergé dans `Réglages -> Données` comme cible de sauvegarde / restauration

## CLI en ligne de commande

PromptHub propose une GUI et une CLI. La CLI convient aux scripts, opérations par lot, imports, scans et automatisation.

### Modes actuellement disponibles

> ⚠️ **État actuel**
>
> - L'application desktop n'installe pas automatiquement la commande `prompthub`
> - Ce dépôt fournit actuellement une entrée CLI standalone depuis les sources, un bundle compilé et un flux local de pack/install
> - Si vous avez besoin d'une commande globale `prompthub`, créez le tarball CLI depuis le dépôt puis installez-le localement

### Pack local puis installation globale

```bash
pnpm pack:cli
pnpm add -g ./apps/cli/prompthub-cli-*.tgz
prompthub --help
prompthub prompt list
```

### Exécuter depuis les sources

```bash
pnpm --filter @prompthub/cli dev -- --help
pnpm --filter @prompthub/cli dev -- prompt list
pnpm --filter @prompthub/cli dev -- skill list
pnpm --filter @prompthub/cli dev -- skill scan
pnpm --filter @prompthub/cli dev -- skill install ~/.claude/skills/my-skill
```

### Utiliser le bundle CLI compilé

```bash
pnpm build:cli
node apps/cli/out/prompthub.cjs --help
node apps/cli/out/prompthub.cjs prompt list
node apps/cli/out/prompthub.cjs skill list
```

### Options courantes

- `--output json|table`
- `--data-dir /path/to/user-data`
- `--app-data-dir /path/to/app-data`

### Commandes prises en charge

- `prompt list|get|duplicate|versions|create-version|delete-version|diff|rollback|use|list-tags|rename-tag|delete-tag|create|update|delete|search`
- `folder list|get|create|update|delete|reorder`
- `rules list|scan|read|save|rewrite|add-project|remove-project|version-delete|export|import`
- `workspace export|import`
- `skill list|get|install|scan|delete|remove`

### Notes

- La CLI lit et écrit directement dans la base de données locale de PromptHub et dans le dépôt de skills géré
- L'application desktop n'affiche aujourd'hui qu'une aide CLI dans les réglages et n'installe pas de wrapper shell
- `apps/cli` peut aussi être empaqueté depuis le dépôt puis installé localement comme tarball global

## 🌐 Web auto-hébergé

PromptHub Web est un espace léger auto-hébergé dans le navigateur, et non le SaaS officiel. Il est utile si vous voulez :

- accéder à vos données PromptHub depuis un navigateur
- utiliser PromptHub Web comme cible de sauvegarde / restauration pour le desktop
- ne pas dépendre uniquement de WebDAV et préférer un espace auto-hébergé plus direct

### Démarrage rapide avec Docker Compose

Exécutez ceci à la racine du dépôt :

```bash
cd apps/web
cp .env.example .env
docker compose up -d --build
```

Variables importantes :

- `JWT_SECRET` : au moins 32 caractères aléatoires pour l'authentification
- `ALLOW_REGISTRATION=false` : recommandé après l'initialisation pour garder l'inscription publique désactivée
- `DATA_ROOT` : répertoire racine utilisé pour `data/`, `config/`, `logs/` et `backups/`

URL d'accès par défaut : `http://localhost:3871`

### Premier démarrage

- Une instance neuve ouvre `/setup` au lieu de la page de connexion
- Le premier utilisateur devient administrateur
- Après la création du premier compte admin, l'inscription publique reste désactivée

### Connecter le desktop à PromptHub Web

Dans le desktop, ouvrez `Réglages -> Données` et configurez :

- l'URL de PromptHub auto-hébergé
- le nom d'utilisateur
- le mot de passe

Ensuite, le desktop peut :

- tester la connexion
- envoyer l'espace de travail local actuel vers PromptHub Web
- télécharger et restaurer depuis PromptHub Web
- tirer une fois au démarrage
- pousser les mises à jour selon une planification

### Données et sauvegarde

Sauvegardez tout le répertoire racine de données, pas seulement le fichier SQLite. Les chemins persistants typiques incluent :

```bash
apps/web/data
apps/web/config
apps/web/logs
```

Ces répertoires peuvent contenir :

- `data/prompthub.db`
- `data/prompts/...`
- `data/skills/...`
- `data/assets/...`
- `config/settings/...`
- `backups/...`
- `logs/...`

Pour le déploiement complet, les mises à jour, les sauvegardes, les images GHCR et les notes de développement, consultez [`web-self-hosted.md`](./web-self-hosted.md).

## 📈 Star History

<a href="https://star-history.com/#legeling/PromptHub&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=legeling/PromptHub&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=legeling/PromptHub&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=legeling/PromptHub&type=Date" />
  </picture>
</a>

## 🗺️ Feuille de route

### v0.5.5 (stable actuelle) 🚀

- [x] **Détection des mises à jour des Skills du store** : les Skills installés depuis le store conservent un hash d'installation et peuvent vérifier le `SKILL.md` distant en toute sécurité
- [x] **Traduction complète des documents Skill** : la traduction IA travaille désormais sur le `SKILL.md` complet, enregistre des sidecars locaux et prend en charge les modes complet et immersif
- [x] **Changement du dossier de données réellement appliqué** : PromptHub relance maintenant l'application pour réappliquer le nouveau chemin `userData`
- [x] **Retour plus clair pour les tests IA** : les tests de modèles affichent « modèle XX test réussi / échoué », et les erreurs de traduction dues à une configuration absente, un timeout ou `504` sont explicites
- [x] **Correctifs Web médias et sync** : les déploiements Web/Docker peuvent téléverser des médias et ne classent plus les dossiers normaux comme privés lors de la synchronisation

### v0.4.9

- [x] Durcissement sécurité, refactorisation d'architecture, correction des métadonnées Skill
- [x] Gestion plus robuste des erreurs de migration, nettoyage qualité de code et 720 tests réussis

### v0.4.8

- [x] AI Workbench livré, intégration du store skills.sh, suppression de l'historique de versions
- [x] Durcissement backup / WebDAV, clarté sur la migration du dossier de données, performance des grandes bibliothèques

### v0.3.x

- [x] Dossiers multi-niveaux, contrôle de version, modèles variables
- [x] Laboratoire multi-modèles, synchronisation WebDAV, rendu Markdown
- [x] Multiples vues, intégration système, sécurité et confidentialité

### Plans futurs

- [ ] **Extension navigateur** : accéder à PromptHub depuis ChatGPT / Claude Web
- [ ] **Application mobile** : consulter, rechercher et éditer sur mobile
- [ ] **Système de plugins** : intégrer des fournisseurs IA personnalisés et des modèles locaux
- [ ] **Marketplace de Skills** : publier et partager des Skills créés par la communauté

## 📝 Journal des modifications

Consultez le changelog complet : **[CHANGELOG.md](../CHANGELOG.md)**

### Dernière preview v0.5.6-beta.2 (2026-05-14) 🎉

**Skill / AI**

- 🔐 **La revue de sécurité des Skills est maintenant entièrement AI-only** : desktop et web partagent désormais un flux commun de pré-vérification de source, contexte de dépôt et revue IA. Les sources bloquées ou internes sont rejetées avant l'appel au modèle, et les installations à haut risque exigent toujours une confirmation explicite

**Sync**

- 🔁 **Cohérence encore renforcée pour export / backup / sync auto-heberge** : Rules, fichiers Skill additionnels et copies gerees traversent maintenant de facon plus fiable le ZIP desktop, WebDAV, la sync auto-hebergee et l'import/export Web. Les flux desktop auto-heberges sont aussi alignes sur le login captcha image, le startup pull et l'upload/download manuel

**Desktop**

- 🧭 **Desktop home et Skill Store encore affines** : la nouvelle home a deux colonnes conserve maintenant correctement la visibilite et l'ordre par glisser-deposer des modules, l'image de fond peut etre activee ou coupee sans etre perdue, et Skill Store se recentre sur une recherche unique en haut avec un flux plus serre pour les sources personnalisees et une meilleure couverture i18n

**Verification**

- 🧪 **La release gate de `0.5.6-beta.2` est revenue au vert** : le `pnpm test:release` desktop repasse maintenant de bout en bout avec lint, typecheck, full unit, integration, build et smoke E2E

> 📋 [Voir le changelog complet](../CHANGELOG.md)

## 🤝 Contribution et développement

### Points d'entrée

- `CONTRIBUTING.md` à la racine : point d'entrée visible depuis GitHub
- `docs/contributing.md` : guide canonical de contribution actuellement en vigueur
- `docs/README.md` : index public de documentation
- `spec/README.md` : index interne SSD / spec

### 🛠️ Stack technique

| Catégorie | Technologie |
| --------- | ----------- |
| Runtime desktop | Electron 33 |
| Frontend desktop | React 18 + TypeScript 5 + Vite 6 |
| Web auto-hébergé | Hono + React + Vite |
| Styles | Tailwind CSS 3 |
| Gestion d'état | Zustand |
| Couche de données | SQLite, `better-sqlite3`, `node-sqlite3-wasm` |
| Paquets monorepo | `packages/shared`, `packages/db` |

### 📁 Structure du dépôt

```text
PromptHub/
├── apps/
│   ├── desktop/   # Desktop Electron + CLI
│   └── web/       # Web auto-hébergé
├── packages/
│   ├── db/        # couche de données partagée
│   └── shared/    # types, constantes et contrats partagés
├── docs/          # documentation publique
├── spec/          # système interne SSD / spec
├── website/       # ressources du site web
├── README.md
├── CONTRIBUTING.md
└── package.json
```

### Commandes courantes

| Tâche | Commande |
| ----- | -------- |
| Développement desktop | `pnpm electron:dev` |
| Développement web | `pnpm dev:web` |
| Build desktop | `pnpm build` |
| Build web | `pnpm build:web` |
| Lint desktop | `pnpm lint` |
| Lint web | `pnpm lint:web` |
| Tests complets desktop | `pnpm test -- --run` |
| Vérification complète web | `pnpm verify:web` |
| CLI depuis les sources | `pnpm --filter @prompthub/cli dev -- --help` |
| E2E | `pnpm test:e2e` |
| Gate de release desktop | `pnpm test:release` |

### Workflow docs et SSD

- `docs/` s'adresse aux utilisateurs, personnes qui déploient et contributeurs
- `spec/` s'adresse au SSD interne, à la documentation stable par domaine, à la logique, aux assets, à l'architecture et aux changements actifs
- Le travail non trivial doit commencer par `spec/changes/active/<change-key>/`
- Chaque changement important doit inclure `proposal.md`, `specs/<domain>/spec.md`, `design.md`, `tasks.md` et `implementation.md`
- Synchronisez la vérité interne durable vers `spec/` et les changements de contrat public vers `docs/` ou `README.md`

Les règles complètes de contribution, les gates de test et les attentes de soumission sont disponibles dans [`contributing.md`](./contributing.md).

## 📄 Licence

Ce projet est distribué sous [AGPL-3.0 License](../LICENSE).

## 💬 Support

- **Issues** : [GitHub Issues](https://github.com/legeling/PromptHub/issues)
- **Discussions** : [GitHub Discussions](https://github.com/legeling/PromptHub/discussions)

## 🙏 Remerciements

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Lucide](https://lucide.dev/)
- Merci à tous les [contributeurs](https://github.com/legeling/PromptHub/graphs/contributors) qui ont amélioré PromptHub

---

<div align="center">
  <p><strong>Si ce projet vous aide, pensez à lui donner une ⭐ !</strong></p>

  <a href="https://www.buymeacoffee.com/legeling" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" />
  </a>
</div>

---

## 💖 Remerciements / Backers

Merci aux personnes suivantes pour leur soutien financier à PromptHub :

| Date | Soutien | Montant | Message |
| :--- | :------ | :------ | :------ |
| 2026-01-08 | \*🌊 | ￥100.00 | Soutien à un excellent logiciel ! |
| 2025-12-29 | \*昊 | ￥20.00 | Merci pour votre logiciel ! Petit soutien |

---

## ☕ Parrainage

Si PromptHub vous aide dans votre travail, vous pouvez offrir un café à l'auteur ☕

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="./imgs/donate/wechat.png" width="200" alt="WeChat Pay"/>
        <br/>
        <b>WeChat Pay</b>
      </td>
      <td align="center">
        <img src="./imgs/donate/alipay.jpg" width="200" alt="Alipay"/>
        <br/>
        <b>Alipay</b>
      </td>
    </tr>
  </table>
</div>

📧 **Contact** : legeling567@gmail.com

Merci à toutes les personnes qui soutiennent le projet. Votre aide alimente sa progression continue.

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/legeling">legeling</a></p>
</div>
