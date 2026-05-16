<div align="center">
  <img src="./imgs/icon.png" alt="PromptHub Logo" width="120" height="120" />
  <h1>PromptHub</h1>
  <p><strong>🚀 All-in-One-KI-Toolbox für Prompts, Skills und Agent-Assets</strong></p>
  <p>Prompts wiederverwenden · Skills mit einem Klick verteilen · Agent-Assets zentral verwalten · Cloud-Sync · Backups · Versionskontrolle</p>

  <p>
    <a href="https://github.com/legeling/PromptHub/stargazers"><img src="https://img.shields.io/github/stars/legeling/PromptHub?style=flat-square&color=yellow" alt="GitHub Stars"/></a>
    <a href="https://github.com/legeling/PromptHub/network/members"><img src="https://img.shields.io/github/forks/legeling/PromptHub?style=flat-square" alt="GitHub Forks"/></a>
    <a href="https://github.com/legeling/PromptHub/releases"><img src="https://img.shields.io/badge/preview-v0.5.6--beta.2-8B5CF6?style=flat-square" alt="Version"/></a>
    <a href="https://github.com/legeling/PromptHub/releases"><img src="https://img.shields.io/github/downloads/legeling/PromptHub/total?style=flat-square&color=blue" alt="Downloads"/></a>
    <img src="https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square" alt="Lizenz: AGPL-3.0"/>
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
    <img src="https://img.shields.io/badge/📥_Jetzt_herunterladen-Releases-blue?style=for-the-badge&logo=github" alt="Download"/>
  </a>
</div>

<br/>

> 💡 **Warum PromptHub?**
>
> PromptHub ist mehr als ein Prompt-Manager. Es ist ein Local-First-Arbeitsbereich für Prompts, SKILL.md-Skills und Agent-Assets. Verwalten Sie Prompts, scannen und verteilen Sie Skills an Claude Code, Cursor, Windsurf, Codex und 15+ KI-Tools und sichern Sie persönliche oder projektbezogene KI-Assets mit Cloud-Sync, Backups, Versionskontrolle und lokalem Datenschutz.

---

## So können Sie PromptHub nutzen

| Format | Geeignet für | Kernnutzen |
| ------ | ------------ | ---------- |
| Desktop-App | Einzelanwender, intensive Prompt-Nutzung, KI-Coding-Workflows | Ein Local-First-Hauptarbeitsbereich für Prompts, Skills und projektbezogene KI-Assets |
| Self-Hosted Web | Browser-Zugriff, Self-Hosting, Nutzung als Backup-/Restore-Ziel | Ein leichter Browser-Arbeitsbereich, der auch als Desktop-Sync-Ziel dienen kann |
| CLI | Batch-Workflows, Skripte, Automatisierung, Pipelines | Direkter Zugriff auf lokale PromptHub-Daten und verwaltete Skill-Repositories |

Wenn Sie neu bei PromptHub sind, ist diese Reihenfolge empfehlenswert:

1. Starten Sie mit der Desktop-App, um Prompts und Skills zu organisieren.
2. Ergänzen Sie WebDAV oder Self-Hosted Web, wenn Sie Browser-Zugriff oder geräteübergreifende Backups brauchen.
3. Nutzen Sie die CLI, sobald Automatisierung notwendig wird.

## 📸 Screenshots

