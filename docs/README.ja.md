<div align="center">
  <img src="./imgs/icon.png" alt="PromptHub Logo" width="120" height="120" />
  <h1>PromptHub</h1>
  <p><strong>🚀 Prompt、Skill、Agent 資産をまとめて扱えるオールインワン AI ツールボックス</strong></p>
  <p>プロンプト再利用 · Skills のワンクリック配布 · Agent 資産の一元管理 · クラウド同期 · バックアップ · バージョン管理</p>

  <p>
    <a href="https://github.com/legeling/PromptHub/stargazers"><img src="https://img.shields.io/github/stars/legeling/PromptHub?style=flat-square&color=yellow" alt="GitHub Stars"/></a>
    <a href="https://github.com/legeling/PromptHub/network/members"><img src="https://img.shields.io/github/forks/legeling/PromptHub?style=flat-square" alt="GitHub Forks"/></a>
    <a href="https://github.com/legeling/PromptHub/releases"><img src="https://img.shields.io/badge/preview-v0.5.6--beta.2-8B5CF6?style=flat-square" alt="Version"/></a>
    <a href="https://github.com/legeling/PromptHub/releases"><img src="https://img.shields.io/github/downloads/legeling/PromptHub/total?style=flat-square&color=blue" alt="Downloads"/></a>
    <img src="https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square" alt="License: AGPL-3.0"/>
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
    <img src="https://img.shields.io/badge/📥_今すぐダウンロード-Releases-blue?style=for-the-badge&logo=github" alt="Download"/>
  </a>
</div>

<br/>

> 💡 **なぜ PromptHub なのか？**
>
> PromptHub は単なる Prompt マネージャーではなく、Prompt、SKILL.md Skills、Agent 資産をまとめて扱うローカルファーストのワークスペースです。プロンプトを整理し、Claude Code、Cursor、Windsurf、Codex など 15 以上の AI ツールへ Skills をスキャン・配布し、クラウド同期、バックアップ、バージョン管理で個人またはプロジェクトの AI 資産を維持できます。

---

## PromptHub をどう使うか

| 形態 | こんな人におすすめ | 中心となる価値 |
| ---- | ------------------ | -------------- |
| デスクトップアプリ | 個人ユーザー、Prompt を多用する人、AI コーディング中心のワークフロー | Prompt、Skill、プロジェクト単位の AI 資産をまとめるローカルファーストの主作業環境 |
| セルフホスト Web | ブラウザアクセス、自前ホスティング、バックアップ / 復元先として使いたい人 | デスクトップの同期先にもなる軽量ブラウザワークスペース |
| CLI | バッチ処理、スクリプト、自動化、パイプライン連携 | ローカル PromptHub データと管理対象 Skill リポジトリへ直接アクセス |

PromptHub を初めて使う場合のおすすめ順は次の通りです。

1. まずデスクトップ版を入れて、Prompt と Skills を整理する。
2. ブラウザアクセスや複数端末バックアップが必要になったら WebDAV やセルフホスト Web を追加する。
3. 自動化が必要になったら CLI を使う。

## 📸 スクリーンショット

<div align="center">
  <p><strong>メイン画面</strong></p>
  <img src="./imgs/1-index.png" width="80%" alt="メイン画面"/>
  <br/><br/>
  <p><strong>Skill ストア</strong></p>
  <img src="./imgs/10-skill-store.png" width="80%" alt="Skill ストア"/>
  <br/><br/>
  <p><strong>Skill 詳細とプラットフォーム導入</strong></p>
  <img src="./imgs/11-skill-platform-install.png" width="80%" alt="Skill 詳細とプラットフォーム導入"/>
  <br/><br/>
  <p><strong>Skill ファイル編集とバージョン差分</strong></p>
  <img src="./imgs/12-skill-files-version-diff.png" width="80%" alt="Skill ファイル編集とバージョン差分"/>
  <br/><br/>
  <p><strong>データバックアップ</strong></p>
  <img src="./imgs/4-backup.png" width="80%" alt="データバックアップ"/>
  <br/><br/>
  <p><strong>テーマと背景設定</strong></p>
  <img src="./imgs/5-theme.png" width="80%" alt="テーマと背景設定"/>
  <br/><br/>
  <p><strong>バージョン比較</strong></p>
  <img src="./imgs/8-version-compare.png" width="80%" alt="バージョン比較"/>