<div align="center">
  <p><strong>Hauptoberfläche</strong></p>
  <img src="./imgs/1-index.png" width="80%" alt="Hauptoberfläche"/>
  <br/><br/>
  <p><strong>Skill-Store</strong></p>
  <img src="./imgs/10-skill-store.png" width="80%" alt="Skill-Store"/>
  <br/><br/>
  <p><strong>Skill-Details und Plattform-Installation</strong></p>
  <img src="./imgs/11-skill-platform-install.png" width="80%" alt="Skill-Details und Plattform-Installation"/>
  <br/><br/>
  <p><strong>Skill-Dateibearbeitung und Versionsvergleich</strong></p>
  <img src="./imgs/12-skill-files-version-diff.png" width="80%" alt="Skill-Dateibearbeitung und Versionsvergleich"/>
  <br/><br/>
  <p><strong>Datensicherung</strong></p>
  <img src="./imgs/4-backup.png" width="80%" alt="Datensicherung"/>
  <br/><br/>
  <p><strong>Theme- und Hintergrund-Einstellungen</strong></p>
  <img src="./imgs/5-theme.png" width="80%" alt="Theme- und Hintergrund-Einstellungen"/>
  <br/><br/>
  <p><strong>Versionsvergleich</strong></p>
  <img src="./imgs/8-version-compare.png" width="80%" alt="Versionsvergleich"/>
</div>

## ✨ Funktionen

### 📝 Prompt-Verwaltung

- Erstellen, bearbeiten und löschen mit Ordnern und Tags
- Automatische Versionshistorie mit Vergleich und Rollback
- Vorlagenvariablen `{{variable}}` für Kopieren, Tests und Verteilung
- Favoriten, Volltextsuche, Anhänge und Medienvorschau

### 🧩 Skill-Verteilung und -Verwaltung

- **Skill-Store**: 20+ kuratierte Skills von Anthropic, OpenAI und mehr
- **Multi-Plattform-Installation**: Ein-Klick-Installation auf Claude Code, Cursor, Windsurf, Codex, Kiro, Gemini CLI, Qoder, QoderWork, CodeBuddy und 15+ Plattformen
- **Lokaler Scan**: Lokale `SKILL.md`-Dateien erkennen, Vorschau anzeigen und gezielt importieren
- **Symlink-/Kopiermodus**: Entweder synchron über Symlink bearbeiten oder unabhängig kopieren
- **Plattform-Zielverzeichnisse**: Skill-Verzeichnisse pro Plattform überschreiben und Scan/Verteilung konsistent halten
- **KI-Übersetzung und Feinschliff**: Ganze Skill-Inhalte direkt in PromptHub übersetzen oder verbessern
- **Tag-Filter**: Skills schnell über die Seitenleiste filtern

### 🤖 Projekte und Agent-Assets

- Scannt typische Projektordner wie `.claude/skills`, `.agents/skills`, `skills` und `.gemini`
- Verwaltet persönliche Bibliotheken, lokale Repos und projektbezogene KI-Assets an einem Ort
- Hält Prompts, Skills und Projekt-Assets durch Local-First-Speicherung, Sync und Backups portabel

### 🧪 KI-Tests und Generierung

- Integrierte KI-Tests für gängige Anbieter
- Parallele Prompt-Vergleiche über mehrere Modelle hinweg
- Tests für Bildgenerierungsmodelle
- KI-gestützte Skill-Erstellung und -Verbesserung

### 💾 Daten und Synchronisierung

- Alle Daten lokal gespeichert, Datenschutz im Fokus
- Vollständige Sicherung und Wiederherstellung mit `.phub.gz`
- WebDAV-Synchronisierung
- Self-Hosted PromptHub Web als Backup- und Restore-Ziel für Desktop
- Synchronisierung beim Start und nach Zeitplan

### 🎨 UI und Sicherheit

- Karten-, Galerie- und Listenansicht
- Dunkel-, Hell- und Systemmodus mit mehreren Farbschemata
- Benutzerdefinierte Hintergrundbilder
- 7 Sprachen, Markdown-Rendering, Syntax-Highlighting und plattformübergreifender Support
- Master-Passwort-Schutz
- Private Ordner (Beta)

## 📥 Desktop-Download und Installation

Wenn Sie PromptHub neu einsetzen, starten Sie am besten mit der Desktop-App.

### Download