</div>

## ✨ 主な機能

### 📝 Prompt 管理

- フォルダとタグで整理しながら作成・編集・削除
- 履歴を自動保存し、差分確認とロールバックに対応
- テンプレート変数 `{{variable}}` をコピー、テスト、配布時に動的展開
- お気に入り、全文検索、添付ファイル、メディアプレビュー

### 🧩 Skill 配布と管理

- **Skill ストア**：Anthropic、OpenAI などから厳選した 20 以上の Skills
- **マルチプラットフォーム導入**：Claude Code、Cursor、Windsurf、Codex、Kiro、Gemini CLI、Qoder、QoderWork、CodeBuddy など 15 以上へワンクリック導入
- **ローカルスキャン**：ローカルの `SKILL.md` を検出し、プレビューして選択的に取り込み
- **Symlink / Copy モード**：シンボリックリンクで同期編集、または独立コピー
- **プラットフォーム別ターゲットディレクトリ**：各ツールごとに Skill 配置先を上書きしつつ、スキャンと配布を一致させる
- **AI 翻訳とリファイン**：PromptHub 内から Skill 全文を翻訳・改善
- **タグフィルタ**：サイドバーから素早く Skill を絞り込み

### 🤖 プロジェクトと Agent 資産

- `.claude/skills`、`.agents/skills`、`skills`、`.gemini` などの一般的なプロジェクトフォルダをスキャン
- 個人ライブラリ、ローカルリポジトリ、プロジェクト単位の AI 資産を一箇所で管理
- ローカルファースト保存、同期、バックアップで Prompt、Skill、プロジェクト資産を持ち運びやすく維持

### 🧪 AI テストと生成

- 主要プロバイダー向けの AI テストを内蔵
- 同じ Prompt を複数モデルで並列比較
- 画像生成モデルのテスト
- AI による Skill 生成とブラッシュアップ

### 💾 データと同期

- すべてのデータをローカル保存し、プライバシーを優先
- `.phub.gz` による完全バックアップと復元
- WebDAV 同期
- セルフホスト PromptHub Web をデスクトップ版のバックアップ / 復元先として利用可能
- 起動時同期とスケジュール同期

### 🎨 UI とセキュリティ

- カード、ギャラリー、リストの表示モード
- ダーク / ライト / システムテーマと複数のアクセントカラー
- カスタム背景画像
- 7 言語対応、Markdown レンダリング、コードハイライト、クロスプラットフォーム対応
- マスターパスワード保護
- プライベートフォルダ（ベータ）

## 📥 デスクトップ版のダウンロードとインストール

PromptHub を使い始めるなら、まずはデスクトップ版から始めるのがおすすめです。

### ダウンロード

[Releases](https://github.com/legeling/PromptHub/releases) から最新プレビュー版 `v0.5.6-beta.2` をダウンロードしてください。

| プラットフォーム | ダウンロード |
| :--------------: | :----------- |
| Windows | [![Windows x64](https://img.shields.io/badge/Windows_x64-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-Setup-0.5.6-beta.2-x64.exe) [![Windows arm64](https://img.shields.io/badge/Windows_arm64-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-Setup-0.5.6-beta.2-arm64.exe) |
| macOS | [![macOS Apple Silicon](https://img.shields.io/badge/macOS_Apple_Silicon-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-0.5.6-beta.2-arm64.dmg) [![macOS Intel](https://img.shields.io/badge/macOS_Intel-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-0.5.6-beta.2-x64.dmg) |
| Linux | [![Linux AppImage](https://img.shields.io/badge/Linux_AppImage-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/PromptHub-0.5.6-beta.2-x64.AppImage) [![Linux deb](https://img.shields.io/badge/Linux_deb-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.2/prompthub_0.5.6-beta.2_amd64.deb) |
| プレビューチャンネル | [![Preview Prereleases](https://img.shields.io/badge/Preview_Prereleases-8B5CF6?style=for-the-badge&logo=github&logoColor=white)](https://github.com/legeling/PromptHub/releases?q=prerelease%3Atrue) |

> 💡 **インストールのヒント**
>
> - **macOS**：Apple Silicon（M1/M2/M3/M4）は `arm64`、Intel Mac は `x64`
> - **Windows**：大半の環境は `x64`、Windows on ARM のみ `arm64`
> - **プレビューチャンネル**：プレビュー版は GitHub `Prereleases` として公開されます。設定で有効化すると prerelease のみを確認します
> - **安定版に戻るには**：先にプレビューチャンネルをオフにしてください。PromptHub は新しい preview から古い stable に自動ダウングレードしません

### macOS で Homebrew からインストール

```bash
brew tap legeling/tap
brew install --cask prompthub
```

### Homebrew ユーザーのアップグレード方法

Homebrew でインストールした場合は、今後の更新も Homebrew を優先し、アプリ内の DMG 更新と混在させないでください。

```bash
brew update
brew upgrade --cask prompthub
```

状態が不整合な場合は、現在の cask を再インストールしてください。

```bash
brew reinstall --cask prompthub
```

> - DMG/EXE で手動インストールした場合は、アプリ内更新か GitHub Releases を使ってください
> - Homebrew インストールの場合は `brew upgrade --cask prompthub` を使い、DMG の更新経路へ戻さないでください
> - 両方の更新経路を混在させると、Homebrew の記録と実際のアプリ状態がずれることがあります

### macOS 初回起動

このアプリは Apple の公証を受けていないため、初回起動時に **"PromptHub は壊れているため開けません"** または **"開発元を確認できません"** と表示されることがあります。

**推奨される解決方法**：Terminal を開き、以下のコマンドで Gatekeeper の検証を回避してください。

```bash
sudo xattr -rd com.apple.quarantine /Applications/PromptHub.app
```

> 💡 **ヒント**：別の場所にインストールした場合は、実際のパスに置き換えてください。

**または**：「システム設定」→「プライバシーとセキュリティ」→ セキュリティ欄までスクロール → 「このまま開く」を選択してください。

<div align="center">
  <img src="./imgs/install.png" width="60%" alt="macOS インストール"/>
</div>

### ソースからデスクトップ版を実行

```bash
git clone https://github.com/legeling/PromptHub.git
cd PromptHub
pnpm install

# デスクトップ開発環境を起動
pnpm electron:dev

# デスクトップ版をビルド
pnpm build

# セルフホスト Web をビルドする場合
pnpm build:web
```

> リポジトリルートの `pnpm build` はデスクトップ版のみをビルドします。Web が必要な場合は `pnpm build:web` を明示的に実行してください。

## 🚀 クイックスタート

### 1. 最初の Prompt を作成する

「新規」ボタンを押して、タイトル、説明、`System Prompt`、`User Prompt`、タグを入力します。

### 2. テンプレート変数を使う

Prompt の中で `{{variable_name}}` 構文を使います。

```text
以下の {{source_lang}} テキストを {{target_lang}} に翻訳してください：

{{text}}
```

### 3. Skills を作業環境へ取り込む

- Skill ストアからよく使う Skills を追加する
- ローカルまたはプロジェクト内の `SKILL.md` をスキャンする
- 取り込み後は「My Skills」で編集、翻訳、差分確認、配布を続ける

### 4. AI ツールへ配布する

- Claude Code、Cursor、Windsurf、Codex、Gemini CLI などの対象プラットフォームを選ぶ
- PromptHub が各プラットフォームのディレクトリへ Skill を配置する

> 🖥️ **現在対応しているプラットフォーム**：Claude Code、GitHub Copilot、Cursor、Windsurf、Kiro、Gemini CLI、Trae、OpenCode、Codex CLI、Roo Code、Amp、OpenClaw、Qoder、QoderWork、CodeBuddy

### 5. 同期とバックアップを設定する

- WebDAV を設定して複数端末同期を行う
- または `設定 -> データ` でセルフホスト PromptHub Web をバックアップ / 復元先として接続する

## コマンドライン CLI

PromptHub は GUI と CLI の両方を提供します。CLI はスクリプト、バッチ処理、インポート、スキャン、自動化に向いています。

### 現在利用できる方法

> ⚠️ **現在の状態**
>
> - デスクトップ版は `prompthub` コマンドを自動インストールしません
> - 現在のリポジトリには standalone CLI のソース実行入口、ビルド済み bundle、ローカル pack/install フローがあります
> - グローバルな `prompthub` コマンドが必要な場合は、リポジトリ内で CLI tarball を作成してローカルにインストールしてください

### リポジトリからローカル pack してグローバルインストール

```bash
pnpm pack:cli
pnpm add -g ./apps/cli/prompthub-cli-*.tgz
prompthub --help
prompthub prompt list
```

### ソースから実行

```bash
pnpm --filter @prompthub/cli dev -- --help
pnpm --filter @prompthub/cli dev -- prompt list
pnpm --filter @prompthub/cli dev -- skill list
pnpm --filter @prompthub/cli dev -- skill scan
pnpm --filter @prompthub/cli dev -- skill install ~/.claude/skills/my-skill
```

### ビルド済み CLI bundle を使う

```bash
pnpm build:cli
node apps/cli/out/prompthub.cjs --help
node apps/cli/out/prompthub.cjs prompt list
node apps/cli/out/prompthub.cjs skill list
```

### よく使うオプション

- `--output json|table`
- `--data-dir /path/to/user-data`
- `--app-data-dir /path/to/app-data`

### 対応コマンド

- `prompt list|get|duplicate|versions|create-version|delete-version|diff|rollback|use|list-tags|rename-tag|delete-tag|create|update|delete|search`
- `folder list|get|create|update|delete|reorder`
- `rules list|scan|read|save|rewrite|add-project|remove-project|version-delete|export|import`
- `workspace export|import`
- `skill list|get|install|scan|delete|remove`

### 補足

- CLI は PromptHub のローカル DB と管理中の Skill リポジトリを直接読み書きします
- デスクトップ版は CLI の案内のみを表示し、shell コマンド用ラッパーは自動インストールしません
- `apps/cli` は `pnpm pack:cli` で生成したローカル tarball としてもインストールできます

## 🌐 セルフホスト Web

PromptHub Web は軽量なセルフホスト型ブラウザワークスペースであり、公式 SaaS ではありません。次のような用途に向いています。

- ブラウザから自分の PromptHub データにアクセスしたい
- セルフホスト Web をデスクトップ版のバックアップ / 復元先にしたい
- WebDAV だけでなく、より直接的な単体ホスト環境も使いたい

### Docker Compose クイックスタート

リポジトリルートから次を実行します。

```bash
cd apps/web
cp .env.example .env
docker compose up -d --build
```

最低限意識すべき設定は以下です。

- `JWT_SECRET`：認証用に 32 文字以上のランダム文字列
- `ALLOW_REGISTRATION=false`：初期化後は公開登録を止めるため無効化推奨
- `DATA_ROOT`：`data/`、`config/`、`logs/`、`backups/` を含むデータルート

デフォルト URL：`http://localhost:3871`

### 初回セットアップ

- 新規インスタンスはログイン画面ではなく `/setup` から始まる
- 最初のユーザーが管理者になる
- 最初の管理者作成後は公開登録が無効になる

### デスクトップ版から PromptHub Web に接続する

デスクトップの `設定 -> データ` で以下を設定します。

- セルフホスト PromptHub URL
- ユーザー名
- パスワード

その後、デスクトップ版では以下が可能です。

- 接続テスト
- 現在のローカル作業環境を PromptHub Web へアップロード
- PromptHub Web からダウンロードして復元
- 起動時に一度 pull
- 定期的に push

### データとバックアップ

SQLite ファイルだけでなく、データルート全体をバックアップしてください。典型的な永続化パスは次の通りです。

```bash
apps/web/data
apps/web/config
apps/web/logs
```

これらの中には次のような内容が含まれます。

- `data/prompthub.db`
- `data/prompts/...`
- `data/skills/...`
- `data/assets/...`
- `config/settings/...`
- `backups/...`
- `logs/...`

完全なデプロイ、更新、バックアップ、GHCR イメージ、開発メモについては [`web-self-hosted.md`](./web-self-hosted.md) を参照してください。

## 📈 Star History

<a href="https://star-history.com/#legeling/PromptHub&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=legeling/PromptHub&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=legeling/PromptHub&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=legeling/PromptHub&type=Date" />
  </picture>
</a>

## 🗺️ ロードマップ

### v0.5.5（現在の安定版）🚀

- [x] **ストア Skill 更新検出**：ストア導入 Skill のインストール時ハッシュを保持し、リモート `SKILL.md` の更新を安全に確認できます
- [x] **完全な Skill 文書翻訳**：AI 翻訳は完全な `SKILL.md` を対象に sidecar 訳文を生成し、全文翻訳と対照表示に対応します
- [x] **データディレクトリ切り替えの実効化**：データディレクトリ変更後は relaunch により新しい `userData` パスを再適用します
- [x] **AI テストと翻訳エラー表示の改善**：モデルテストは「XX モデル テスト成功 / 失敗」を表示し、未設定・タイムアウト・`504` も明確に案内します
- [x] **Web メディアと同期修正**：メディア表示、通常フォルダの誤ロック、Web ログインパスワード変更を修正しました

### v0.4.9

- [x] セキュリティ強化、アーキテクチャ分割、Skill メタデータ編集修正
- [x] マイグレーション修正、コード品質改善、720 テスト全パス

### v0.4.8

- [x] AI Workbench 実装、skills.sh コミュニティストア、履歴バージョン削除
- [x] バックアップ / WebDAV 強化、データディレクトリ移行表示の修正、大規模 Skill ライブラリの性能改善

### v0.3.x

- [x] 多階層フォルダ、バージョン管理、変数テンプレート
- [x] マルチモデル実験室、WebDAV 同期、Markdown レンダリング
- [x] 複数ビュー、システム連携、セキュリティとプライバシー

### 今後の計画

- [ ] **ブラウザ拡張**：ChatGPT / Claude の Web 画面から PromptHub ライブラリへ直接アクセス
- [ ] **モバイルアプリ**：モバイルで閲覧、検索、簡易編集
- [ ] **プラグインシステム**：独自 AI プロバイダーやローカルモデルを統合
- [ ] **Skill マーケットプレイス**：コミュニティ作成 Skill の共有と配布

## 📝 更新履歴

完全な更新履歴：**[CHANGELOG.md](../CHANGELOG.md)**

### 最新プレビュー版 v0.5.6-beta.2 (2026-05-14) 🎉

**Skill / AI**

- 🔐 **Skill 安全スキャンは AI-only 審査フローへ統一**：Desktop と Web は「ソース事前検査 + リポジトリ文脈 + AI 審査」に統一され、内部 / 制限付きソースはモデル実行前に遮断されます。高リスク導入には引き続き明示的な確認が必要です

**同期 / Sync**

- 🔁 **エクスポート / バックアップ / self-hosted 同期の整合性をさらに補強**：Rules、Skill 追加ファイル、管理コピーが desktop ZIP、WebDAV、self-hosted sync、Web import/export をより安定して往復できるようになり、Desktop の self-hosted フローも画像 captcha ログイン、起動 pull、手動 upload/download の実挙動に揃いました

**Desktop**

- 🧭 **Desktop ホームと Skill Store の操作性を継続改善**：新しい 2 カラムホームはモジュール表示 / 非表示とドラッグ順序を安定して保持し、背景画像は選択したまま ON/OFF できます。Skill Store もトップ検索へ統一され、カスタムソース編集フローと多言語文言がさらに整理されました

**検証 / Verification**

- 🧪 **`0.5.6-beta.2` のリリースゲートは再びグリーン**：desktop `pnpm test:release` が lint、typecheck、full unit、integration、build、smoke E2E を含めて end-to-end で通過しました

> 📋 [完全な更新履歴を見る](../CHANGELOG.md)

## 🤝 コントリビュートと開発

### 入口

- ルート `CONTRIBUTING.md`：GitHub から見つけやすい貢献入口
- `docs/contributing.md`：現在の canonical な貢献ガイド
- `docs/README.md`：公開ドキュメント索引
- `spec/README.md`：内部 SSD / spec 索引

### 🛠️ 技術スタック

| カテゴリ | 技術 |
| -------- | ---- |
| デスクトップ Runtime | Electron 33 |
| デスクトップ Frontend | React 18 + TypeScript 5 + Vite 6 |
| セルフホスト Web | Hono + React + Vite |
| スタイリング | Tailwind CSS 3 |
| 状態管理 | Zustand |
| データ層 | SQLite、`better-sqlite3`、`node-sqlite3-wasm` |
| Monorepo パッケージ | `packages/shared`、`packages/db` |

### 📁 リポジトリ構成

```text
PromptHub/
├── apps/
│   ├── desktop/   # Electron デスクトップ + CLI
│   └── web/       # セルフホスト Web
├── packages/
│   ├── db/        # 共通データ層
│   └── shared/    # 共通型、定数、契約
├── docs/          # 公開ドキュメント
├── spec/          # 内部 SSD / spec システム
├── website/       # Web サイト関連リソース
├── README.md
├── CONTRIBUTING.md
└── package.json
```

### よく使うコマンド

| 用途 | コマンド |
| ---- | -------- |
| デスクトップ開発 | `pnpm electron:dev` |
| Web 開発 | `pnpm dev:web` |
| デスクトップ build | `pnpm build` |
| Web build | `pnpm build:web` |
| デスクトップ lint | `pnpm lint` |
| Web lint | `pnpm lint:web` |
| デスクトップ全テスト | `pnpm test -- --run` |
| Web 全体検証 | `pnpm verify:web` |
| CLI をソースから実行 | `pnpm --filter @prompthub/cli dev -- --help` |
| E2E | `pnpm test:e2e` |
| デスクトップのリリース前ゲート | `pnpm test:release` |

### ドキュメントと SSD ワークフロー

- `docs/` はユーザー、デプロイ担当者、貢献者向け
- `spec/` は内部 SSD、安定したドメイン文書、ロジック、資産、アーキテクチャ、進行中 change 向け
- 非 trivial な作業は `spec/changes/active/<change-key>/` から始める
- 重要な change には `proposal.md`、`specs/<domain>/spec.md`、`design.md`、`tasks.md`、`implementation.md` を含める
- 永続的な内部事実は `spec/` に、対外契約の変化は `docs/` または `README.md` に同期する

完全な貢献ルール、テストゲート、提出要件は [`contributing.md`](./contributing.md) を参照してください。

## 📄 ライセンス

このプロジェクトは [AGPL-3.0 License](../LICENSE) のもとで公開されています。

## 💬 サポート

- **Issues**: [GitHub Issues](https://github.com/legeling/PromptHub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/legeling/PromptHub/discussions)

## 🙏 謝辞

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Lucide](https://lucide.dev/)
- PromptHub を改善してくれたすべての [contributors](https://github.com/legeling/PromptHub/graphs/contributors) に感謝します

---

<div align="center">
  <p><strong>このプロジェクトが役に立ったら、ぜひ ⭐ をお願いします！</strong></p>

  <a href="https://www.buymeacoffee.com/legeling" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" />
  </a>
</div>

---

## 💖 支援者への謝辞 / Backers

PromptHub へご支援いただいた皆さまに感謝します。

| 日付 | 支援者 | 金額 | メッセージ |
| :--- | :----- | :--- | :--------- |
| 2026-01-08 | \*🌊 | ￥100.00 | 素晴らしいソフトを応援します！ |
| 2025-12-29 | \*昊 | ￥20.00 | すばらしいソフトをありがとう。ささやかな支援です |

---

## ☕ 開発を支援する

PromptHub が役立っているなら、作者にコーヒーをごちそうしていただけるとうれしいです ☕

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

📧 **連絡先**: legeling567@gmail.com

支えてくださる皆さま、本当にありがとうございます。皆さまの支援が継続開発の原動力です。

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/legeling">legeling</a></p>
</div>