Laden Sie den neuesten Preview-Build `v0.5.6-beta.2` von [Releases](https://github.com/legeling/PromptHub/releases) herunter:

| Plattform | Download |
| :-------: | :------- |
| Windows | [![Windows x64](https://img.shields.io/badge/Windows_x64-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-Setup-0.5.6-beta.2-x64.exe) [![Windows arm64](https://img.shields.io/badge/Windows_arm64-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-Setup-0.5.6-beta.2-arm64.exe) |
| macOS | [![macOS Apple Silicon](https://img.shields.io/badge/macOS_Apple_Silicon-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-0.5.6-beta.2-arm64.dmg) [![macOS Intel](https://img.shields.io/badge/macOS_Intel-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-0.5.6-beta.2-x64.dmg) |
| Linux | [![Linux AppImage](https://img.shields.io/badge/Linux_AppImage-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-0.5.6-beta.2-x64.AppImage) [![Linux deb](https://img.shields.io/badge/Linux_deb-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/prompthub_0.5.6-beta.2_amd64.deb) |
| Vorschau | [![Preview Prereleases](https://img.shields.io/badge/Preview_Prereleases-8B5CF6?style=for-the-badge&logo=github&logoColor=white)](https://github.com/legeling/PromptHub/releases?q=prerelease%3Atrue) |

> 💡 **Installationshinweise**
>
> - **macOS**: Apple Silicon (M1/M2/M3/M4) nutzt `arm64`, Intel-Macs `x64`
> - **Windows**: Die meisten Geräte sollten `x64` nutzen; nur Windows on ARM benötigt `arm64`
> - **Vorschaukanal**: Vorschau-Builds erscheinen als GitHub-`Prereleases`; nach Aktivierung prüft PromptHub nur prerelease-Builds
> - **Zurück zu Stable**: Schalten Sie zuerst den Vorschaukanal aus. PromptHub downgradet nie automatisch von einer neueren Vorschau auf eine ältere Stable-Version

### macOS-Installation über Homebrew

```bash
brew tap legeling/tap
brew install --cask prompthub
```

### Upgrade-Pfad für Homebrew-Nutzer

Wenn Sie PromptHub per Homebrew installiert haben, verwenden Sie auch für Updates ausschließlich Homebrew und mischen Sie es nicht mit dem In-App-DMG-Workflow.

```bash
brew update
brew upgrade --cask prompthub
```

Wenn der lokale Homebrew-Status inkonsistent wirkt, installieren Sie das aktuelle Cask neu:

```bash
brew reinstall --cask prompthub
```

> - Nutzer mit manueller DMG/EXE-Installation sollten den In-App-Updater oder GitHub Releases verwenden
> - Homebrew-Nutzer sollten `brew upgrade --cask prompthub` verwenden und nicht zurück zum DMG-Updatepfad wechseln
> - Das Mischen beider Update-Wege kann Homebrew-Version und reale App-Installation auseinanderlaufen lassen

### Erster Start unter macOS

Da die App nicht von Apple notarisiert ist, kann beim ersten Start **"PromptHub ist beschädigt und kann nicht geöffnet werden"** oder **"Entwickler kann nicht verifiziert werden"** erscheinen.

**Empfohlene Lösung**: Öffnen Sie das Terminal und führen Sie folgenden Befehl aus, um Gatekeeper zu umgehen:

```bash
sudo xattr -rd com.apple.quarantine /Applications/PromptHub.app
```

> 💡 **Tipp**: Wenn die App an einem anderen Ort installiert ist, ersetzen Sie den Pfad durch den tatsächlichen Installationspfad.

**Alternativ**: Öffnen Sie "Systemeinstellungen" → "Datenschutz & Sicherheit" → scrollen Sie zum Bereich Sicherheit → klicken Sie auf "Dennoch öffnen".

<div align="center">
  <img src="./imgs/install.png" width="60%" alt="macOS Installationshinweis"/>
</div>

### Desktop aus dem Quellcode ausführen

```bash
git clone https://github.com/legeling/PromptHub.git
cd PromptHub
pnpm install

# Desktop-Entwicklung starten
pnpm electron:dev

# Desktop bauen
pnpm build

# Self-Hosted Web bauen, wenn benötigt
pnpm build:web
```

> `pnpm build` im Repository-Root baut standardmäßig nur die Desktop-App. Für das Web-Build ist `pnpm build:web` zusätzlich nötig.

## 🚀 Schnellstart

### 1. Den ersten Prompt anlegen

Klicken Sie auf „Neu“ und füllen Sie Titel, Beschreibung, `System Prompt`, `User Prompt` und Tags aus.

### 2. Vorlagenvariablen verwenden

Nutzen Sie die Syntax `{{variablen_name}}` in Ihren Prompts:

```text
Bitte übersetze den folgenden {{source_lang}} Text ins {{target_lang}}:

{{text}}
```

### 3. Skills in den Workspace übernehmen

- Häufig genutzte Skills aus dem Skill-Store hinzufügen
- Lokale oder projektbezogene `SKILL.md`-Dateien scannen
- Danach in „My Skills“ weiter bearbeiten, übersetzen, vergleichen und verteilen

### 4. An KI-Tools verteilen

- Zielplattformen wie Claude Code, Cursor, Windsurf, Codex oder Gemini CLI auswählen
- PromptHub installiert die Skills für Sie in die jeweiligen Plattformverzeichnisse

> 🖥️ **Aktuell unterstützte Plattformen**: Claude Code, GitHub Copilot, Cursor, Windsurf, Kiro, Gemini CLI, Trae, OpenCode, Codex CLI, Roo Code, Amp, OpenClaw, Qoder, QoderWork, CodeBuddy

### 5. Sync und Backups einrichten

- WebDAV für geräteübergreifende Synchronisierung konfigurieren
- Oder in `Einstellungen -> Daten` Self-Hosted PromptHub Web als Backup-/Restore-Ziel anbinden

## Kommandozeilen-CLI

PromptHub bietet sowohl GUI als auch CLI. Die CLI eignet sich für Skripte, Batch-Operationen, Importe, Scans und Automatisierung.

### Derzeit verfügbare Wege

> ⚠️ **Aktueller Status**
>
> - Die Desktop-App installiert den Befehl `prompthub` nicht automatisch
> - Dieses Repository bietet derzeit einen standalone CLI-Einstieg aus dem Quellcode, ein gebautes Bundle und einen lokalen Pack/Install-Flow
> - Wenn Sie einen globalen `prompthub`-Befehl benötigen, erstellen Sie das CLI-Tarball im Repository und installieren Sie es lokal

### Lokal packen und global installieren

```bash
pnpm pack:cli
pnpm add -g ./apps/cli/prompthub-cli-*.tgz
prompthub --help
prompthub prompt list
```

### Aus dem Quellcode ausführen

```bash
pnpm --filter @prompthub/cli dev -- --help
pnpm --filter @prompthub/cli dev -- prompt list
pnpm --filter @prompthub/cli dev -- skill list
pnpm --filter @prompthub/cli dev -- skill scan
pnpm --filter @prompthub/cli dev -- skill install ~/.claude/skills/my-skill
```

### Das gebaute CLI-Bundle verwenden

```bash
pnpm build:cli
node apps/cli/out/prompthub.cjs --help
node apps/cli/out/prompthub.cjs prompt list
node apps/cli/out/prompthub.cjs skill list
```

### Häufige Optionen

- `--output json|table`
- `--data-dir /path/to/user-data`
- `--app-data-dir /path/to/app-data`

### Unterstützte Befehle

- `prompt list|get|duplicate|versions|create-version|delete-version|diff|rollback|use|list-tags|rename-tag|delete-tag|create|update|delete|search`
- `folder list|get|create|update|delete|reorder`
- `rules list|scan|read|save|rewrite|add-project|remove-project|version-delete|export|import`
- `workspace export|import`
- `skill list|get|install|scan|delete|remove`

### Hinweise

- Die CLI liest und schreibt direkt in die lokale PromptHub-Datenbank und das verwaltete Skill-Repository
- Die Desktop-App zeigt derzeit nur CLI-Hinweise in den Einstellungen an und installiert keinen Shell-Wrapper
- `apps/cli` kann jetzt auch als lokal gepacktes globales Tarball installiert werden

## 🌐 Self-Hosted Web

PromptHub Web ist ein leichter self-hosted Browser-Arbeitsbereich und kein offizieller SaaS-Dienst. Er eignet sich, wenn Sie:

- PromptHub-Daten im Browser nutzen möchten
- Self-Hosted Web als Desktop-Backup- und Restore-Ziel einsetzen möchten
- nicht nur auf WebDAV setzen, sondern einen direkteren self-hosted Workspace bevorzugen

### Docker Compose Quick Start

Führen Sie dies im Repository-Root aus:

```bash
cd apps/web
cp .env.example .env
docker compose up -d --build
```

Wichtige Variablen:

- `JWT_SECRET`: mindestens 32 zufällige Zeichen für die Authentifizierung
- `ALLOW_REGISTRATION=false`: nach dem Bootstrap empfohlen, damit öffentliche Registrierung deaktiviert bleibt
- `DATA_ROOT`: Root-Verzeichnis für `data/`, `config/`, `logs/` und `backups/`

Standard-URL: `http://localhost:3871`

### Erster Start

- Eine frische Instanz öffnet `/setup` statt der Login-Seite
- Der erste Benutzer wird Administrator
- Nach Erstellung des ersten Admin-Kontos bleibt öffentliche Registrierung deaktiviert

### Desktop mit PromptHub Web verbinden

Konfigurieren Sie in der Desktop-App unter `Einstellungen -> Daten`:

- Self-Hosted PromptHub URL
- Benutzername
- Passwort

Danach kann die Desktop-App:

- die Verbindung testen
- den aktuellen lokalen Workspace nach PromptHub Web hochladen
- von PromptHub Web herunterladen und wiederherstellen
- beim Start einmalig ziehen
- Aktualisierungen nach Zeitplan hochladen

### Daten und Backup

Sichern Sie das gesamte Daten-Root und nicht nur die SQLite-Datei. Typische persistente Pfade sind:

```bash
apps/web/data
apps/web/config
apps/web/logs
```

Diese Verzeichnisse können enthalten:

- `data/prompthub.db`
- `data/prompts/...`
- `data/skills/...`
- `data/assets/...`
- `config/settings/...`
- `backups/...`
- `logs/...`

Vollständige Hinweise zu Deployment, Upgrades, Backups, GHCR-Images und Entwicklung finden Sie in [`web-self-hosted.md`](./web-self-hosted.md).

## 📈 Star History

<a href="https://star-history.com/#legeling/PromptHub&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=legeling/PromptHub&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=legeling/PromptHub&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=legeling/PromptHub&type=Date" />
  </picture>
</a>

## 🗺️ Roadmap

### v0.5.5 (Aktuelle Stable) 🚀

- [x] **Store-Skill-Update-Erkennung**: Store-installierte Skills speichern einen Installations-Hash und können Änderungen am entfernten `SKILL.md` sicher prüfen
- [x] **Vollständige Skill-Dokumentübersetzung**: KI-Übersetzungen arbeiten nun mit dem kompletten `SKILL.md`, unterstützen Voll- und Immersivmodus und speichern Sidecar-Übersetzungen lokal
- [x] **Echter Relaunch für Datenpfadwechsel**: Beim Wechsel des Datenverzeichnisses startet die Desktop-App neu, damit der neue `userData`-Pfad tatsächlich greift
- [x] **Klarere KI-Test- und Übersetzungsfehler**: Modelltests melden jetzt klar „<Modell> Test erfolgreich/fehlgeschlagen“, fehlende Konfiguration, Timeout oder `504` werden explizit erläutert
- [x] **Web-Medien- und Sync-Fixes**: Docker-/Web-Deployments können Medien hochladen und verwechseln normale Ordner beim Sync nicht mehr mit privaten Ordnern

### v0.4.9

- [x] Security-Härtung, Architektur-Refactor, Fix für Skill-Metadatenbearbeitung
- [x] Robustere Migrationsfehlerbehandlung, Code-Qualitätsbereinigung und 720 erfolgreiche Tests

### v0.4.8

- [x] AI Workbench, skills.sh-Community-Store, Löschen einzelner Versionsverläufe
- [x] Backup-/WebDAV-Härtung, klarere Datenpfadmigration, Performance für große Skill-Bibliotheken

### v0.3.x

- [x] Mehrstufige Ordner, Versionskontrolle, Variablenvorlagen
- [x] Multi-Modell-Labor, WebDAV-Sync, Markdown-Rendering
- [x] Mehrere Ansichten, Systemintegration, Sicherheit und Datenschutz

### Zukünftige Pläne

- [ ] **Browser-Erweiterung**: PromptHub direkt in ChatGPT/Claude Web nutzen
- [ ] **Mobile App**: Auf Mobilgeräten ansehen, suchen und bearbeiten
- [ ] **Plugin-System**: Eigene KI-Anbieter und lokale Modelle integrieren
- [ ] **Skill-Marktplatz**: Community-Skills hochladen und teilen

## 📝 Versionsverlauf

Vollständiger Changelog: **[CHANGELOG.md](../CHANGELOG.md)**

### Neuester Preview-Build v0.5.6-beta.2 (2026-05-14) 🎉

**Skill / AI**

- 🔐 **Skill-Sicherheitsprüfung jetzt vollständig AI-only**: Desktop und Web teilen jetzt eine Pipeline aus Quellen-Preflight, Repository-Kontext und AI-Review. Blockierte oder interne Quellen werden vor dem Modellaufruf abgewiesen, High-Risk-Installationen erfordern weiterhin eine ausdrückliche Bestätigung

**Sync**

- 🔁 **Export / Backup / Self-Hosted-Sync weiter vereinheitlicht**: Rules, zusätzliche Skill-Dateien und Managed Copies laufen jetzt robuster durch Desktop-ZIP-Export, WebDAV, Self-Hosted-Sync und Web-Import/Export. Auch die Desktop-Self-Hosted-Flows sind jetzt auf Bild-Captcha-Login, Startup-Pull und manuelles Upload/Download-Verhalten abgestimmt

**Desktop**

- 🧭 **Desktop-Home und Skill Store weiter poliert**: Das neue Zwei-Spalten-Home hält Modul-Sichtbarkeit und Drag-Reihenfolge jetzt stabil, Hintergrundbilder lassen sich getrennt ein- und ausschalten, und der Skill Store nutzt eine einheitliche Suche mit gestrafftem Bearbeitungsfluss für Custom Sources und breiterer Lokalisierung

**Verifizierung**

- 🧪 **Das `0.5.6-beta.2`-Release-Gate ist wieder gruen**: Das Desktop-`pnpm test:release` laeuft jetzt end-to-end durch lint, typecheck, full unit, integration, build und smoke E2E

> 📋 [Vollständigen Changelog ansehen](../CHANGELOG.md)

## 🤝 Mitwirken und Entwickeln

### Einstiegspunkte

- Root-`CONTRIBUTING.md`: GitHub-auffindbarer Einstiegspunkt
- `docs/contributing.md`: aktueller canonical Contribution-Guide
- `docs/README.md`: öffentliches Doku-Index
- `spec/README.md`: internes SSD-/Spec-Index

### 🛠️ Tech-Stack

| Kategorie | Technologie |
| --------- | ----------- |
| Desktop Runtime | Electron 33 |
| Desktop Frontend | React 18 + TypeScript 5 + Vite 6 |
| Self-Hosted Web | Hono + React + Vite |
| Styling | Tailwind CSS 3 |
| State Management | Zustand |
| Datenebene | SQLite, `better-sqlite3`, `node-sqlite3-wasm` |
| Monorepo-Pakete | `packages/shared`, `packages/db` |

### 📁 Repository-Struktur

```text
PromptHub/
├── apps/
│   ├── desktop/   # Electron-Desktop + CLI
│   └── web/       # Self-Hosted Web
├── packages/
│   ├── db/        # gemeinsame Datenebene
│   └── shared/    # gemeinsame Typen, Konstanten, Verträge
├── docs/          # öffentliche Dokumentation
├── spec/          # internes SSD-/Spec-System
├── website/       # Website-Ressourcen
├── README.md
├── CONTRIBUTING.md
└── package.json
```

### Häufige Befehle

| Aufgabe | Befehl |
| ------- | ------ |
| Desktop-Entwicklung | `pnpm electron:dev` |
| Web-Entwicklung | `pnpm dev:web` |
| Desktop-Build | `pnpm build` |
| Web-Build | `pnpm build:web` |
| Desktop-Lint | `pnpm lint` |
| Web-Lint | `pnpm lint:web` |
| Desktop-Gesamttests | `pnpm test -- --run` |
| Web-Gesamtverifikation | `pnpm verify:web` |
| CLI aus dem Quellcode | `pnpm --filter @prompthub/cli dev -- --help` |
| E2E | `pnpm test:e2e` |
| Desktop-Release-Gate | `pnpm test:release` |

### Docs- und SSD-Workflow

- `docs/` ist für Nutzer, Deployments und Mitwirkende gedacht
- `spec/` ist für internes SSD, stabile Fachdomänen, Logik, Assets, Architektur und aktive Changes gedacht
- Nicht triviale Arbeit sollte mit `spec/changes/active/<change-key>/` beginnen
- Jede wichtige Änderung sollte `proposal.md`, `specs/<domain>/spec.md`, `design.md`, `tasks.md` und `implementation.md` enthalten
- Dauerhafte interne Wahrheit zurück nach `spec/` schreiben und externe Vertragsänderungen nach `docs/` oder `README.md` synchronisieren

Vollständige Mitwirkungsregeln, Test-Gates und Abgabeerwartungen stehen in [`contributing.md`](./contributing.md).

## 📄 Lizenz

Dieses Projekt steht unter der [AGPL-3.0 License](../LICENSE).

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/legeling/PromptHub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/legeling/PromptHub/discussions)

## 🙏 Danksagungen

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Lucide](https://lucide.dev/)
- Vielen Dank an alle [Mitwirkenden](https://github.com/legeling/PromptHub/graphs/contributors), die PromptHub verbessert haben

---

<div align="center">
  <p><strong>Wenn Ihnen dieses Projekt hilft, geben Sie ihm bitte ein ⭐!</strong></p>

  <a href="https://www.buymeacoffee.com/legeling" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" />
  </a>
</div>

---

## 💖 Besonderer Dank / Backers

Vielen Dank an die folgenden Unterstützer für ihre Spenden an PromptHub:

| Datum | Unterstützer | Betrag | Nachricht |
| :---- | :----------- | :----- | :-------- |
| 2026-01-08 | \*🌊 | ￥100.00 | Unterstützt großartige Software! |
| 2025-12-29 | \*昊 | ￥20.00 | Danke für deine Software! Kleine Unterstützung |

---

## ☕ Sponsoring

Wenn PromptHub Ihrer Arbeit hilft, können Sie dem Autor gern einen Kaffee spendieren ☕

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

📧 **Kontakt**: legeling567@gmail.com

Danke an alle Unterstützer. Eure Hilfe motiviert die weitere Entwicklung!

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/legeling">legeling</a></p>
</div>
